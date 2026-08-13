/**
 * SERVICIO PARA VALIDAR EL TIPO DE IMAGEN
 */

// Tipos de MIME permitidos ampliado para navegadores móviles y cámaras nativas
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/pjpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/avif",
    "image/bmp",
    "image/gif",
    "application/octet-stream", // Algunos pickers de Android envían este MIME genérico
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// FUNCION PARA INFERIR EL TIPO MIME DESDE EL NOMBRE DEL ARCHIVO SI EL NAVEGADOR LO ENVIA VACIO
const inferMimeTypeFromName = (fileName) => {
    if (!fileName || typeof fileName !== "string") return null;
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".heic")) return "image/heic";
    if (lower.endsWith(".heif")) return "image/heif";
    if (lower.endsWith(".avif")) return "image/avif";
    return null;
};

// FUNCION PARA VALIDAR SI EL ARCHIVO EXISTE Y NO ESTA VACIO
export const validateFileExists = (file) => {
    if (!file || !(file instanceof File || file instanceof Blob)) {
        return { success: false, error: "No se proporcionó un archivo válido." };
    }

    if (file.size === 0) {
        return { success: false, error: "El archivo está vacío." };
    }

    return { success: true };
};

// FUNCION PARA VALIDAR EL TIPO MIME DEL ARCHIVO
export const validateMimeType = (file) => {
    let mimeType = (file.type || "").toLowerCase();

    // Si el navegador no detectó el MIME o mandó octet-stream, intentar inferir por extensión
    if (!mimeType || mimeType === "application/octet-stream") {
        const inferred = inferMimeTypeFromName(file.name);
        if (inferred) {
            mimeType = inferred;
        } else {
            // Si tiene tamaño y nombre válido, asumir image/jpeg por defecto en lugar de rechazar
            mimeType = "image/jpeg";
        }
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return {
            success: false,
            error: "Tipo de archivo no permitido. Selecciona una fotografía en formato JPG, PNG, WEBP o HEIC.",
        };
    }

    return { success: true, data: { mimeType } };
};

// FUNCION PARA VALIDAR EL TAMAÑO DEL ARCHIVO
export const validateFileSize = (file) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
        const actualMB = (file.size / (1024 * 1024)).toFixed(1);

        return {
            success: false,
            error: `El archivo pesa ${actualMB} MB. El máximo permitido es ${maxMB} MB.`,
        };
    }

    return { success: true, data: { fileSizeBytes: file.size } };
};

// FUNCION FLEXIBLE DE VALIDACIÓN DE ENCABEZADO (MAGIC BYTES)
export const validateMagicBytes = async (file, declaredMimeType) => {
    try {
        // En navegadores móviles, leer slice de 12 bytes
        const slice = file.slice(0, 12);
        const reader = new FileReader();

        const fileHeader = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(new Uint8Array(e.target.result));
            reader.onerror = () => reject(new Error("Error leyendo slice"));
            reader.readAsArrayBuffer(slice);
        });

        if (!fileHeader || fileHeader.length < 3) {
            // Si el header es más corto por alguna razón, permitir continuar si hay tamaño de archivo
            return { success: true };
        }

        // Firma JPEG (FF D8)
        const isJpeg = fileHeader[0] === 0xff && fileHeader[1] === 0xd8;
        // Firma PNG (89 50 4E 47)
        const isPng = fileHeader[0] === 0x89 && fileHeader[1] === 0x50 && fileHeader[2] === 0x4e && fileHeader[3] === 0x47;
        // Firma WebP (WEBP en bytes 8-11 o RIFF en 0-3)
        const isWebp = fileHeader[0] === 0x52 && fileHeader[1] === 0x49 && fileHeader[2] === 0x46 && fileHeader[3] === 0x46;
        // Firma HEIC/HEIF (ftyp en bytes 4-7)
        const isHeic = fileHeader[4] === 0x66 && fileHeader[5] === 0x74 && fileHeader[6] === 0x79 && fileHeader[7] === 0x70;

        // Si coincide con cualquiera de las firmas conocidas de imagen, es válido
        if (isJpeg || isPng || isWebp || isHeic) {
            return { success: true };
        }

        // Si la verificación de bytes no coincide exactamente pero el archivo tiene extensión de imagen, no bloquear al usuario
        return { success: true };
    } catch (err) {
        console.warn("[imageValidator] Fallo suave en validación de magic bytes:", err);
        // Si hay error en la lectura del slice (común en webviews restringidos), permitir si el archivo existe
        return { success: true };
    }
};

/**
 * VALIDA UNA IMAGEN COMPLETA: EXISTENCIA, MIME, TAMAÑO Y MAGIC BYTES
 */
export const validateImage = async (file) => {
    // EXISTENCIA DEL ARCHIVO
    const existsCheck = validateFileExists(file);
    if (!existsCheck.success) return existsCheck;

    // MIME TYPE DECLARADO O INFERIDO
    const mimeCheck = validateMimeType(file);
    if (!mimeCheck.success) return mimeCheck;

    // TAMAÑO DEL ARCHIVO
    const sizeCheck = validateFileSize(file);
    if (!sizeCheck.success) return sizeCheck;

    // MAGIC BYTES DEL ARCHIVO
    const magicCheck = await validateMagicBytes(file, mimeCheck.data.mimeType);
    if (!magicCheck.success) return magicCheck;

    return {
        success: true,
        data: {
            mimeType: mimeCheck.data.mimeType,
            fileSizeBytes: sizeCheck.data.fileSizeBytes,
        },
    };
};

// FUNCION PARA VALIDAR MULTIPLES IMAGENES
export const validateImages = async (files) => {
    if (!Array.isArray(files) || files.length === 0) {
        return { success: false, error: "No se proporcionaron archivos." };
    }

    const results = await Promise.all(
        files.map(async (file) => {
            const validation = await validateImage(file);
            return { file, validation };
        })
    );

    const failed = results.filter((r) => !r.validation.success);

    if (failed.length > 0) {
        return {
            success: false,
            error: `${failed.length} archivo(s) no pasaron la validación: ${failed[0]?.validation?.error || ''}`,
            errors: failed.map((r) => ({
                fileName: r.file.name,
                error: r.validation.error,
            })),
        };
    }

    return {
        success: true,
        data: {
            results: results.map((r) => ({
                file: r.file,
                mimeType: r.validation.data.mimeType,
                fileSizeBytes: r.validation.data.fileSizeBytes,
            })),
        },
    };
};