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

// FORMATO SEGURO DE ERRORES
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

// CONVIERTE UN BLOB O FILE A DATA URL PARA LA VISTA PREVIA
const blobToDataUrl = (blob) => {
    return new Promise((resolve) => {
        if (!blob) return resolve(null);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
    });
};

// OBTIENE LAS DIMENSIONES DE UNA IMAGEN DE FORMA SEGURA Y NUNCA LANZA EXCEPCIÓN
const getImageDimensions = (blob) => {
    return new Promise((resolve) => {
        if (!blob) return resolve({ width: 800, height: 600 });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            const width = img.naturalWidth || img.width || 800;
            const height = img.naturalHeight || img.height || 600;
            URL.revokeObjectURL(url);
            resolve({ width, height });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve({ width: 800, height: 600 });
        };

        img.src = url;
    });
};

// COMPRESIÓN NATIVA HTML5 CANVAS ULTRA-ROBUSTA
const compressImageWithCanvas = async (file, options = {}, onProgress = null) => {
    const {
        maxWidthOrHeight = 1920,
        initialQuality = 0.8,
        fileType = "image/webp",
    } = options;

    if (onProgress) onProgress(20);

    // ESTRATEGIA 1: HTMLImageElement con ObjectURL (revocando el URL DESPUÉS de dibujar en el canvas)
    const tryHTMLImage = () => {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();

            img.onload = async () => {
                if (onProgress) onProgress(50);
                try {
                    let width = img.naturalWidth || img.width || 1200;
                    let height = img.naturalHeight || img.height || 900;

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
                        URL.revokeObjectURL(objectUrl);
                        return reject(new Error("No 2D context"));
                    }

                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    // Revocar objectUrl una vez que los píxeles fueron dibujados en el canvas
                    URL.revokeObjectURL(objectUrl);

                    if (onProgress) onProgress(75);

                    const getCanvasBlob = (targetMime, quality) => {
                        return new Promise((res) => {
                            try {
                                canvas.toBlob(
                                    (b) => res(b && b.size > 0 ? b : null),
                                    targetMime,
                                    quality
                                );
                            } catch {
                                res(null);
                            }
                        });
                    };

                    let blob = await getCanvasBlob(fileType, initialQuality);
                    if (!blob && fileType !== "image/jpeg") {
                        blob = await getCanvasBlob("image/jpeg", initialQuality);
                    }
                    if (!blob) {
                        blob = await getCanvasBlob(file.type || "image/png", initialQuality);
                    }

                    if (blob) {
                        if (onProgress) onProgress(90);
                        resolve(blob);
                    } else {
                        reject(new Error("Fallo al exportar Blob desde Canvas."));
                    }
                } catch (err) {
                    URL.revokeObjectURL(objectUrl);
                    reject(err);
                }
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Fallo al cargar imagen en objeto Image."));
            };

            img.src = objectUrl;
        });
    };

    // ESTRATEGIA 2: createImageBitmap (GPU/C++ decoding)
    const tryImageBitmap = async () => {
        if (typeof createImageBitmap !== "function") {
            throw new Error("createImageBitmap no soportado");
        }
        const bitmap = await createImageBitmap(file);
        try {
            let width = bitmap.width || 1200;
            let height = bitmap.height || 900;

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
            if (!ctx) throw new Error("No 2D context");

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(bitmap, 0, 0, width, height);

            const getCanvasBlob = (targetMime, quality) => {
                return new Promise((res) => {
                    try {
                        canvas.toBlob(
                            (b) => res(b && b.size > 0 ? b : null),
                            targetMime,
                            quality
                        );
                    } catch {
                        res(null);
                    }
                });
            };

            let blob = await getCanvasBlob(fileType, initialQuality);
            if (!blob && fileType !== "image/jpeg") {
                blob = await getCanvasBlob("image/jpeg", initialQuality);
            }
            if (!blob) {
                blob = await getCanvasBlob(file.type || "image/png", initialQuality);
            }

            if (!blob) throw new Error("Fallo al exportar Blob desde Bitmap Canvas.");
            return blob;
        } finally {
            bitmap.close();
        }
    };

    try {
        return await tryHTMLImage();
    } catch {
        return await tryImageBitmap();
    }
};

// FUNCION PRINCIPAL DE OPTIMIZACIÓN CON MULTICAPAS DE FALLBACK INMUNE A FALLOS
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
                console.warn("[imageOptimizer] Fallback 2 (Canvas HTML5 nativo) por:", formatErrorDetail(err2));

                // CAPA 3: Compresión nativa con HTML5 Canvas
                try {
                    compressedBlob = await compressImageWithCanvas(file, options, onProgress);
                } catch (err3) {
                    console.warn("[imageOptimizer] Fallback 3 (usar archivo original directamente) por:", formatErrorDetail(err3));

                    // CAPA 4: Usar el archivo original directamente si no supera 15 MB (nunca rechazar la foto)
                    if (file && file.size > 0 && file.size <= 15 * 1024 * 1024) {
                        compressedBlob = file;
                    } else {
                        throw new Error("El archivo supera el límite de 15MB.");
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
                previewUrl: previewUrl || "",
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
