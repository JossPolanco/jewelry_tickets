import imageCompression from "browser-image-compression";

export const OPTIMIZATION_PROFILES = {
    photo: {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1920,
        initialQuality: 0.8,
        useWebWorker: true,
        fileType: "image/webp",
    },
    photos: {
        maxSizeMB: 1.2,
        maxWidthOrHeight: 1920,
        initialQuality: 0.8,
        useWebWorker: true,
        fileType: "image/webp",
    },
    avatar: {
        maxSizeMB: 0.15,
        maxWidthOrHeight: 400,
        initialQuality: 0.85,
        useWebWorker: true,
        fileType: "image/webp",
    },
    drawing: {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1440,
        initialQuality: 0.82,
        useWebWorker: true,
        fileType: "image/webp",
    },
    thumbnail: {
        maxSizeMB: 0.05,
        maxWidthOrHeight: 300,
        initialQuality: 0.7,
        useWebWorker: true,
        fileType: "image/webp",
    },
};

// FORMATO SEGURO DE ERRORES (EVITA [object ProgressEvent] O "Error desconocido")
const formatErrorDetail = (err) => {
    if (!err) return "Error desconocido";
    if (typeof err === "string") return err;
    if (err instanceof Error && err.message) return err.message;
    if (err.message && typeof err.message === "string") return err.message;
    if (typeof ProgressEvent !== "undefined" && err instanceof ProgressEvent) {
        return `Error de lectura de archivo (${err.type || "ProgressEvent"})`;
    }
    if (err.type && typeof err.type === "string") {
        return `Evento de error de navegador (${err.type})`;
    }
    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
};

const getExtensionForMime = (mimeType) => {
    if (mimeType === "image/webp") return "webp";
    if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
    if (mimeType === "image/png") return "png";
    return "webp";
};

const buildOptimizedFileName = (originalName, mimeType = "image/webp") => {
    const nameWithoutExt = originalName ? originalName.replace(/\.[^/.]+$/, "") : "image";
    const ext = getExtensionForMime(mimeType);
    return `${nameWithoutExt}.${ext}`;
};

// FUNCION PARA CONVERTIR UN FILE O BLOB A DATA URL (PREVIEW)
const blobToDataUrl = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error("No se pudo generar la vista previa."));
        reader.readAsDataURL(blob);
    });
};

// MULTI-ESTRATEGIA ROBUSTA PARA CARGAR IMAGENES DESDE CUALQUIER NAVEGADOR / WEBVIEW MÓVIL
const loadImageSource = async (file) => {
    // 1. Método A: createImageBitmap (Nativo de navegador, ultra rápido, decodificación C++)
    if (typeof createImageBitmap === "function") {
        try {
            const bitmap = await createImageBitmap(file);
            return {
                type: "bitmap",
                source: bitmap,
                width: bitmap.width,
                height: bitmap.height,
                close: () => bitmap.close(),
            };
        } catch (err) {
            console.warn("[imageOptimizer] createImageBitmap no disponible o falló:", err);
        }
    }

    // 2. Método B: FileReader -> DataURL (Base64 inline, 100% inmune a restricciones origin/blob de WebViews)
    try {
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error("FileReader DataURL falló"));
            reader.readAsDataURL(file);
        });

        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("Carga de Image por DataURL falló"));
            image.src = dataUrl;
        });

        return {
            type: "image",
            source: img,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            close: () => {},
        };
    } catch (err) {
        console.warn("[imageOptimizer] FileReader DataURL falló:", err);
    }

    // 3. Método C: URL.createObjectURL (Fallback tradicional con Blob URL)
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({
                type: "image",
                source: img,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
                close: () => {},
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("No se pudo leer la imagen mediante ninguna de las estrategias del navegador."));
        };

        img.src = objectUrl;
    });
};

// OBTIENE LAS DIMENSIONES DE UNA IMAGEN A PARTIR DE UN BLOB
const getImageDimensions = async (blob) => {
    try {
        const loaded = await loadImageSource(blob);
        const dims = { width: loaded.width || 800, height: loaded.height || 600 };
        loaded.close();
        return dims;
    } catch {
        return { width: 800, height: 600 };
    }
};

