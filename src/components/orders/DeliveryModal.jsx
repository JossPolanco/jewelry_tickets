import React, { forwardRef, useRef, useState, useEffect } from 'react';
import { CheckCircle2, DollarSign, Camera, PenTool, Loader2, Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import SignatureInput from '@/components/SignatureInput';
import { createPayment } from '@/services/payments';
import { updateOrder } from '@/services/orders';
import { useImageUpload } from '@/hooks/images/useImageUpload';
import { BUCKETS, deleteImage } from '@/services/images/imageUploader';
import { getImageById, deleteImageMetadata } from '@/services/images/imageMetadata';
import { getSignedUrl } from '@/services/images/imageUrl';
import { useUser } from '@/utils/context/UserContext';
import { getCurrentUser } from '@/services/user/userService';

const DeliveryModal = forwardRef(function DeliveryModal({ order, onSuccess, onShowToast }, ref) {
    const modalRef = useRef(null);
    const signaturePadRef = useRef(null);
    const photoInputRef = useRef(null);
    const { user } = useUser();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [signatureError, setSignatureError] = useState('');
    const [amountToPay, setAmountToPay] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [paymentError, setPaymentError] = useState('');
    const [deliveryPhotos, setDeliveryPhotos] = useState([]);
    const [deletingPhotoId, setDeletingPhotoId] = useState(null);
    const [loadingUser, setLoadingUser] = useState(null);

    const totalCost = parseFloat(order?.total_estimated_cost) || 0;
    const advancePaid = parseFloat(order?.advance_payment) || 0;
    const pendingBalance = Math.max(0, totalCost - advancePaid);

    // Reiniciar formulario al abrir el modal con nueva orden
    useEffect(() => {
        if (order) {
            const initialPending = Math.max(0, (parseFloat(order.total_estimated_cost) || 0) - (parseFloat(order.advance_payment) || 0));
            setAmountToPay(initialPending > 0 ? initialPending.toString() : '0');
            setPaymentMethod('efectivo');
            setPaymentError('');
            setSignatureError('');
            setDeliveryPhotos([]);
        }
    }, [order]);

    // Hook de subida de imágenes para la entrega (bucket: photos)
    const { upload, state: uploadState, reset: resetUpload } = useImageUpload({
        bucket: BUCKETS.PHOTOS,
        gallery: 'photos',
        profile: 'photo',
        onSuccess: async (image, previewUrl) => {
            let finalUrl = previewUrl;
            try {
                const urlRes = await getSignedUrl(image.storage_path, BUCKETS.PHOTOS);
                if (urlRes?.success && urlRes?.data?.signedUrl) {
                    finalUrl = urlRes.data.signedUrl;
                }
            } catch (err) {
                console.warn('Usando vista previa optimizada en memoria:', err);
            }

            const newPhoto = {
                id: image.id,
                storage_path: image.storage_path,
                bucket: BUCKETS.PHOTOS,
                signedUrl: finalUrl || previewUrl
            };

            setDeliveryPhotos((prev) => [...prev, newPhoto]);
            resetUpload();
        }
    });

    const handlePhotoFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        let targetUserId = user?.id || loadingUser?.id;
        if (!targetUserId) {
            try {
                const curUser = await getCurrentUser();
                targetUserId = curUser?.id;
                setLoadingUser(curUser);
            } catch (err) {
                console.error('No se pudo identificar usuario para subir foto:', err);
                return;
            }
        }

        if (!targetUserId) return;
        upload(file, targetUserId);
    };

    const handleDeletePhoto = async (photoToDelete) => {
        try {
            setDeletingPhotoId(photoToDelete.id);
            await deleteImageMetadata(photoToDelete.id).catch(() => {});
            if (photoToDelete.storage_path) {
                await deleteImage(photoToDelete.storage_path, photoToDelete.bucket || BUCKETS.PHOTOS).catch(() => {});
            }
        } catch (err) {
            console.error('Error al eliminar fotografía de entrega:', err);
        } finally {
            setDeletingPhotoId(null);
            setDeliveryPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
        }
    };

    const isUploadingPhoto = ['validating', 'optimizing', 'uploading', 'saving'].includes(uploadState.stage);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSignatureError('');
        setPaymentError('');

        // 1. Validar Firma Obligatoria
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
            setSignatureError('La firma de conformidad del cliente es requerida para completar la entrega.');
            return;
        }

        // 2. Validar Pago de Finiquito
        const numAmount = parseFloat(amountToPay);
        if (pendingBalance > 0 && amountToPay !== '') {
            if (isNaN(numAmount) || numAmount < 0) {
                setPaymentError('Ingresa un monto válido a liquidar.');
                return;
            }
        }

        try {
            setIsSubmitting(true);

            // A. Registrar el pago final si aplica
            if (pendingBalance > 0 && numAmount > 0) {
                await createPayment({
                    service_order_id: order.id,
                    amount: numAmount,
                    payment_method: paymentMethod,
                    notes: 'Pago de finiquito en entrega de pieza(s)',
                    created_by: user?.id || null,
                });
            }

            // B. Obtener datos de firma vectoriales
            const signatureVectorData = signaturePadRef.current.getSignatureData();

            // C. Obtener IDs de fotos de entrega
            const photoIds = deliveryPhotos.map((p) => p.id);

            // D. Actualizar orden de servicio a 'Entregado'
            await updateOrder(order.id, {
                status: 'Entregado',
                delivered_at: new Date().toISOString(),
                delivery_signature_data: signatureVectorData,
                delivery_photo_ids: photoIds,
            });

            if (onShowToast) {
                onShowToast('¡Orden entregada y finiquitada con éxito!', 'success');
            }

            if (onSuccess) {
                await onSuccess();
            }

            modalRef.current?.close();
        } catch (error) {
            console.error('Error al procesar la entrega de la orden:', error);
            if (onShowToast) {
                onShowToast(error.message || 'Error al procesar la entrega', 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            ref={(instance) => {
                modalRef.current = instance;
                if (typeof ref === 'function') ref(instance);
                else if (ref) ref.current = instance;
            }}
            className="max-w-xl"
            modalTitle="Entrega de Orden y Finiquito"
            modalSubtitle={`Folio #${order?.folio || '—'} • Confirma la recepción a entera satisfacción del cliente`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. SECCIÓN: COBRO Y FINIQUITO DE SALDO */}
                <div className="bg-base-200/60 rounded-2xl p-4 border border-base-300 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-extrabold text-base-content flex items-center gap-1.5 uppercase tracking-wide">
                            <DollarSign className="w-4 h-4 text-primary" />
                            Cobro y Finiquito de Saldo
                        </h3>
                        {pendingBalance === 0 ? (
                            <span className="badge badge-success text-white text-[11px] font-bold px-2.5 py-1">
                                Totalmente Saldado
                            </span>
                        ) : (
                            <span className="badge badge-warning text-warning-content text-[11px] font-bold px-2.5 py-1">
                                Saldo Pendiente
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm bg-base-100 p-3 rounded-xl border border-base-200">
                        <div>
                            <span className="text-base-content/60 block font-medium">Total Estimado</span>
                            <span className="font-extrabold text-base-content">
                                ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div>
                            <span className="text-base-content/60 block font-medium">Anticipo / Abonado</span>
                            <span className="font-extrabold text-success">
                                ${advancePaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {pendingBalance > 0 && (
                        <div className="pt-2 border-t border-base-300/70 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm font-bold text-base-content">Monto por Liquidar:</span>
                                <span className="text-base sm:text-lg font-black text-amber-600">
                                    ${pendingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* MONTO A INGRESAR / CONFIRMAR */}
                                <div className="form-control w-full">
                                    <label className="label py-1">
                                        <span className="label-text text-xs font-semibold">Monto a Cobrar ($)</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={pendingBalance}
                                        value={amountToPay}
                                        onChange={(e) => setAmountToPay(e.target.value)}
                                        className={`input input-bordered h-11 min-h-11 text-sm font-bold rounded-xl border-base-300 focus:border-primary ${paymentError ? 'border-error' : ''}`}
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* MÉTODO DE PAGO */}
                                <div className="form-control w-full">
                                    <label className="label py-1">
                                        <span className="label-text text-xs font-semibold">Método de Pago</span>
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="select select-bordered h-11 min-h-11 text-sm font-medium rounded-xl border-base-300 focus:border-primary"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
                                        <option value="transferencia">Transferencia Bancaria</option>
                                    </select>
                                </div>
                            </div>
                            {paymentError && (
                                <p className="text-xs text-error font-medium">{paymentError}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. SECCIÓN: CAPTURA DE FOTOGRAFÍAS DE ENTREGA (OPCIONAL) */}
                <div className="bg-base-200/60 rounded-2xl p-4 border border-base-300 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-extrabold text-base-content flex items-center gap-1.5 uppercase tracking-wide">
                            <Camera className="w-4 h-4 text-primary" />
                            Foto de la Pieza Terminada (Opcional)
                        </h3>
                        <span className="text-[11px] text-base-content/60 font-medium">
                            {deliveryPhotos.length} / 2 subidas
                        </span>
                    </div>

                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoFileChange}
                        disabled={isUploadingPhoto || deliveryPhotos.length >= 2}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        {deliveryPhotos.map((photo, idx) => (
                            <div key={photo.id || idx} className="relative group rounded-xl overflow-hidden border border-base-300 bg-base-100 aspect-video flex items-center justify-center shadow-xs">
                                <img
                                    src={photo.signedUrl}
                                    alt={`Foto de entrega ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleDeletePhoto(photo)}
                                    disabled={deletingPhotoId === photo.id}
                                    className="absolute top-1.5 right-1.5 btn btn-circle btn-xs btn-error text-white shadow-md"
                                    title="Eliminar foto"
                                >
                                    {deletingPhotoId === photo.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3 h-3" />
                                    )}
                                </button>
                            </div>
                        ))}

                        {deliveryPhotos.length < 2 && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (photoInputRef.current) photoInputRef.current.value = '';
                                    photoInputRef.current?.click();
                                }}
                                disabled={isUploadingPhoto}
                                className={`border-2 border-dashed border-base-300 hover:border-primary/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-base-content/70 hover:text-primary transition-all aspect-video min-h-24 min-w-11${isUploadingPhoto ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer bg-base-100 hover:bg-primary/5'}`}
                            >
                                {isUploadingPhoto ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        <span className="text-[11px] font-medium text-primary">Subiendo... ({uploadState.progress}%)</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 text-primary" />
                                        <span className="text-[11px] font-bold">Tomar / Subir Foto</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* 3. SECCIÓN: LIENZO DE FIRMA DE ENTREGA */}
                <div className="bg-base-200/60 rounded-2xl p-4 border border-base-300 space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-extrabold text-base-content flex items-center gap-1.5 uppercase tracking-wide">
                            <PenTool className="w-4 h-4 text-primary" />
                            Firma Digital de Conformidad <span className="text-error">*</span>
                        </h3>
                        <span className="text-[11px] text-base-content/60 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-success" />
                            Requerida
                        </span>
                    </div>

                    <p className="text-xs text-base-content/70 leading-relaxed italic">
                        "El cliente confirma recibir la(s) pieza(s) de joyería a entera satisfacción y otorga el finiquito del servicio."
                    </p>

                    <div className="bg-base-100 p-2 rounded-xl border border-base-300">
                        <SignatureInput
                            ref={signaturePadRef}
                            onChange={() => setSignatureError('')}
                        />
                    </div>

                    {signatureError && (
                        <div className="alert alert-error text-xs py-2 px-3 rounded-xl flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{signatureError}</span>
                        </div>
                    )}
                </div>

                {/* BOTONES DE ACCIÓN DEL MODAL */}
                <div className="pt-3 border-t border-base-200 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => modalRef.current?.close()}
                        disabled={isSubmitting}
                        className="btn btn-ghost h-11 min-h-11rounded-xl text-xs sm:text-sm font-semibold px-4"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploadingPhoto}
                        className="btn btn-success h-11 min-h-11 rounded-xl px-5 text-xs sm:text-sm font-extrabold text-white shadow-md gap-2 active:scale-95 transition-all"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Procesando Entrega...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" /> Confirmar Entrega y Finiquito
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
});

export default DeliveryModal;
