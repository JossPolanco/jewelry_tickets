/**
 * Hook para recuperar imágenes desde PostgreSQL y generar sus Signed URLs..
 */

import { getSignedUrls, getSignedUrl, getTransformedUrl, URL_EXPIRY } from "@/services/images/imageUrl";
import { getImagesByBucket, getImageById, getDateImages, getRelatedImages, deleteImageMetadata } from "@/services/images/imageMetadata";
import { deleteImage } from "@/services/images/imageUploader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const imageKeys = {
    all: ["images"],
    list: (bucket, gallery, customKey = null) => ["images", bucket, gallery, customKey].filter(Boolean),
    detail: (id) => ["images", "detail", id],
};

export const useImages = (bucket, gallery = "default", { limit = 50, offset = 0, enabled = true, relation = null, dateId = null } = {}) => {
    const customKey = relation
        ? `${relation.table}-${relation.id}`
        : (dateId ? `date-${dateId}` : null);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: imageKeys.list(bucket, gallery, customKey),
        queryFn: () => fetchImagesWithUrls(bucket, gallery, { limit, offset, dateId, relation }),
        enabled: (Boolean(bucket) && Boolean(gallery) && enabled) || (Boolean(relation?.id) && enabled) || (Boolean(dateId) && enabled),

        // ── Configuración de caché ──────────────────────────────────────────────
        // staleTime: durante 5 minutos, react-query no refetch aunque el componente
        // se monte/desmonte o el usuario cambie de pestaña.
        staleTime: 5 * 60 * 1000,

        // gcTime: los datos se eliminan de memoria 30 min después de que
        // el último componente que los usa se desmonte.
        gcTime: 30 * 60 * 1000,

        // No refetch al volver a enfocar la ventana: las imágenes no cambian
        // tan frecuentemente como para justificar el request.
        refetchOnWindowFocus: false,

        // Reintentar solo 1 vez en caso de error de red antes de mostrar error.
        retry: 1,
    });

    return {
        images: data?.images ?? [],
        total: data?.total ?? 0,
        isLoading,
        isError,
        error,
        refetch,
    };
};

const fetchImagesWithUrls = async (bucket, gallery, { limit, offset, dateId, relation }) => {
    // 1. Obtener metadata desde PostgreSQL (usar query de relación genérica si se pasa, de lo contrario cita, de lo contrario normal)
    let metadataResult;
    if (relation) {
        metadataResult = await getRelatedImages({
            relationTable: relation.table,
            relationColumn: relation.column,
            relationId: relation.id,
            limit,
            offset
        });
    } else if (dateId) {
        metadataResult = await getDateImages(dateId, { limit, offset });
    } else {
        metadataResult = await getImagesByBucket(bucket, gallery, { limit, offset });
    }

    if (!metadataResult.success) {
        throw new Error(metadataResult.error);
    }

    const { images, total } = metadataResult.data;

    if (images.length === 0) {
        return { images: [], total };
    }

    // 2. Generar Signed URLs en batch (una sola llamada a Supabase)
    const urlsResult = await getSignedUrls(
        images.map((img) => ({ id: img.id, storagePath: img.storage_path })),
        bucket,
        URL_EXPIRY.GALLERY
    );

    if (!urlsResult.success) {
        throw new Error(urlsResult.error);
    }

    // 3. Combinar metadata con sus URLs
    // Construimos un Map por id para O(1) lookup en lugar de O(n²) con find()
    const urlMap = new Map(
        urlsResult.data.urls.map((u) => [u.id, u.signedUrl])
    );

    const imagesWithUrls = images.map((img) => ({
        ...img,
        signedUrl: urlMap.get(img.id) ?? null,
    }));

    return { images: imagesWithUrls, total };
};

export const useImageDetail = (image, enabled = true) => {
    const { data, isLoading, isError } = useQuery({
        queryKey: imageKeys.detail(image?.id),
        queryFn: async () => {
            // Intenta obtener URL con transformación (imagen mediana optimizada para detalle)
            const result = await getTransformedUrl(
                image.storage_path,
                image.bucket,
                { width: 1200, resize: "contain", quality: 90 },
                URL_EXPIRY.DETAIL
            );

            if (!result.success) throw new Error(result.error);
            return result.data.signedUrl;
        },
        enabled: Boolean(image?.id) && enabled,

        // Las URLs de detalle se cachean 10 minutos (menos que la galería
        // porque el usuario abre pocas fotos en detalle, no todas)
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    return {
        signedUrl: data ?? null,
        isLoading,
        isError,
    };
};

export const useSingleImage = (imageId, options = {}) => {
    return useQuery({
        queryKey: imageKeys.detail(imageId),
        queryFn: async () => {
            if (!imageId) return null;
            const metadataResult = await getImageById(imageId);
            if (!metadataResult.success) {
                throw new Error("No se pudo obtener la metadata de la imagen.");
            }
            const img = metadataResult.data.image;
            const urlResult = await getSignedUrl(img.storage_path, img.bucket, URL_EXPIRY.GALLERY);
            if (!urlResult.success) {
                throw new Error("No se pudo firmar la URL de la imagen.");
            }
            return {
                ...img,
                signedUrl: urlResult.data.signedUrl
            };
        },
        enabled: Boolean(imageId) && (options.enabled ?? true),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        ...options
    });
};

export const useDeleteImage = ({ bucket, gallery, dateId = null, relation = null, onSuccess, onError } = {}) => {
    const queryClient = useQueryClient();
    const customKey = relation
        ? `${relation.table}-${relation.id}`
        : (dateId ? `date-${dateId}` : null);

    return useMutation({
        mutationFn: async (image) => {
            if (!image || !image.id || !image.storage_path) {
                throw new Error("Imagen inválida para eliminar.");
            }
            // 1. Eliminar metadata en base de datos (con cascade delete para la tabla intermedia)
            const dbResult = await deleteImageMetadata(image.id);
            if (!dbResult.success) {
                throw new Error("No se pudo eliminar la metadata de la imagen.");
            }

            // 2. Eliminar del Storage
            const storageResult = await deleteImage(image.storage_path, bucket);
            if (!storageResult.success) {
                console.warn("[useDeleteImage] Falló la eliminación del storage, pero la metadata ya fue borrada.", image.storage_path);
            }

            return image;
        },
        onSuccess: (image) => {
            queryClient.invalidateQueries({ queryKey: imageKeys.list(bucket, gallery, customKey) });
            if (onSuccess) {
                onSuccess(image);
            }
        },
        onError: (err) => {
            console.error("Error al eliminar la imagen:", err);
            if (onError) {
                onError(err);
            }
        }
    });
};