// FALLBACK NATIVO MEDIANTE HTML5 CANVAS PARA NAVEGADORES O FOTOS CON INCOMPATIBILIDADES
const compressImageWithCanvas = async (file, options = {}, onProgress = null) => {
    const {
        maxWidthOrHeight = 1920,
        initialQuality = 0.8,
        fileType = "image/webp",
    } = options;

    if (onProgress) onProgress(20);

    const loaded = await loadImageSource(file);

    try {
        if (onProgress) onProgress(40);

        let width = loaded.width;
        let height = loaded.height;

        if (!width || !height) {
            width = 1200;
            height = 900;
        }

        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
            if (width > height) {
                height = Math.round((height * maxWidthOrHeight) / width);
                width = maxWidthOrHeight;
            } else {
                width = Math.round((width * maxWidthOrHeight) / height);
                height = maxWidthOrHeight;
            }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("No se pudo iniciar el lienzo (canvas 2D) para compresión.");
        }

        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(loaded.source, 0, 0, width, height);

        if (onProgress) onProgress(70);

        const getCanvasBlob = (targetMime, quality) => {
            return new Promise((res) => {
                try {
                    canvas.toBlob(
                        (blob) => res(blob && blob.size > 0 ? blob : null),
                        targetMime,
                        quality
                    );
                } catch {
                    res(null);
                }
            });
        };

        // 1. Intentar formato deseado (ej. image/webp)
        let compressedBlob = await getCanvasBlob(fileType, initialQuality);

        // 2. Si falla WebP, reintentar en JPEG
        if (!compressedBlob && fileType !== "image/jpeg") {
            compressedBlob = await getCanvasBlob("image/jpeg", initialQuality);
        }

        // 3. Si aún no hay blob, reintentar con tipo original o PNG
        if (!compressedBlob) {
            const fallbackMime = file.type || "image/png";
            compressedBlob = await getCanvasBlob(fallbackMime, initialQuality);
        }

        if (!compressedBlob) {
            throw new Error("El navegador no pudo exportar el lienzo a un archivo comprimido.");
        }

        if (onProgress) onProgress(90);
        return compressedBlob;
    } finally {
        loaded.close();
    }
};

// FUNCION PRINCIPAL DE OPTIMIZACIÓN CON MULTICAPAS DE FALLBACK
export const optimizeImage = async (file, profile = "photo", customOptions = {}, onProgress = null) => {
    try {
        const profileOptions = OPTIMIZATION_PROFILES[profile] || OPTIMIZATION_PROFILES.photo;

        const options = {
            ...profileOptions,
            ...customOptions,
            ...(onProgress && { onProgress }),
        };

        const originalSizeBytes = file.size;
        let compressedBlob = null;

        // CAPA 1: Intentar browser-image-compression con WebWorker
        try {
            compressedBlob = await imageCompression(file, options);
        } catch (err1) {
            console.warn("[imageOptimizer] Fallback 1 (sin WebWorker) por:", formatErrorDetail(err1));

            // CAPA 2: Intentar browser-image-compression sin WebWorker (hilo principal)
            try {
                compressedBlob = await imageCompression(file, { ...options, useWebWorker: false });
            } catch (err2) {
                console.warn("[imageOptimizer] Fallback 2 (tipo de archivo original) por:", formatErrorDetail(err2));

                // CAPA 3: Intentar browser-image-compression sin WebWorker usando el tipo MIME original
                try {
                    const originalMime = file.type || "image/jpeg";
                    compressedBlob = await imageCompression(file, {
                        ...options,
                        useWebWorker: false,
                        fileType: originalMime,
                    });
                } catch (err3) {
                    console.warn("[imageOptimizer] Fallback 3 (compresión Canvas HTML5 nativa) por:", formatErrorDetail(err3));

                    // CAPA 4: Compresión nativa con HTML5 Canvas e imagen multi-fuente (createImageBitmap / Base64 / BlobURL)
                    try {
                        compressedBlob = await compressImageWithCanvas(file, options, onProgress);
                    } catch (err4) {
                        console.warn("[imageOptimizer] Fallback 4 (archivo directo) por:", formatErrorDetail(err4));

                        // CAPA 5: Si la imagen ya es razonablemente pequeña (<= 2MB), usar el archivo original sin romper
                        const maxSizeMB = options.maxSizeMB || 2;
                        const maxSizeBytes = maxSizeMB * 1024 * 1024;
                        if (file.size <= maxSizeBytes) {
                            compressedBlob = file;
                        } else {
                            throw err4;
                        }
                    }
                }
            }
        }

        if (!compressedBlob) {
            throw new Error("No se pudo generar el archivo comprimido.");
        }

        // Determinar tipo de salida real del blob obtenido
        const outputMimeType = compressedBlob.type || file.type || "image/webp";
        const outputFileName = buildOptimizedFileName(file.name, outputMimeType);

        // Construye un File real desde el Blob para mantener nombre y tipo válidos
        const optimizedFile = new File(
            [compressedBlob],
            outputFileName,
            { type: outputMimeType }
        );

        // Obtiene dimensiones y preview en paralelo
        const [dimensions, previewUrl] = await Promise.all([
            getImageDimensions(compressedBlob),
            blobToDataUrl(compressedBlob),
        ]);

        const optimizedSizeBytes = optimizedFile.size;
        const savedBytes = Math.max(0, originalSizeBytes - optimizedSizeBytes);
        const compressionRatio = originalSizeBytes > 0
            ? ((savedBytes / originalSizeBytes) * 100).toFixed(1) + "%"
            : "0%";

        return {
            success: true,
            data: {
                file: optimizedFile,
                previewUrl,
                width: dimensions.width,
                height: dimensions.height,
                originalSizeBytes,
                optimizedSizeBytes,
                compressionRatio,
            },
        };
    } catch (error) {
        console.error("Error al optimizar la imagen:", error);
        const rawMsg = formatErrorDetail(error);
        const message = rawMsg.toLowerCase();

        if (message.includes("exceeded") || message.includes("size")) {
            throw new Error("No se pudo comprimir la imagen al tamaño requerido. Intenta con una imagen más pequeña.");
        }

        throw new Error(`No se pudo optimizar la imagen: ${rawMsg}`);
    }
};
