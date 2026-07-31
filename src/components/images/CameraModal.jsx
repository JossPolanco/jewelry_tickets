import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X, Check, RotateCcw, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import Modal from '@/components/Modal';

/**
 * Modal de Cámara en Vivo (WebRTC)
 * Permite tomar fotografías directamente desde el navegador sin salir de la aplicación web,
 * evitando así la evicción de memoria del sistema operativo en móviles al abrir la cámara nativa.
 */
export default function CameraModal({ isOpen, onClose, onCapture, onUseFileFallback }) {
    const modalRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' (trasera) o 'user' (frontal)
    const [capturedImage, setCapturedImage] = useState(null); // Data URL de la foto tomada
    const [capturedFile, setCapturedFile] = useState(null); // Objeto File
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Detiene el flujo de video activo
    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Inicia la cámara con el modo seleccionado (trasera / frontal)
    const startCamera = useCallback(async (mode = facingMode) => {
        stopStream();
        setError(null);
        setLoading(true);
        setCapturedImage(null);
        setCapturedFile(null);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Tu navegador no soporta el acceso a la cámara en vivo.");
            }

            const constraints = {
                video: {
                    facingMode: { ideal: mode },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play().catch(() => {});
            }
        } catch (err) {
            console.error("Error al iniciar la cámara:", err);
            let userMsg = "No se pudo acceder a la cámara.";
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                userMsg = "Permiso de cámara denegado. Por favor, otorga permisos en tu navegador.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                userMsg = "No se encontró ninguna cámara disponible en tu dispositivo.";
            }
            setError(userMsg);
        } finally {
            setLoading(false);
        }
    }, [facingMode, stopStream]);

    // Controla la apertura/cierre del modal
    useEffect(() => {
        if (isOpen) {
            modalRef.current?.open();
            startCamera('environment');
        } else {
            stopStream();
            modalRef.current?.close();
            setCapturedImage(null);
            setCapturedFile(null);
            setError(null);
        }

        return () => {
            stopStream();
        };
    }, [isOpen]);

    // Alternar entre cámara trasera y frontal
    const toggleFacingMode = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
        startCamera(nextMode);
    };

    // Tomar instantánea en el canvas
    const handleTakeSnapshot = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement('canvas');

        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (facingMode === 'user') {
            // Espejear horizontalmente si es cámara frontal
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const fileName = `foto_item_${Date.now()}.webp`;
            const file = new File([blob], fileName, { type: 'image/webp' });
            const dataUrl = canvas.toDataURL('image/webp', 0.9);

            setCapturedImage(dataUrl);
            setCapturedFile(file);
            stopStream();
        }, 'image/webp', 0.9);
    };

    // Repetir fotografía
    const handleRetake = () => {
        setCapturedImage(null);
        setCapturedFile(null);
        startCamera(facingMode);
    };

    // Confirmar y entregar la foto al componente padre
    const handleConfirmPhoto = () => {
        if (capturedFile && onCapture) {
            onCapture(capturedFile);
        }
        handleClose();
    };

    // Cerrar modal
    const handleClose = () => {
        stopStream();
        if (onClose) onClose();
    };

    return (
        <Modal
            ref={modalRef}
            className="max-w-lg"
            modalTitle="Cámara en Vivo"
            modalSubtitle="Toma una fotografía directamente para el ítem de la orden"
        >
            <div className="space-y-3">
                {/* ÁREA DE VISUALIZACIÓN / VISTA PREVIA */}
                <div className="relative bg-black rounded-2xl overflow-hidden aspect4/3 sm:aspect-video max-h-52 sm:max-h-64 flex items-center justify-center border border-base-300 shadow-inner">
                    {/* CASO 1: FOTO CAPTURADA */}
                    {capturedImage ? (
                        <img
                            src={capturedImage}
                            alt="Foto tomada"
                            className="w-full h-full object-cover animate-fade-in"
                        />
                    ) : error ? (
                        /* CASO 2: ERROR DE PERMISOS O CÁMARA */
                        <div className="p-4 text-center text-white space-y-2">
                            <AlertTriangle className="w-8 h-8 text-error mx-auto animate-bounce" />
                            <p className="text-xs font-medium text-error-content">{error}</p>
                            {onUseFileFallback && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleClose();
                                        onUseFileFallback();
                                    }}
                                    className="btn btn-xs btn-outline btn-info gap-1 rounded-xl font-bold mt-1"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    Seleccionar desde Galería
                                </button>
                            )}
                        </div>
                    ) : (
                        /* CASO 3: TRANSMISIÓN DE VIDEO EN VIVO */
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                            />

                            {loading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white text-xs gap-2">
                                    <span className="loading loading-spinner loading-md text-primary"></span>
                                    <span>Accediendo a la cámara...</span>
                                </div>
                            )}

                            {/* BOTÓN ALTERNAR CÁMARA TRASERA / FRONTAL */}
                            {stream && !loading && (
                                <button
                                    type="button"
                                    onClick={toggleFacingMode}
                                    className="absolute top-2.5 right-2.5 btn btn-circle btn-xs sm:btn-sm bg-black/50 text-white hover:bg-black/80 border-none shadow-md"
                                    title="Alternar cámara trasera/frontal"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* CANVAS OCULTO PARA EL SNAPSHOT */}
                <canvas ref={canvasRef} className="hidden" />

                {/* BOTONES DE ACCIÓN */}
                <div className="sticky -bottom-3 sm:-bottom-4 bg-base-100/95 backdrop-blur-xs pt-2 pb-0.5 border-t border-base-200 flex items-center justify-between shrink-0 z-10">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn btn-ghost btn-xs sm:btn-sm rounded-xl text-xs font-semibold"
                    >
                        Cancelar
                    </button>

                    {capturedImage ? (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleRetake}
                                className="btn btn-outline btn-xs sm:btn-sm rounded-xl text-xs font-bold gap-1"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Repetir
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmPhoto}
                                className="btn btn-primary btn-xs sm:btn-sm rounded-xl text-xs font-bold gap-1 shadow-xs"
                            >
                                <Check className="w-3.5 h-3.5" />
                                Usar Foto
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5">
                            {onUseFileFallback && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleClose();
                                        onUseFileFallback();
                                    }}
                                    className="btn btn-ghost btn-xs sm:btn-sm text-[11px] sm:text-xs font-semibold gap-1 text-base-content/70"
                                >
                                    <ImageIcon className="w-3 h-3" />
                                    Subir de Galería
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleTakeSnapshot}
                                disabled={loading || !!error || !stream}
                                className="btn btn-primary btn-xs sm:btn-sm rounded-xl text-xs font-bold gap-1 shadow-xs active:scale-95 transition-all"
                            >
                                <Camera className="w-3.5 h-3.5" />
                                Tomar Foto
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
