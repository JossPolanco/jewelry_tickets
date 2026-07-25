/**
 * SERVICIO PARA VALIDAR EL TIPO DE IMAGEN
 */

// Tipos de MIME permitidos
const ALLOWED_MIME_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
]);

const MAGIC_BYTES = {
    "image/jpeg": {
        bytes: new Uint8Array([0xff, 0xd8, 0xff]),
        offset: 0,
    },
    "image/png": {
        bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
        offset: 0,
    },
    "image/webp": {
        // WebP tiene su firma en los bytes 8-11: "WEBP"
        bytes: new Uint8Array([0x57, 0x45, 0x42, 0x50]),
        offset: 8,
    },
};

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB


const readFileHeader = (file, byteCount = 12) => {
    return new Promise((resolve, reject) => {
        const slice = file.slice(0, byteCount);
        const reader = new FileReader();

        reader.onload = (e) => resolve(new Uint8Array(e.target.result));
        reader.onerror = () =>
            reject(new Error("No se pudo leer el encabezado del archivo."));

        reader.readAsArrayBuffer(slice);
    });
};


const matchesMagicBytes = (fileHeader, mimeType) => {
    const signature = MAGIC_BYTES[mimeType];
    if (!signature) return false;

    const { bytes, offset } = signature;

    for (let i = 0; i < bytes.length; i++) {
        if (fileHeader[offset + i] !== bytes[i]) return false;
    }

    return true;
};

// FUNCION PARA VALIDAR SI EL ARCHIVO EXISTE Y NO ESTA VACIO
export const validateFileExists = (file) => {
    if (!file || !(file instanceof File)) {
        throw new Error("No se proporcionó un archivo válido.");
    }

    if (file.size === 0) {
        throw new Error("El archivo está vacío.");
    }

    return { success: true };
};

// FUNCION PARA VALIDAR EL TIPO MIME DEL ARCHIVO
export const validateMimeType = (file) => {
    const mimeType = file.type.toLowerCase();

    if (!mimeType) {
        throw new Error("No se pudo determinar el tipo del archivo.");
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        const allowed = [...ALLOWED_MIME_TYPES]
            .map((t) => t.replace("image/", "").toUpperCase())
            .join(", ");

        throw new Error(`Tipo de archivo no permitido. Solo se aceptan: ${allowed}.`);
    }

    return { success: true, data: { mimeType } };
};

// FUNCION PARA VALIDAR EL TAMAÑO DEL ARCHIVO
export const validateFileSize = (file) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
        const maxMB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
        const actualMB = (file.size / (1024 * 1024)).toFixed(1);

        throw new Error(`El archivo pesa ${actualMB} MB. El máximo permitido es ${maxMB} MB.`);
    }

    return { success: true, data: { fileSizeBytes: file.size } };
};

// FUNCION PARA VALIDAR LOS MAGIC BYTES DEL ARCHIVO, SOLO EL ENCABZADO DEL ARCHIVO SE LEE, NO EL ARCHIVO COMPLETO
export const validateMagicBytes = async (file, declaredMimeType) => {
    try {
        const header = await readFileHeader(file, 12);

        // jpeg y jpg son el mismo formato
        const normalizedMime = declaredMimeType === "image/jpg" ? "image/jpeg" : declaredMimeType;

        if (!matchesMagicBytes(header, normalizedMime)) {
            throw new Error("El archivo no es una imagen válida o está dañado. Intenta con otro archivo.");
        }

        return { success: true };
    } catch {
        throw new Error("No se pudo verificar la integridad del archivo.");
    }
};


/**
 *  VALIDA UNA IMAGEN COMPLETA: EXISTENCIA, MIME, TAMAÑO Y MAGIC BYTES
 */
export const validateImage = async (file) => {
    // EXITENCIA DEL ARCHIVO
    const existsCheck = validateFileExists(file);
    if (!existsCheck.success) return existsCheck;

    // MIME TYPE DECLARADO
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

// FUNCION PARA VALIDAR MULTIPLES IMAGENES, DEVUELVE UN OBJETO CON LOS RESULTADOS DE CADA IMAGEN
export const validateImages = async (files) => {
    if (!Array.isArray(files) || files.length === 0) {
        return { success: false, error: "No se proporcionaron archivos." };
    }

    // VALIDA CADA IMAGEN Y GUARDA LOS RESULTADOS EN UN ARRAY
    const results = await Promise.all(
        files.map(async (file) => {
            const validation = await validateImage(file);
            return { file, validation };
        })
    );

    const failed = results.filter((r) => !r.validation.success);

    // SI HAY ERRORES, DEVUELVE UN OBJETO CON LOS ERRORES DE CADA IMAGEN
    if (failed.length > 0) {
        return {
            success: false,
            error: `${failed.length} archivo(s) no pasaron la validación.`,
            errors: failed.map((r) => ({
                fileName: r.file.name,
                error: r.validation.error,
            })),
        };
    }

    // SI TODAS LAS IMAGENES PASARON LA VALIDACION, DEVUELVE UN OBJETO CON LOS DATOS DE CADA IMAGEN
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