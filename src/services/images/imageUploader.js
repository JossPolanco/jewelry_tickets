/**
 *   SERVICIO DE SUBIDA DE IMAGENES A SUPABASE
 *   RECIBE LA IMAGEN YA VALIDADA Y OPTIMIZADA
 * */
import { supabaseClient } from "../../utils/supabase";

// BUCKETS EN SUPABASE (El único bucket configurado en la base de datos es "photos")
export const BUCKETS = {
    PHOTOS: "photos",
    JEWELRY_PHOTOS: "photos",
    AVATARS: "photos",
    DRAWINGS: "photos",
};

// CONVIERTE CUALQUIER FILE O BLOB A ARRAYBUFFER PARA EVITAR ERRORES DE FETCH EN NAVEGADORES MÓVILES
const fileToArrayBuffer = async (file) => {
    if (typeof file.arrayBuffer === "function") {
        try {
            return await file.arrayBuffer();
        } catch (e) {
            console.warn("[imageUploader] file.arrayBuffer() falló, usando FileReader fallback:", e);
        }
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error("No se pudo leer el archivo como ArrayBuffer."));
        reader.readAsArrayBuffer(file);
    });
};

// GENERADOR SEGURO DE UUID v4 QUE FUNCIONA EN HTTP, HTTPS Y NAVEGADORES MÓVILES
const generateUUID = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        try {
            return crypto.randomUUID();
        } catch {
            // Fallback si falla en contextos no seguros (HTTP)
        }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// GENERA UN PATH ÚNICO PARA CADA IMAGEN
const generateStoragePath = (userId, fileName, mimeType) => {
    const now = new Date();
    const year = now.getFullYear();
    // Mes con padding: 06, 11, etc.
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uuid = generateUUID();
    
    let ext = "webp";
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") ext = "jpg";
    else if (mimeType === "image/png") ext = "png";
    else if (fileName && fileName.includes(".")) {
        const parts = fileName.split(".");
        ext = parts[parts.length - 1].toLowerCase();
    }
    const safeFileName = `${uuid}.${ext}`;

    return `${userId}/${year}/${month}/${safeFileName}`;
};

const validateBucket = (bucket) => {
    // Si viene nulo o desconocido, normalizar a "photos"
    return { success: true, bucket: BUCKETS.PHOTOS };
};

// FUNCION PRINCIPAL PARA SUBIR LA IMAGEN
export const uploadImage = async (file, bucket, userId) => {
    if (!file || !(file instanceof File || file instanceof Blob)) {
        throw new Error("No se proporcionó un archivo válido.");
    }

    if (!userId) {
        throw new Error("Se requiere el ID del usuario para subir imágenes.");
    }

    const targetBucket = BUCKETS.PHOTOS;
    const storagePath = generateStoragePath(userId, file?.name, file?.type);

    // En navegadores móviles (iOS Safari / Android WebViews), fetch() falla con 'Failed to fetch' 
    // si se pasa un File sintético creado en memoria como body. 
    // Convertirlo a ArrayBuffer garantiza envío binario 100% compatible.
    let uploadData;
    try {
        uploadData = await fileToArrayBuffer(file);
    } catch (err) {
        console.warn("[uploadImage] No se pudo convertir a ArrayBuffer, usando file directamente:", err);
        uploadData = file;
    }

    const { error } = await supabaseClient.storage
        .from(targetBucket)
        .upload(storagePath, uploadData, {
            contentType: file.type || "image/webp",
            upsert: true,
        });

    if (error) {
        console.error("[uploadImage] Error en Supabase Storage:", error);
        const message = error.message?.toLowerCase() ?? "";

        if (message.includes("duplicate") || message.includes("already exists")) {
            throw new Error("Ya existe un archivo con ese nombre. Intenta nuevamente.");
        }

        if (message.includes("payload too large") || message.includes("size limit")) {
            throw new Error(
                "El archivo supera el límite de tamaño del servidor. Contacta al administrador.",
            );
        }

        if (message.includes("unauthorized") || message.includes("not authorized") || message.includes("row-level security") || message.includes("policy")) {
            throw new Error(
                "No tienes permisos para subir imágenes. Verifica que tu sesión esté activa.",
            );
        }

        if (typeof window !== "undefined" && window.navigator && window.navigator.onLine === false) {
            throw new Error("Sin conexión a internet. Verifica tu conexión e intenta nuevamente.");
        }

        throw new Error(`Error al subir la imagen: ${error.message || "Error de servidor"}`);
    }

    return {
        success: true,
        data: {
            storagePath,
            bucket: targetBucket,
            fileSize: file.size,
        },
    };
};

// FUNCION PARA ELIMINAR UNA IMAGEN
export const deleteImage = async (storagePath, bucket) => {
    if (!storagePath) {
        throw new Error("Se requiere el path del archivo.");
    }

    const targetBucket = bucket || BUCKETS.PHOTOS || 'photos';

    const { error } = await supabaseClient.storage
        .from(targetBucket)
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

    const targetBucket = bucket || BUCKETS.PHOTOS || 'photos';

    const { error } = await supabaseClient.storage
        .from(targetBucket)
        .remove(storagePaths);

    if (error) {
        throw new Error(`Error al eliminar las imágenes: ${error.message}`);
    }

    return { success: true };
};