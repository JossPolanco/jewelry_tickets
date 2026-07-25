/**
 *   SERVICIO DE SUBIDA DE IMAGENES A SUPABASE
 *   RECIBE LA IMAGEN YA VALIDADA Y OPTIMIZADA
 * */
import { supabaseClient } from "../../utils/supabase";

// BUCKETS EN SUPABASE
export const BUCKETS = {
    PHOTOS: "photos",
    AVATARS: "avatars",
    DRAWINGS: "drawings",
};

// GENERA UN PATCH UNICO PARA CADA IMAGEN
const generateStoragePath = (userId, fileName) => {
    const now = new Date();
    const year = now.getFullYear();
    // Mes con padding: 06, 11, etc.
    const month = String(now.getMonth() + 1).padStart(2, "0");
    // UUID v4 simple usando crypto.randomUUID() nativo del navegador
    const uuid = crypto.randomUUID();
    // Normaliza el nombre: minúsculas, sin espacios, solo extensión .webp
    const safeFileName = `${uuid}.webp`;

    return `${userId}/${year}/${month}/${safeFileName}`;
};

const validateBucket = (bucket) => {
    const validBuckets = Object.values(BUCKETS);

    if (!validBuckets.includes(bucket)) {
        throw new Error(`Bucket inválido: "${bucket}". Usa uno de: ${validBuckets.join(", ")}.`);
    }

    return { success: true };
};

// FUNCION PRINCIPAL PARA SUBIR LA IMAGEN
export const uploadImage = async (file, bucket, userId) => {
    if (!file || !(file instanceof File)) {
        throw new Error("No se proporcionó un archivo válido.");
    }

    if (!userId) {
        throw new Error("Se requiere el ID del usuario para subir imágenes.");
    }

    const bucketCheck = validateBucket(bucket);
    if (!bucketCheck.success) return bucketCheck;

    const storagePath = generateStoragePath(userId, file.name);

    const { error } = await supabaseClient.storage
        .from(bucket)
        .upload(storagePath, file, {
            contentType: "image/webp",
            upsert: false,
        });

    if (error) {
        const message = error.message?.toLowerCase() ?? "";

        if (message.includes("duplicate") || message.includes("already exists")) {
            throw new Error("Ya existe un archivo con ese nombre. Intenta nuevamente.");
        }

        if (message.includes("payload too large") || message.includes("size limit")) {
            throw new Error(
                "El archivo supera el límite de tamaño del servidor. Contacta al administrador.",
            );
        }

        if (message.includes("unauthorized") || message.includes("not authorized") || message.includes("row-level security")) {
            throw new Error(
                "No tienes permisos para subir imágenes. Verifica que tu sesión esté activa.",
            );
        }

        if (message.includes("network") || message.includes("fetch") || message.includes("failed")) {
            throw new Error(
                "Error de conexión. Verifica tu internet e intenta nuevamente.",
            );
        }

        throw new Error(`Error al subir la imagen: ${error.message}`);
    }

    return {
        success: true,
        data: {
            storagePath,
            bucket,
            fileSize: file.size,
        },
    };
};

// FUNCION PARA ELIMINAR UNA IMAGEN
export const deleteImage = async (storagePath, bucket) => {
    if (!storagePath) {
        throw new Error("Se requiere el path del archivo.");
    }

    const bucketCheck = validateBucket(bucket);
    if (!bucketCheck.success) throw new Error("Bucket inválido.");

    const { error } = await supabaseClient.storage
        .from(bucket)
        .remove([storagePath]);

    if (error) {
        throw new Error(`Error al eliminar la imagen: ${error.message}`);
    }

    return { success: true };
};

// FUNCION PARA ELIMINAR MULTIPLES IMAGENES
export const deleteImages = async (storagePaths, bucket) => {
    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
        throw new Error("No se proporcionaron paths de archivos.");
    }

    const bucketCheck = validateBucket(bucket);
    if (!bucketCheck.success) throw new Error("Bucket inválido.");

    const { error } = await supabaseClient.storage
        .from(bucket)
        .remove(storagePaths);

    if (error) {
        throw new Error(`Error al eliminar las imágenes: ${error.message}`);
    }

    return { success: true };
};