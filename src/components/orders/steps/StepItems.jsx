import { Package, Wrench, MessageSquare, Plus, Trash2, Edit3, Scale, Tag, AlertCircle, Weight, Hammer, DollarSign, Camera, Loader2, Image as ImageIcon } from 'lucide-react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import React, { useState, useRef, useEffect } from 'react';
import { ITEM_TYPES, SERVICE_TYPES } from '@/utils';
import { Memo } from 'reicon-react';
import Modal from '@/components/Modal';
import CameraModal from '@/components/images/CameraModal';
import { useImageUpload } from '@/hooks/images/useImageUpload';
import { getImageById, deleteImageMetadata } from '@/services/images/imageMetadata';
import { deleteImage, BUCKETS } from '@/services/images/imageUploader';
import { getSignedUrl } from '@/services/images/imageUrl';
import { useUser } from '@/utils/context/UserContext';
import { getCurrentUser } from '@/services/user/userService';

// SUBCOMPONENTE PARA GESTIONAR LAS FOTOGRAFÍAS (MÁX 2 POR ÍTEM) DENTRO DEL MODAL
function ItemPhotoManager({ photos = [], onChangePhotos }) {
    const { user } = useUser();
    const [loadingUser, setLoadingUser] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const fileInputRef = useRef(null);

    const { upload, state, reset } = useImageUpload({
        bucket: BUCKETS.PHOTOS,
        gallery: "item_photos",
        profile: "photo",
        onSuccess: async (image, previewUrl) => {
            let finalUrl = previewUrl;
            try {
                const urlRes = await getSignedUrl(image.storage_path, image.bucket || BUCKETS.PHOTOS);
                if (urlRes?.success && urlRes?.data?.signedUrl) {
                    finalUrl = urlRes.data.signedUrl;
                }
            } catch (err) {
                console.warn("Usando vista previa optimizada en memoria para la imagen recién subida:", err);
            }

            const newPhoto = {
                id: image.id,
                storage_path: image.storage_path,
                bucket: image.bucket || BUCKETS.PHOTOS,
                signedUrl: finalUrl || previewUrl
            };

            onChangePhotos([...photos, newPhoto]);
            reset();
        }
    });

    const getTargetUserId = async () => {
        let targetUserId = user?.id || loadingUser?.id;
        if (!targetUserId) {
            try {
                const curUser = await getCurrentUser();
                targetUserId = curUser?.id;
                setLoadingUser(curUser);
            } catch (err) {
                console.error("No se pudo identificar al usuario para subir la imagen:", err);
                return null;
            }
        }
        return targetUserId;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const targetUserId = await getTargetUserId();
        if (!targetUserId) return;
        upload(file, targetUserId);
    };

    const handleCameraCapture = async (capturedFile) => {
        const targetUserId = await getTargetUserId();
        if (!targetUserId) return;
        upload(capturedFile, targetUserId);
    };

    const handleDeletePhoto = async (photoToDelete) => {
        try {
            setDeletingId(photoToDelete.id);
            // 1. Eliminar la metadata de la base de datos (tbl_image_metadata / image_metadata)
            await deleteImageMetadata(photoToDelete.id).catch((err) => console.warn(err));

            // 2. Eliminar el archivo del bucket en Supabase Storage
            if (photoToDelete.storage_path) {
                await deleteImage(photoToDelete.storage_path, photoToDelete.bucket || BUCKETS.PHOTOS).catch((err) => console.warn(err));
            }
        } catch (error) {
            console.error("Error al eliminar la fotografía:", error);
        } finally {
            setDeletingId(null);
            onChangePhotos(photos.filter((p) => p.id !== photoToDelete.id));
        }
    };

    const isUploading = ['validating', 'optimizing', 'uploading', 'saving'].includes(state.stage);

    return (
        <div className="form-control w-full space-y-2 pt-2 border-t border-base-200">
            <label className="label py-1 flex items-center justify-between">
                <span className="label-text text-xs font-semibold text-base-content flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" />
                    Fotografías del ítem (1 a 2 máx.)
                </span>
                <span className="text-[11px] text-base-content/60 font-medium">
                    {photos.length} / 2 subidas
                </span>
            </label>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || photos.length >= 2}
            />

            <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, idx) => (
                    <div key={photo.id || idx} className="relative group rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-video flex items-center justify-center shadow-2xs">
                        {photo.signedUrl ? (
                            <img
                                src={photo.signedUrl}
                                alt={`Foto ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-base-content/40 text-xs">
                                <ImageIcon className="w-5 h-5 mb-1" />
                                <span>Foto #{idx + 1}</span>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo)}
                            disabled={deletingId === photo.id}
                            className="absolute top-1.5 right-1.5 btn btn-circle btn-xs btn-error text-white shadow-md opacity-95 hover:opacity-100 transition-opacity"
                            title="Eliminar fotografía"
                        >
                            {deletingId === photo.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Trash2 className="w-3 h-3" />
                            )}
                        </button>
                    </div>
                ))}

                {photos.length < 2 && (
                    <div className="border-2 border-dashed border-base-300 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1.5 aspect-video min-h-24 bg-base-100/50">
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center gap-1 text-primary">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-[11px] font-medium">Subiendo... ({state.progress}%)</span>
                            </div>
                        ) : (
                            <>
                                <span className="text-[11px] font-bold text-base-content/70 mb-0.5">
                                    Añadir Foto #{photos.length + 1}
                                </span>
                                <div className="flex flex-wrap items-center justify-center gap-1.5 w-full">
                                    <button
                                        type="button"
                                        onClick={() => setIsCameraOpen(true)}
                                        className="btn btn-primary btn-xs rounded-lg font-bold gap-1 shadow-xs active:scale-95 transition-all text-[11px]"
                                        title="Tomar foto con la cámara en vivo"
                                    >
                                        <Camera className="w-3 h-3" />
                                        Cámara
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                            fileInputRef.current?.click();
                                        }}
                                        className="btn btn-outline btn-xs rounded-lg font-bold gap-1 text-base-content/70 hover:text-primary active:scale-95 transition-all text-[11px]"
                                        title="Seleccionar de la galería de imágenes"
                                    >
                                        <ImageIcon className="w-3 h-3" />
                                        Galería
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {state.stage === 'error' && (
                <div className="alert alert-error text-xs py-1.5 px-3 rounded-lg">
                    <span>{state.error || "Error al subir la imagen"}</span>
                </div>
            )}

            {/* MODAL DE CÁMARA EN VIVO WEBRTC */}
            <CameraModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCameraCapture}
                onUseFileFallback={() => fileInputRef.current?.click()}
            />
        </div>
    );
}


export default function StepItems() {
    const { control, formState: { errors }, clearErrors, setValue } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "items"
    });

    const totalItemsPrice = fields.reduce((sum, item) => sum + (parseFloat(item.unit_price) || 0), 0);

    useEffect(() => {
        if (setValue) {
            setValue('total_estimated_cost', totalItemsPrice, { shouldValidate: true });
        }
    }, [totalItemsPrice, setValue]);

    const modalRef = useRef(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [deletingIndex, setDeletingIndex] = useState(null);

    const initialFormState = {
        item_type: '',
        description: '',
        initial_weight_grams: '',
        service_requested: '',
        material_details: '',
        unit_price: '',
        price_detail: '',
        photos: [],
        photo_ids: []
    };

    const [formData, setFormData] = useState(initialFormState);
    const [localErrors, setLocalErrors] = useState({});

    // Abre el modal en modo creación
    const handleOpenAddModal = () => {
        setEditingIndex(null);
        setFormData(initialFormState);
        setLocalErrors({});
        modalRef.current?.open();
    };

    // Abre el modal en modo edición para un item específico y recupera sus fotos/URLs
    const handleOpenEditModal = async (index) => {
        const itemToEdit = fields[index];
        setEditingIndex(index);

        let existingPhotos = itemToEdit.photos ? [...itemToEdit.photos] : [];
        const existingPhotoIds = itemToEdit.photo_ids || existingPhotos.map((p) => p.id) || [];

        // Si faltan URLs o detalles de fotos pero hay photo_ids, recuperamos su metadata y URLs firmadas
        if (existingPhotoIds.length > 0 && existingPhotos.length < existingPhotoIds.length) {
            try {
                const fetchedPhotos = await Promise.all(
                    existingPhotoIds.map(async (id) => {
                        const found = existingPhotos.find((p) => p.id === id);
                        if (found) return found;
                        try {
                            const metaRes = await getImageById(id);
                            if (metaRes.success) {
                                const img = metaRes.data.image;
                                const urlRes = await getSignedUrl(img.storage_path, img.bucket || BUCKETS.PHOTOS);
                                return {
                                    id: img.id,
                                    storage_path: img.storage_path,
                                    bucket: img.bucket || BUCKETS.PHOTOS,
                                    signedUrl: urlRes.success ? urlRes.data.signedUrl : null
                                };
                            }
                        } catch (err) {
                            console.warn("Fallo al obtener metadata de imagen ID:", id, err);
                        }
                        return { id };
                    })
                );
                existingPhotos = fetchedPhotos.filter(Boolean);
            } catch (e) {
                console.warn("Error al cargar fotos guardadas:", e);
            }
        }

        setFormData({
            item_type: ITEM_TYPES[itemToEdit.item_type] || itemToEdit.item_type || '',
            description: itemToEdit.description || '',
            initial_weight_grams: itemToEdit.initial_weight_grams !== undefined ? String(itemToEdit.initial_weight_grams) : '',
            service_requested: SERVICE_TYPES[itemToEdit.service_requested] || itemToEdit.service_requested || '',
            material_details: itemToEdit.material_details || '',
            unit_price: itemToEdit.unit_price !== undefined ? String(itemToEdit.unit_price) : '',
            price_detail: itemToEdit.price_detail || '',
            photos: existingPhotos,
            photo_ids: existingPhotoIds
        });
        setLocalErrors({});
        modalRef.current?.open();
    };

    // Cierra el modal y limpia el formulario local
    const handleCloseModal = () => {
        modalRef.current?.close();
        setFormData(initialFormState);
        setEditingIndex(null);
        setLocalErrors({});
    };

    // Valida y guarda el item incluyendo photo_ids e información de las imágenes
    const handleSaveItem = (e) => {
        if (e) e.preventDefault();

        const errorsObj = {};
        if (!formData.item_type?.trim()) errorsObj.item_type = 'Ingresa o selecciona un tipo de joya';
        if (!formData.description?.trim()) errorsObj.description = 'Ingresa la descripción de la pieza';

        const parsedWeight = parseFloat(formData.initial_weight_grams);
        if (formData.initial_weight_grams === '' || isNaN(parsedWeight) || parsedWeight < 0) {
            errorsObj.initial_weight_grams = 'Ingresa un peso válido (0 o mayor)';
        }
        if (!formData.service_requested?.trim()) errorsObj.service_requested = 'Ingresa o selecciona el tipo de servicio';

        const parsedPrice = parseFloat(formData.unit_price);
        if (formData.unit_price === '' || isNaN(parsedPrice) || parsedPrice < 0) {
            errorsObj.unit_price = 'Ingresa un precio unitario válido (0 o mayor)';
        }

        if (Object.keys(errorsObj).length > 0) {
            setLocalErrors(errorsObj);
            return;
        }

        const currentPhotos = formData.photos || [];
        const photoIds = currentPhotos.map((p) => p.id);

        const itemPayload = {
            item_type: formData.item_type.trim(),
            description: formData.description.trim(),
            initial_weight_grams: parsedWeight,
            service_requested: formData.service_requested.trim(),
            material_details: formData.material_details?.trim() || 'Sin observaciones',
            unit_price: parsedPrice,
            price_detail: formData.price_detail?.trim() || null,
            photo_ids: photoIds,
            photos: currentPhotos
        };

        if (editingIndex !== null) {
            update(editingIndex, itemPayload);
        } else {
            append(itemPayload);
        }

        if (errors?.items) {
            clearErrors('items');
        }

        handleCloseModal();
    };

    // Elimina un ítem y borra sus imágenes tanto de la base de datos (tbl_image_metadata / image_metadata) como de Supabase Storage
    const handleRemoveItem = async (index) => {
        const itemToDelete = fields[index];
        const photoIds = itemToDelete?.photo_ids || itemToDelete?.photos?.map((p) => p.id) || [];

        if (photoIds.length > 0) {
            setDeletingIndex(index);
            try {
                await Promise.all(
                    photoIds.map(async (photoId) => {
                        let storagePath = null;
                        let bucket = BUCKETS.PHOTOS;
                        const cachedPhoto = itemToDelete.photos?.find((p) => p.id === photoId);

                        if (cachedPhoto?.storage_path) {
                            storagePath = cachedPhoto.storage_path;
                            bucket = cachedPhoto.bucket || BUCKETS.PHOTOS;
                        } else {
                            try {
                                const metaRes = await getImageById(photoId);
                                if (metaRes.success) {
                                    storagePath = metaRes.data.image.storage_path;
                                    bucket = metaRes.data.image.bucket || BUCKETS.PHOTOS;
                                }
                            } catch (e) {
                                console.warn("No se pudo obtener metadata para borrar la foto:", photoId, e);
                            }
                        }

                        // 1. Eliminar metadata de la BD
                        await deleteImageMetadata(photoId).catch((e) => console.warn(e));

                        // 2. Eliminar archivo del bucket en Supabase Storage
                        if (storagePath) {
                            await deleteImage(storagePath, bucket).catch((e) => console.warn(e));
                        }
                    })
                );
            } catch (err) {
                console.error("Error al eliminar fotografías del ítem:", err);
            } finally {
                setDeletingIndex(null);
            }
        }

        remove(index);
    };

    return (
        <div className="space-y-3 py-0.5 animate-fade-in">
            {/* ENCABEZADO ÚNICO COMPACTO */}
            <div className="flex items-center justify-between gap-2 border-b border-base-200 pb-2">
                <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="text-xs sm:text-sm font-bold text-base-content">
                        Piezas Registradas ({fields.length})
                    </h3>
                </div>

                <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="btn btn-primary btn-sm h-8 rounded-xl px-3 font-bold gap-1 active:scale-95 transition-all text-xs"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir pieza
                </button>
            </div>

            {/* ALERTA SI INTENTA AVANZAR SIN ITEMS */}
            {errors?.items && fields.length === 0 && (
                <div className="alert alert-error shadow-xs rounded-xl py-2 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Debe agregar al menos una pieza para continuar.</span>
                </div>
            )}

            {/* ESTADO VACÍO (EMPTY STATE COMPACTO) */}
            {fields.length === 0 ? (
                <div className="bg-base-100 border-2 border-dashed border-base-300 rounded-2xl p-4 text-center flex flex-col items-center justify-center gap-2 animate-fade-in shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Package className="w-5 h-5" />
                    </div>
                    <div className="max-w-xs">
                        <h4 className="text-xs sm:text-sm font-bold text-base-content">
                            No hay piezas registradas
                        </h4>
                        <p className="text-[11px] sm:text-xs text-base-content/60 mt-0.5">
                            Añade la primera joya o trabajo a realizar.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="btn btn-primary btn-sm h-9 px-4 rounded-xl text-xs font-bold shadow-xs gap-1.5 active:scale-95 transition-all mt-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Primera Pieza
                    </button>
                </div>
            ) : (
                /* LISTA DE PIEZAS ULTRA COMPACTA CON SCROLL INTERNO */
                <div className="grid grid-cols-1 gap-2 max-h-72 sm:max-h-80 overflow-y-auto pr-1">
                    {fields.map((item, index) => {
                        const typeDisplay = ITEM_TYPES[item.item_type] || item.item_type;
                        const serviceDisplay = SERVICE_TYPES[item.service_requested] || item.service_requested;
                        const photoCount = item.photo_ids?.length || item.photos?.length || 0;
                        const itemPhotos = item.photos || [];

                        return (
                            <div key={item.id} className="bg-base-100 border border-base-200 hover:border-primary/40 rounded-xl p-2.5 sm:p-3 shadow-2xs transition-all space-y-1.5 animate-fade-in">
                                {/* FILA 1: BADGE TIPO DE JOYA + FOTOS + ACCIONES */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                                            <Package className="w-3 h-3 shrink-0" />
                                            #{index + 1} {typeDisplay}
                                        </span>
                                        <span className="bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                                            <Hammer className="w-3 h-3 shrink-0" />
                                            {serviceDisplay}
                                        </span>
                                        {photoCount > 0 && (
                                            <span className="bg-secondary/10 text-secondary border border-secondary/20 font-bold px-2 py-0.5 rounded-md text-[11px] flex items-center gap-1">
                                                <Camera className="w-3 h-3 shrink-0" />
                                                {photoCount} {photoCount === 1 ? 'Foto' : 'Fotos'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-0.5">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditModal(index)}
                                            className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
                                            title="Editar pieza"
                                            aria-label="Editar pieza"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(index)}
                                            disabled={deletingIndex === index}
                                            className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                                            title="Eliminar pieza"
                                            aria-label="Eliminar pieza"
                                        >
                                            {deletingIndex === index ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* FILA 2: DESCRIPCIÓN PRINCIPAL Y MINIATURAS SI EXISTEN */}
                                <div className="flex items-start justify-between gap-3">
                                    <p className="font-bold text-xs sm:text-sm text-base-content leading-snug wrap-break-words px-0.5">
                                        {item.description}
                                    </p>
                                    {itemPhotos.length > 0 && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            {itemPhotos.map((ph, pIdx) => ph.signedUrl && (
                                                <img
                                                    key={ph.id || pIdx}
                                                    src={ph.signedUrl}
                                                    alt={`Miniatura ${pIdx + 1}`}
                                                    className="w-8 h-8 rounded-lg object-cover border border-base-300 shadow-2xs"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* FILA 3: METADATOS EN LÍNEA ÚNICA */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-base-content/70 pt-0.5 px-0.5">
                                    <span className="flex flex-row gap-1 font-semibold text-base-content/90">
                                        <Weight className="w-3.5 h-3.5" />
                                        {item.initial_weight_grams} g
                                    </span>
                                    <span className="text-base-content/30">•</span>
                                    <span className="flex flex-row gap-1 font-bold text-primary">
                                        <DollarSign className="w-3.5 h-3.5 shrink-0" />
                                        {(parseFloat(item.unit_price) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    {item.price_detail && (
                                        <>
                                            <span className="text-base-content/30">•</span>
                                            <span className="italic text-base-content/60 truncate max-w-40 sm:max-w-xs flex flex-row gap-1">
                                                <DollarSign className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                                                {item.price_detail}
                                            </span>
                                        </>
                                    )}
                                    {item.material_details && item.material_details !== 'Sin observaciones' && (
                                        <>
                                            <span className="text-base-content/30">•</span>
                                            <span className="italic text-base-content/60 truncate max-w-40 sm:max-w-xs flex flex-row gap-1">
                                                <Memo className="w-3.5 h-3.5 shrink-0" />
                                                {item.material_details}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TARJETA RESUMEN CON LA SUMA TOTAL DE PRECIOS */}
            {fields.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between shadow-2xs animate-fade-in">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold shadow-xs">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-base-content block">
                                Suma Total Estimada de Piezas
                            </span>
                            <span className="text-[11px] text-base-content/60">
                                Calculado de {fields.length} {fields.length === 1 ? 'pieza registrada' : 'piezas registradas'}
                            </span>
                        </div>
                    </div>
                    <span className="text-base sm:text-lg font-extrabold text-primary">
                        ${totalItemsPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            )}

            {/* MODAL REUTILIZABLE PARA CREAR / EDITAR PIEZA E INCLUIR FOTOGRAFÍAS */}
            <Modal
                ref={modalRef}
                className="max-w-xl"
                modalTitle={editingIndex !== null ? `Editar Pieza #${editingIndex + 1}` : 'Agregar Nueva Pieza'}
                modalSubtitle="Completa los detalles de la joya y adjunta hasta 2 fotografías"
            >
                <div className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* TIPO DE JOYA */}
                        <div className="form-control w-full">
                            <label className="label py-1 flex items-center justify-between">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Tipo de Joya <span className="text-error">*</span>
                                </span>
                                <span className="text-[10px] text-base-content/50 font-normal">
                                    Escribe o selecciona
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    list="item-types-list"
                                    placeholder="Ej: Anillo, Arete, Reloj..."
                                    className={`input input-bordered w-full h-11 pl-9 pr-3 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${localErrors.item_type ? 'border-error' : ''}`}
                                    value={formData.item_type}
                                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                                />
                                <Tag className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40 pointer-events-none" />
                                <datalist id="item-types-list">
                                    {Object.values(ITEM_TYPES).map((val) => (
                                        <option key={val} value={val} />
                                    ))}
                                </datalist>
                            </div>
                            {/* Sugerencias rápidas */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {Object.values(ITEM_TYPES).map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, item_type: val })}
                                        className={`btn btn-xs rounded-lg text-[10px] font-medium transition-all ${formData.item_type === val
                                                ? 'btn-primary text-white shadow-2xs'
                                                : 'btn-ghost bg-base-200/70 hover:bg-base-200 text-base-content/70'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            {localErrors.item_type && (
                                <span className="text-xs text-error mt-0.5 font-medium">{localErrors.item_type}</span>
                            )}
                        </div>

                        {/* TIPO DE SERVICIO */}
                        <div className="form-control w-full">
                            <label className="label py-1 flex items-center justify-between">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Tipo de Servicio <span className="text-error">*</span>
                                </span>
                                <span className="text-[10px] text-base-content/50 font-normal">
                                    Escribe o selecciona
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    list="service-types-list"
                                    placeholder="Ej: Reparación, Ajuste, Grabado..."
                                    className={`input input-bordered w-full h-11 pl-9 pr-3 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${localErrors.service_requested ? 'border-error' : ''}`}
                                    value={formData.service_requested}
                                    onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })}
                                />
                                <Wrench className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40 pointer-events-none" />
                                <datalist id="service-types-list">
                                    {Object.values(SERVICE_TYPES).map((val) => (
                                        <option key={val} value={val} />
                                    ))}
                                </datalist>
                            </div>
                            {/* Sugerencias rápidas */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {Object.values(SERVICE_TYPES).map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, service_requested: val })}
                                        className={`btn btn-xs rounded-lg text-[10px] font-medium transition-all ${formData.service_requested === val
                                                ? 'btn-primary text-white shadow-2xs'
                                                : 'btn-ghost bg-base-200/70 hover:bg-base-200 text-base-content/70'
                                            }`}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            {localErrors.service_requested && (
                                <span className="text-xs text-error mt-0.5 font-medium">{localErrors.service_requested}</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* DESCRIPCIÓN DE LA PIEZA */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Descripción de la Pieza <span className="text-error">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ej: Anillo oro 14k con diamante"
                                    className={`input input-bordered w-full h-11 pl-9 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${localErrors.description ? 'border-error' : ''}`}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                                <Package className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                            </div>
                            {localErrors.description && (
                                <span className="text-xs text-error mt-0.5 font-medium">{localErrors.description}</span>
                            )}
                        </div>

                        {/* PESO INICIAL */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Peso inicial (gramos) <span className="text-error">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="Ej: 4.50"
                                    className={`input input-bordered w-full h-11 pl-9 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${localErrors.initial_weight_grams ? 'border-error' : ''}`}
                                    value={formData.initial_weight_grams}
                                    onChange={(e) => setFormData({ ...formData, initial_weight_grams: e.target.value })}
                                />
                                <Scale className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                            </div>
                            {localErrors.initial_weight_grams && (
                                <span className="text-xs text-error mt-0.5 font-medium">{localErrors.initial_weight_grams}</span>
                            )}
                        </div>
                    </div>

                    {/* OBSERVACIONES DE LA PIEZA */}
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-xs font-semibold text-base-content">
                                Observaciones / Estado Inicial
                            </span>
                        </label>
                        <div className="relative">
                            <textarea
                                placeholder="Detalles sobre rayones, gemas sueltas, desgaste previo..."
                                className="textarea textarea-bordered w-full pl-9 pt-2.5 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary min-h-20"
                                value={formData.material_details}
                                onChange={(e) => setFormData({ ...formData, material_details: e.target.value })}
                            ></textarea>
                            <MessageSquare className="w-4 h-4 absolute left-3 top-3 text-base-content/40" />
                        </div>
                    </div>

                    {/* PRECIO UNITARIO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Precio Unitario Estimado
                                </span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-3.5 text-base-content/40 font-medium">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="input input-bordered w-full pl-8 pr-3 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary"
                                    value={formData.unit_price}
                                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                />
                            </div>
                            {localErrors.unit_price && (
                                <span className="text-xs text-error mt-0.5 font-medium">{localErrors.unit_price}</span>
                            )}
                        </div>

                        {/* DESGLOSE / JUSTIFICACIÓN DEL PRECIO */}
                        <div className="form-control w-full">
                            <label className="label py-1 flex items-center justify-between">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Desglose del Precio (opcional)
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Ej: 2000 mas 450 de mano de obra por 1 gramo extra"
                                    className="input input-bordered w-full pl-9 pr-3 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary"
                                    value={formData.price_detail || ''}
                                    onChange={(e) => setFormData({ ...formData, price_detail: e.target.value })}
                                />
                                <DollarSign className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN DE SUBIDA Y GESTIÓN DE FOTOGRAFÍAS (MÁX 2) */}
                    <ItemPhotoManager
                        photos={formData.photos}
                        onChangePhotos={(updatedPhotos) => {
                            setFormData((prev) => ({
                                ...prev,
                                photos: updatedPhotos,
                                photo_ids: updatedPhotos.map((p) => p.id)
                            }));
                        }}
                    />

                    {/* ACCIONES DEL MODAL */}
                    <div className="sticky -bottom-4 sm:-bottom-5 bg-base-100/95 backdrop-blur-xs pt-3 pb-1 border-t border-base-200 flex items-center justify-end gap-2 shrink-0 z-10">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="btn btn-ghost h-10 rounded-xl text-xs sm:text-sm font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveItem}
                            className="btn btn-primary h-10 rounded-xl px-4 text-xs sm:text-sm font-bold shadow-xs gap-1.5 active:scale-95 transition-all"
                        >
                            {editingIndex !== null ? (
                                <>
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Guardar Cambios
                                </>
                            ) : (
                                <>
                                    <Plus className="w-3.5 h-3.5" />
                                    Guardar Pieza
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
