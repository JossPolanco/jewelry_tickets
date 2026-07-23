import { uploadImage, deleteImage, BUCKETS } from "@/services/images/imageUploader";
import { saveImageMetadata } from "@/services/images/imageMetadata";
import { validateImage } from "@/services/images/imageValidator";
import { optimizeImage } from "@/services/images/imageOptimizer";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";

/**
 * Hook que orquesta el flujo completo de subida de una imagen:
 */

// ESTADOS INICIALES PARA LA OPERACION
const INITIAL_STATE = {
    stage: "idle",           // Etapa actual del flujo
    progress: 0,             // Porcentaje de progreso de la compresión (0–100)
    previewUrl: null,        // Data URL para mostrar preview antes/durante la subida
    result: null,            // Metadata guardada en BD (disponible en stage "success")
    error: null,             // Mensaje de error (disponible en stage "error")
};


export const useImageUpload = ({ bucket = BUCKETS.PHOTOS, gallery = "default", profile = "photo", invalidateQueries = [], onSuccess } = {}) => {
    const [state, setState] = useState(INITIAL_STATE);
    const queryClient = useQueryClient();

    // Helper para actualizar solo las propiedades que cambian
    const updateState = useCallback((partial) => {
        setState((prev) => ({ ...prev, ...partial }));
    }, []);

    const upload = useCallback(
        async (file, userId) => {
            // Reiniciar estado al comenzar un nuevo upload
            setState(INITIAL_STATE);

            // ETAPA: VALIDACION
            updateState({ stage: "validating" });

            const validation = await validateImage(file);

            if (!validation.success) {
                updateState({ stage: "error", error: validation.error });
                return;
            }

            // ETAPA: OPTIMIZACION
            updateState({ stage: "optimizing", progress: 0 });

            const optimization = await optimizeImage(
                file,
                profile,
                {},
                (progress) => updateState({ progress })
            );

            if (!optimization.success) {
                updateState({ stage: "error", error: optimization.error });
                return;
            }

            const { file: optimizedFile, previewUrl, width, height, optimizedSizeBytes } = optimization.data;

            // Mostrar preview inmediatamente: el usuario ve la imagen mientras se sube
            updateState({ previewUrl, progress: 100 });

            // ETAPA: SUBIDA A STORAGE
            updateState({ stage: "uploading" });

            const upload = await uploadImage(optimizedFile, bucket, userId);

            if (!upload.success) {
                updateState({ stage: "error", error: upload.error });
                return;
            }

            const { storagePath } = upload.data;

            // ETAPA: GUARDAR METADATA
            updateState({ stage: "saving" });

            const metadata = await saveImageMetadata({
                uploadedBy: userId,
                bucket,
                gallery,
                storagePath,
                originalName: file.name,
                fileSize: optimizedSizeBytes,
                width,
                height,
            });

            if (!metadata.success) {
                // ROLLBACK
                console.warn(
                    "[useImageUpload] Fallo al guardar metadata. Iniciando rollback de Storage...",
                    { storagePath, bucket }
                );

                const rollback = await deleteImage(storagePath, bucket);

                if (!rollback.success) {
                    // El rollback también falló: archivo huérfano en Storage.
                    // Logueamos con suficiente contexto para poder limpiarlo manualmente.
                    console.error(
                        "[useImageUpload] ROLLBACK FALLIDO. Archivo huérfano en Storage:",
                        { bucket, storagePath }
                    );
                }

                updateState({
                    stage: "error",
                    error: "No se pudo guardar la imagen. Se ha revertido la subida. Intenta nuevamente.",
                });
                return;
            }

            // EXITO
            if (invalidateQueries.length > 0) {
                invalidateQueries.forEach((queryKey) => {
                    queryClient.invalidateQueries({ queryKey });
                });
            }

            updateState({
                stage: "success",
                result: metadata.data.image,
            });

            if (onSuccess) {
                onSuccess(metadata.data.image);
            }
        },
        [bucket, gallery, profile, invalidateQueries, queryClient, updateState, onSuccess]
    );

    /**
     * Resetea el estado al inicial.
     * Llamar cuando el usuario cierra el modal, cancela la subida,
     * o quiere subir otra imagen después de un error.
     */
    const reset = useCallback(() => {
        setState(INITIAL_STATE);
    }, []);

    return { upload, state, reset };
};