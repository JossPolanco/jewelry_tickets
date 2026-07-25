import { supabaseClient } from "../../utils/supabase";

// CONSTANTE DE LA TABLA
const TABLE = "image_metadata";

// FUNCION PARA GUARDAR LA IMAGEN EN LA BASE DE DATOS
export const saveImageMetadata = async ({ uploadedBy, bucket, gallery = "default", storagePath, originalName, fileSize, width, height, mimeType = "image/webp", }) => {
    if (!uploadedBy || !bucket || !storagePath || !fileSize) {
        throw new Error("Faltan campos requeridos para guardar la metadata.")
    }

    const { data, error } = await supabaseClient
        .from(TABLE)
        .insert({
            uploaded_by: uploadedBy,
            bucket,
            gallery,
            storage_path: storagePath,
            original_name: originalName ?? null,
            mime_type: mimeType,
            file_size: fileSize,
            width: width ?? null,
            height: height ?? null,
        })
        .select()
        .single();

    if (error) {
        // Error de unicidad: storage_path ya existe en la tabla
        if (error.code === "23505") {
            throw new Error("Ya existe un registro con ese path de almacenamiento.")
        }

        // Error de FK: el usuario no existe en auth.users
        if (error.code === "23503") {
            throw new Error("El usuario no existe. Verifica la sesión activa.")
        }

        throw new Error(`Error al guardar la metadata: ${error.message}`)
    }

    return { success: true, data: { image: data } };
};

// FUNCION PARA OBTENER IMAGENES DE UN BUCKET
export const getImagesByBucket = async (bucket, gallery = "default", { limit = 50, offset = 0 } = {}) => {
    if (!bucket || !gallery) {
        throw new Error("Se requieren bucket y gallery.")
    }

    const { data, error, count } = await supabaseClient
        .from(TABLE)
        .select("*", { count: "exact" })
        .eq("bucket", bucket)
        .eq("gallery", gallery)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(`Error al obtener las imágenes: ${error.message}`,)
    }

    return {
        success: true,
        data: {
            images: data ?? [],
            total: count ?? 0,
        },
    };
};

// FUNCION PARA OBTENER IMAGENES DE UN USUARIO
export const getImagesByUser = async (bucket, gallery = "default", userId, { limit = 50, offset = 0 } = {}) => {
    if (!bucket || !gallery || !userId) {
        throw new Error("Se requieren bucket, gallery y userId.")
    }

    const { data, error, count } = await supabaseClient
        .from(TABLE)
        .select("*", { count: "exact" })
        .eq("bucket", bucket)
        .eq("gallery", gallery)
        .eq("uploaded_by", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(`Error al obtener las imágenes del usuario: ${error.message}`,)
    }

    return {
        success: true,
        data: {
            images: data ?? [],
            total: count ?? 0,
        },
    };
};

// FUNCION PARA OBTENER IMAGEN POR ID
export const getImageById = async (imageId) => {
    if (!imageId) {
        throw new Error("Se requiere el ID de la imagen.")
    }

    const { data, error } = await supabaseClient
        .from(TABLE)
        .select("*")
        .eq("id", imageId)
        .single();

    if (error) {
        // PGRST116: no se encontró ningún registro con ese ID
        if (error.code === "PGRST116") {
            throw new Error("No se encontró la imagen solicitada.")
        }

        throw new Error(`Error al obtener la imagen: ${error.message}`)
    }

    return { success: true, data: { image: data } };
};

// FUNCION PARA ELIMINAR METADATA DE UNA IMAGEN
export const deleteImageMetadata = async (imageId) => {
    if (!imageId) {
        throw new Error("Se requiere el ID de la imagen.")
    }

    const { error } = await supabaseClient
        .from(TABLE)
        .delete()
        .eq("id", imageId);

    if (error) {
        throw new Error(`Error al eliminar la metadata: ${error.message}`)
    }

    return { success: true };
};

// FUNCION PARA ELIMINAR METADATAS DE IMAGENES
export const deleteImagesMetadata = async (imageIds) => {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
        throw new Error("No se proporcionaron IDs de imágenes.")
    }

    const { error } = await supabaseClient
        .from(TABLE)
        .delete()
        .in("id", imageIds);

    if (error) {
        throw new Error(`Error al eliminar la metadata: ${error.message}`)
    }

    return { success: true };
};

// FUNCION GENÉRICA PARA OBTENER IMÁGENES RELACIONADAS A TRAVÉS DE CUALQUIER TABLA INTERMEDIA
export const getRelatedImages = async ({ relationTable, relationColumn, relationId, limit = 50, offset = 0 }) => {
    if (!relationTable || !relationColumn || !relationId) {
        throw new Error("Se requieren relationTable, relationColumn y relationId.");
    }

    const { data, error, count } = await supabaseClient
        .from(relationTable)
        .select(`
            id,
            order_index,
            image_metadata_id,
            image_metadata:image_metadata_id (
                id,
                uploaded_by,
                bucket,
                gallery,
                storage_path,
                original_name,
                mime_type,
                file_size,
                width,
                height,
                created_at
            )
        `, { count: "exact" })
        .eq(relationColumn, relationId)
        .eq("active", true)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(`Error al obtener las imágenes relacionadas de ${relationTable}: ${error.message}`);
    }

    // Aplanar la estructura para que coincida con el formato de getImagesByBucket
    const images = data
        ? data
            .map((item) => {
                if (!item.image_metadata) return null;
                return {
                    ...item.image_metadata,
                    relationId: item.id,
                    orderIndex: item.order_index,
                };
            })
            .filter(Boolean)
        : [];

    return {
        success: true,
        data: {
            images,
            total: count ?? 0,
        },
    };
};

// FUNCION GENÉRICA PARA RELACIONAR UNA IMAGEN CON CUALQUIER ENTIDAD
export const addRelatedImage = async ({ relationTable, relationColumn, relationId, imageMetadataId, orderIndex = 0 }) => {
    if (!relationTable || !relationColumn || !relationId || !imageMetadataId) {
        throw new Error("Faltan campos requeridos para asociar la imagen.");
    }

    const { data, error } = await supabaseClient
        .from(relationTable)
        .insert({
            [relationColumn]: relationId,
            image_metadata_id: imageMetadataId,
            order_index: orderIndex
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Error al relacionar la imagen en ${relationTable}: ${error.message}`);
    }

    return { success: true, data };
};

// FUNCION PARA OBTENER IMAGENES DE UNA CITA (TRAVÉS DE LA TABLA INTERMEDIA tbl_date_images)
export const getDateImages = async (dateId, options) => {
    return getRelatedImages({
        relationTable: "tbl_date_images",
        relationColumn: "date_id",
        relationId: dateId,
        ...options
    });
};

// FUNCION PARA ASOCIAR UNA IMAGEN A UNA CITA
export const addImageToDate = async (dateId, imageMetadataId, orderIndex = 0) => {
    return addRelatedImage({
        relationTable: "tbl_date_images",
        relationColumn: "date_id",
        relationId: dateId,
        imageMetadataId,
        orderIndex
    });
};