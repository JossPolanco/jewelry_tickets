import { useImageUpload } from "../../hooks/images/useImageUpload";
import { imageKeys, useSingleImage } from "../../hooks/images/useImages";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../../services/user/userService";

const formatBytes = (bytes) => {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// MAPA DE ETAPA → MENSAJE VISIBLE EN LA UI
const STAGE_LABELS = {
    idle: { text: 'Esperando imagen...', badge: 'badge-ghost', progress: 0, progressColor: 'progress-primary' },
    validating: { text: 'Verificando archivo...', badge: 'badge-info', progress: 20, progressColor: 'progress-info' },
    optimizing: { text: 'Optimizando imagen...', badge: 'badge-warning', progress: 40, progressColor: 'progress-warning' },
    uploading: { text: 'Subiendo a Storage...', badge: 'badge-warning', progress: 60, progressColor: 'progress-warning' },
    saving: { text: 'Guardando metadata...', badge: 'badge-warning', progress: 80, progressColor: 'progress-warning' },
    success: { text: '¡Imagen guardada! ✓', badge: 'badge-success', progress: 100, progressColor: 'progress-success' },
    error: { text: 'Ocurrió un error', badge: 'badge-error', progress: 0, progressColor: 'progress-error' },
}

export default function UploadPanel({
    user,
    className = "",
    bucket = "photos",
    profile = "photo",
    gallery = "default",
    label,
    value,
    onChange,
    onSuccess,
    invalidateQueries,
    relation = null,
    mode = "single",
    background = "card bg-base-100 dark:bg-base-900/40 border border-base-200 dark:border-base-800/60 shadow-3xs rounded-3xl"
}) {
    const fileInputRef = useRef(null)

    // Fallback query to load the user profile if none is provided
    const { data: userFromQuery } = useQuery({
        queryKey: ["user"],
        queryFn: getCurrentUser,
        enabled: !user,
    });
    const currentUser = user || userFromQuery;

    const customKey = relation
        ? `${relation.table}-${relation.id}`
        : null;

    const { upload, state, reset } = useImageUpload({
        bucket: bucket,
        profile: profile,
        gallery: gallery,
        invalidateQueries: invalidateQueries || [imageKeys.list(bucket, gallery, customKey)],
        onSuccess: (image) => {
            if (onSuccess) {
                onSuccess(image);
            }
            if (onChange) {
                onChange(image.id);
            }
            if (mode === "multi") {
                setTimeout(() => {
                    reset();
                }, 1500);
            }
        }
    })

    const { stage, progress, previewUrl, error } = state
    const stageInfo = STAGE_LABELS[stage]
    const isProcessing = ['validating', 'optimizing', 'uploading', 'saving'].includes(stage)
    const isBtnDisabled = isProcessing || !currentUser;

    // Retrieve single image details when a value is provided and no local upload is in progress (only in single mode)
    const { data: currentImage } = useSingleImage(value, {
        enabled: mode === "single" && Boolean(value) && !previewUrl,
    });

    const displayPreviewUrl = mode === "single"
        ? (previewUrl || currentImage?.signedUrl)
        : previewUrl;

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!currentUser) {
            console.error("No se pudo subir la imagen porque no hay un usuario autenticado.");
            return;
        }
        // Limpia el input para permitir seleccionar el mismo archivo de nuevo
        e.target.value = ''
        upload(file, currentUser.id)
    }

    const handleReset = () => {
        reset();
        if (onChange) {
            onChange(null);
        }
    }

    return (
        <div className={`${className} ${background} `}>
            <div className="card-body space-y-4">
                <h2 className="card-title text-base">{label || (mode === "multi" ? "Añadir foto" : "Subir imagen")}</h2>

                {/* Zona de selección */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isBtnDisabled}
                />

                <button
                    className="btn btn-primary w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBtnDisabled}
                    type="button"
                >
                    {isProcessing ? (
                        <span className="loading loading-spinner loading-sm" />
                    ) : (
                        <span>{mode === "multi" ? "Seleccionar foto" : "Seleccionar foto"}</span>
                    )}
                </button>

                {/* Badge de etapa */}
                <div className="flex items-center gap-2">
                    <span className={`badge ${stageInfo.badge}`}>
                        {stageInfo.text}
                    </span>
                </div>

                {/* Barra de progreso (solo durante optimización) */}
                {stage === 'optimizing' && (
                    <div className="space-y-1">
                        <p className="text-xs text-base-content/60">
                            Comprimiendo: {progress}%
                        </p>
                        <progress
                            className="progress progress-warning w-full"
                            value={progress}
                            max={100}
                        />
                    </div>
                )}

                {/* barra de progreso general */}
                {
                    stage !== "idle" && (
                        <div className="flex w-full">
                            <progress className={`progress w-full ${stageInfo.progressColor}`} value={progress} max="100"></progress>
                        </div>
                    )
                }

                {/* Preview de la imagen */}
                {displayPreviewUrl && (
                    <div className="space-y-1">
                        <p className="text-xs text-base-content/60">
                            {previewUrl ? "Vista previa (WebP optimizado)" : "Imagen seleccionada"}
                        </p>
                        <img
                            src={displayPreviewUrl}
                            alt="Preview"
                            className="rounded-lg w-full max-h-48 object-cover border border-base-300"
                        />
                    </div>
                )}

                {/* Error */}
                {stage === 'error' && (
                    <div className="alert alert-error">
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Botón para reiniciar después de éxito o error o si ya tiene un valor establecido */}
                {((mode === "single" && (stage === 'success' || stage === 'error' || (value && !isProcessing))) || (mode === "multi" && stage === 'error')) && (
                    <button className="btn btn-ghost btn-sm w-full" onClick={handleReset} type="button">
                        {stage === 'error' ? "Intentar de nuevo" : "Eliminar / Subir otra imagen"}
                    </button>
                )}
            </div>
        </div>
    )
}