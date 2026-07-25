/** 
 * SERVICIO DE GENERACION DE URLs PARA ACCEDER A LAS IMAGENES,
 * TODAS LAS URLs SON FIRMADAS CON EXPIRACION CONFIGURABLE
 */
import { supabaseClient } from "../../utils/supabase";

// CONFIGURACION DE EXPIRACION
export const URL_EXPIRY = {
    GALLERY: 60 * 60, // 1 hora  — para listar imágenes en galería
    DETAIL: 60 * 15, // 15 min  — para ver una imagen en detalle
    DOWNLOAD: 60 * 5, // 5 min   — para descarga directa
};

// FUNCION PARA OBTENER LAS URLs DE LAS IMAGENES 
export const getSignedUrl = async (storagePath, bucket, expiresIn = URL_EXPIRY.GALLERY) => {
    if (!storagePath || !bucket) {
        throw new Error("Se requieren storagePath y bucket para generar la URL.");
    }

    const { data, error } = await supabaseClient.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresIn);

    if (error) {
        throw new Error(`Error al generar la URL: ${error.message}`)
    }

    return {
        success: true,
        data: {
            signedUrl: data.signedUrl,
            expiresIn,
        },
    };
};

// 
export const getSignedUrls = async (images, bucket, expiresIn = URL_EXPIRY.GALLERY,) => {
    if (!Array.isArray(images) || images.length === 0) {
        throw new error("No se proporcionaron imágenes.")
    }

    if (!bucket) {
        throw new error("Se requiere el nombre del bucket.")
    }

    const paths = images.map((img) => img.storagePath);

    const { data, error } = await supabaseClient.storage
        .from(bucket)
        .createSignedUrls(paths, expiresIn);

    if (error) {
        throw new error(`Error al generar las URLs: ${error.message}`)
    }

    // Supabase retorna los resultados en el mismo orden que los paths enviados.
    // Mapeamos de vuelta para incluir el id original y facilitar la asociación en UI.
    const urls = data.map((entry, index) => ({
        id: images[index].id,
        storagePath: images[index].storagePath,
        signedUrl: entry.signedUrl ?? null,
        // Supabase puede retornar error por path individual si el archivo no existe
        error: entry.error ?? null,
    }));

    // SEPARAR LOS QUE FALLARON
    const failed = urls.filter((u) => u.error || !u.signedUrl);

    if (failed.length === urls.length) {
        throw new error("No se pudo generar ninguna URL. Verifica que los archivos existen en Storage.")

    }

    return {
        success: true,
        data: { urls },
        // Incluir advertencia si algunas fallaron pero otras no
        ...(failed.length > 0 && {
            warning: `${failed.length} imagen(es) no pudieron generar URL (posiblemente eliminadas de Storage).`,
        }),
    };
};

export const getTransformedUrl = async (storagePath, bucket, transform = {}, expiresIn = URL_EXPIRY.GALLERY,) => {
    if (!storagePath || !bucket) {
        throw new error("Se requieren storagePath y bucket.")
    }

    const {
        width = 300,
        height = 300,
        resize = "cover",
        quality = 75,
    } = transform;

    const { data, error } = await supabaseClient.storage
        .from(bucket)
        .createSignedUrl(storagePath, expiresIn, {
            transform: { width, height, resize, quality },
        });

    if (error) {
        // Si Image Transformations no está habilitado, Supabase devuelve un error específico.
        // En ese caso, caemos back a una URL sin transformar para no romper la UI.
        if (
            error.message?.includes("Transformations") ||
            error.message?.includes("not enabled")
        ) {
            console.warn(
                "[imageUrl] Image Transformations no está habilitado en este proyecto. " +
                "Retornando URL sin transformar. Habilítalo en el dashboard de Supabase.",
            );
            return getSignedUrl(storagePath, bucket, expiresIn);
        }

        throw new error(`Error al generar URL con transformación: ${error.message}`)
    }

    return {
        success: true,
        data: { signedUrl: data.signedUrl },
    };
};

/**
 * Generic helper to resolve signed URLs for any list of items containing a relationship to image_metadata.
 * It batches the requests to Supabase storage to optimize performance.
 */
export const resolveSignedUrlsForItems = async (items, pathKey = "image_metadata.storage_path", bucketKey = "image_metadata.bucket", urlOutputKey = "coverUrl") => {
    const getNested = (obj, path) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    if (!items || items.length === 0) return [];

    const itemsWithImages = items.filter(item => getNested(item, pathKey));
    if (itemsWithImages.length === 0) {
        return items.map(item => ({ ...item, [urlOutputKey]: null }));
    }

    try {
        const imagesForSigned = itemsWithImages.map(item => ({
            id: item.id,
            storagePath: getNested(item, pathKey)
        }));

        const firstItem = itemsWithImages[0];
        const bucket = getNested(firstItem, bucketKey) || "photos";

        const urlsResult = await getSignedUrls(imagesForSigned, bucket, URL_EXPIRY.GALLERY);
        if (urlsResult.success) {
            const urlMap = new Map(urlsResult.data.urls.map(u => [u.id, u.signedUrl]));
            return items.map(item => ({
                ...item,
                [urlOutputKey]: urlMap.get(item.id) ?? null
            }));
        }
    } catch (e) {
        console.error("Error in resolveSignedUrlsForItems:", e);
    }

    return items.map(item => ({ ...item, [urlOutputKey]: null }));
};
