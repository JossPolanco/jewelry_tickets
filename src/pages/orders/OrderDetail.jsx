import {
    ArrowLeft, Edit3, Calendar, User, Phone, Mail, Package, Scale, DollarSign, Hammer, MessageSquare,
    Clock, AlertCircle, Plus, Trash2, Camera, Loader2, X, Send, RefreshCw, PenTool, ShieldCheck, Image as ImageIcon
} from 'lucide-react';
import { getOrderDetail, getOrderItems, updateOrder, updateOrderItem, createOrderItem, deleteOrderItem } from '@/services/orders';
import { getImageById, deleteImageMetadata } from '@/services/images/imageMetadata';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteImage, BUCKETS } from '@/services/images/imageUploader';
import { useImageUpload } from '@/hooks/images/useImageUpload';
import { getCurrentUser } from '@/services/user/userService';
import { getSignedUrl } from '@/services/images/imageUrl';
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useUser } from '@/utils/context/UserContext';
import { ITEM_TYPES, SERVICE_TYPES } from '@/utils';
import { Download } from 'reicon-react';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import { PDFDownloadLink } from '@react-pdf/renderer';
import OrderServicePDF, { getPdfPhotoDataUrl } from '../../utils/pdfs/OrderServicePDF';

// ESTADOS DE ORDEN DISPONIBLES
const ORDER_STATUS_OPTIONS = [
    'Recibido',
    'En proceso',
    'Pendiente',
    'Reparación',
    'Listo',
    'Entregado',
    'Cancelado'
];

// SUBCOMPONENTE DE GESTIÓN DE FOTOGRAFÍAS DENTRO DEL MODAL DE ÍTEM
function ItemPhotoManager({ photos = [], onChangePhotos }) {
    const { user } = useUser();
    const [loadingUser, setLoadingUser] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const fileInputRef = useRef(null);

    const { upload, state, reset } = useImageUpload({
        bucket: BUCKETS.PHOTOS,
        gallery: 'item_photos',
        profile: 'photo',
        onSuccess: async (image, previewUrl) => {
            let finalUrl = previewUrl;
            try {
                const urlRes = await getSignedUrl(image.storage_path, image.bucket || BUCKETS.PHOTOS);
                if (urlRes?.success && urlRes?.data?.signedUrl) {
                    finalUrl = urlRes.data.signedUrl;
                }
            } catch (err) {
                console.warn('Usando vista previa optimizada en memoria:', err);
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

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        let targetUserId = user?.id || loadingUser?.id;
        if (!targetUserId) {
            try {
                const curUser = await getCurrentUser();
                targetUserId = curUser?.id;
                setLoadingUser(curUser);
            } catch (err) {
                console.error('No se pudo identificar al usuario para subir la imagen:', err);
                return;
            }
        }

        if (!targetUserId) return;
        upload(file, targetUserId);
    };

    const handleDeletePhoto = async (photoToDelete) => {
        try {
            setDeletingId(photoToDelete.id);
            await deleteImageMetadata(photoToDelete.id).catch((err) => console.warn(err));
            if (photoToDelete.storage_path) {
                await deleteImage(photoToDelete.storage_path, photoToDelete.bucket || BUCKETS.PHOTOS).catch((err) => console.warn(err));
            }
        } catch (error) {
            console.error('Error al eliminar la fotografía:', error);
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
                    Fotografías de la pieza (máx. 2)
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
                    <div key={photo.id || idx} className="relative group rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-video flex items-center justify-center shadow-xs">
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
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`border-2 border-dashed border-base-300 hover:border-primary/60 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 text-base-content/60 hover:text-primary transition-all aspect-video min-h-24 ${isUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/5'}`}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                <span className="text-[11px] font-medium text-primary">Subiendo... ({state.progress}%)</span>
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5 text-primary" />
                                <span className="text-[11px] font-bold">Añadir Foto ({photos.length}/2)</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {state.stage === 'error' && (
                <div className="alert alert-error text-xs py-1.5 px-3 rounded-lg">
                    <span>{state.error || 'Error al subir la imagen'}</span>
                </div>
            )}
        </div>
    );
}

function SignatureDisplay({ signatureData }) {
    const canvasRef = useRef(null);

    const drawSignature = () => {
        if (!signatureData || !canvasRef.current) return;

        let parsedData = signatureData;
        if (typeof signatureData === 'string') {
            try {
                parsedData = JSON.parse(signatureData);
            } catch (e) {
                // Si no se puede parsear como JSON, podría ser una Data URL directamente
                return;
            }
        }

        if (Array.isArray(parsedData) && parsedData.length > 0) {
            const canvas = canvasRef.current;
            const container = canvas.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const width = rect.width || 350;
            const height = 160;

            const ratio = window.devicePixelRatio || 1;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            const ctx = canvas.getContext('2d');
            ctx.scale(ratio, ratio);

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            parsedData.forEach((stroke) => {
                if (Array.isArray(stroke)) {
                    stroke.forEach((pt) => {
                        if (pt.x < minX) minX = pt.x;
                        if (pt.x > maxX) maxX = pt.x;
                        if (pt.y < minY) minY = pt.y;
                        if (pt.y > maxY) maxY = pt.y;
                    });
                }
            });

            if (minX === Infinity || minY === Infinity) return;

            const strokeWidth = maxX - minX || 1;
            const strokeHeight = maxY - minY || 1;
            const padding = 20;

            const scaleX = (width - padding * 2) / strokeWidth;
            const scaleY = (height - padding * 2) / strokeHeight;
            const scale = Math.min(scaleX, scaleY, 1.5);

            const offsetX = (width - strokeWidth * scale) / 2 - minX * scale;
            const offsetY = (height - strokeHeight * scale) / 2 - minY * scale;

            ctx.clearRect(0, 0, width, height);
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#1e293b';

            parsedData.forEach((stroke) => {
                if (!Array.isArray(stroke) || stroke.length === 0) return;
                ctx.beginPath();
                stroke.forEach((pt, i) => {
                    const x = pt.x * scale + offsetX;
                    const y = pt.y * scale + offsetY;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                ctx.stroke();
            });
        }
    };

    useEffect(() => {
        drawSignature();
        window.addEventListener('resize', drawSignature);
        return () => window.removeEventListener('resize', drawSignature);
    }, [signatureData]);

    if (!signatureData) return null;

    if (typeof signatureData === 'string' && (signatureData.startsWith('data:image/') || signatureData.startsWith('http'))) {
        return (
            <img
                src={signatureData}
                alt="Firma del cliente"
                className="max-h-36 object-contain"
            />
        );
    }

    return (
        <div className="w-full bg-white rounded-xl p-2 border border-base-300 shadow-inner flex items-center justify-center">
            <canvas ref={canvasRef} className="block cursor-default" />
        </div>
    );
}

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // TOAST NOTIFICACIONES
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // VISTA EN LIGHTBOX
    const [lightboxImage, setLightboxImage] = useState(null);

    // DICCIONARIO CON RESOLUCIÓN DE IMÁGENES POR ÍTEM
    const [resolvedItemPhotos, setResolvedItemPhotos] = useState({});

    // REFERENCIAS DE MODALES
    const editOrderModalRef = useRef(null);
    const editItemModalRef = useRef(null);

    // CONSULTAS TANSTACK QUERY CON getOrderDetail Y getOrderItems
    const {
        data: orderData,
        isLoading: isLoadingOrder,
        isError: isErrorOrder,
        error: orderError,
        refetch: refetchOrder
    } = useQuery({
        queryKey: ['orderDetail', id],
        queryFn: () => getOrderDetail(id),
        enabled: !!id
    });

    const {
        data: orderItemsData,
        isLoading: isLoadingItems,
        refetch: refetchItems
    } = useQuery({
        queryKey: ['orderItems', id],
        queryFn: () => getOrderItems(id),
        enabled: !!id
    });

    const order = orderData || null;
    const items = orderItemsData || orderData?.order_items || [];
    const customer = order?.tbl_customers || null;

    // RESOLVER FOTOS CON URLs FIRMADAS AL CARGAR ÍTEMS
    useEffect(() => {
        if (!items || items.length === 0) return;

        let isMounted = true;

        const loadPhotosForItems = async () => {
            const photosMap = {};

            await Promise.all(
                items.map(async (item) => {
                    const photoIds = item.photo_ids || [];
                    if (photoIds.length > 0) {
                        const fetchedPhotos = await Promise.all(
                            photoIds.map(async (pId) => {
                                try {
                                    const metaRes = await getImageById(pId);
                                    if (metaRes.success) {
                                        const img = metaRes.data.image;
                                        const urlRes = await getSignedUrl(img.storage_path, img.bucket || BUCKETS.PHOTOS);
                                        const signedUrl = urlRes.success ? urlRes.data.signedUrl : null;
                                        const dataUrl = await getPdfPhotoDataUrl(img.storage_path, img.bucket || BUCKETS.PHOTOS);
                                        return {
                                            id: img.id,
                                            storage_path: img.storage_path,
                                            bucket: img.bucket || BUCKETS.PHOTOS,
                                            signedUrl,
                                            dataUrl: dataUrl || signedUrl
                                        };
                                    }
                                } catch (err) {
                                    console.warn('No se pudo resolver la foto ID:', pId, err);
                                }
                                return { id: pId };
                            })
                        );
                        photosMap[item.id] = fetchedPhotos.filter(Boolean);
                    } else {
                        photosMap[item.id] = [];
                    }
                })
            );

            if (isMounted) {
                setResolvedItemPhotos(photosMap);
            }
        };

        loadPhotosForItems();

        return () => {
            isMounted = false;
        };
    }, [items]);

    // ORDEN DE SERVICIO PREPARADA CON FOTOGRAFÍAS BASE64 PARA PDF
    const fullPreparedOrder = useEffect ? React.useMemo(() => {
        if (!order) return null;
        const orderItems = items.map((item) => {
            const itemPhotos = resolvedItemPhotos[item.id] || [];
            return {
                ...item,
                photos: itemPhotos
            };
        });
        return {
            ...order,
            order_items: orderItems,
            items: orderItems
        };
    }, [order, items, resolvedItemPhotos]) : null;

    // MUTACIÓN PARA ACTUALIZAR DATOS DE LA ORDEN DE SERVICIO
    const [orderForm, setOrderForm] = useState({
        status: '',
        promised_date: '',
        total_estimated_cost: 0,
        advance_payment: 0,
        notes_general: ''
    });

    const handleOpenEditOrderModal = () => {
        if (!order) return;
        setOrderForm({
            status: order.status || 'Recibido',
            promised_date: order.promised_date ? order.promised_date.split('T')[0] : '',
            total_estimated_cost: order.total_estimated_cost || 0,
            advance_payment: order.advance_payment || 0,
            notes_general: order.notes_general || ''
        });
        editOrderModalRef.current?.open();
    };

    const updateOrderMutation = useMutation({
        mutationFn: (payload) => updateOrder(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(['orderDetail', id]);
            queryClient.invalidateQueries(['ordersPreview']);
            editOrderModalRef.current?.close();
            showToast('Orden actualizada correctamente', 'success');
        },
        onError: (err) => {
            showToast(err?.message || 'Error al actualizar la orden', 'error');
        }
    });

    const handleSaveOrderHeader = (e) => {
        e.preventDefault();
        updateOrderMutation.mutate({
            status: orderForm.status,
            promised_date: orderForm.promised_date || null,
            total_estimated_cost: parseFloat(orderForm.total_estimated_cost) || 0,
            advance_payment: parseFloat(orderForm.advance_payment) || 0,
            notes_general: orderForm.notes_general.trim()
        });
    };

    // FORMULARIO Y MUTACIONES PARA CREAR / EDITAR / ELIMINAR PIEZAS (ÍTEMS)
    const [itemEditing, setItemEditing] = useState(null); // null = creando nuevo
    const [itemForm, setItemForm] = useState({
        item_type: '',
        service_requested: '',
        description: '',
        initial_weight_grams: '',
        material_details: '',
        unit_price: '',
        photos: []
    });
    const [itemErrors, setItemErrors] = useState({});

    const handleOpenAddItemModal = () => {
        setItemEditing(null);
        setItemForm({
            item_type: '',
            service_requested: '',
            description: '',
            initial_weight_grams: '',
            material_details: '',
            unit_price: '',
            photos: []
        });
        setItemErrors({});
        editItemModalRef.current?.open();
    };

    const handleOpenEditItemModal = (item) => {
        setItemEditing(item);
        const photosForItem = resolvedItemPhotos[item.id] || [];
        setItemForm({
            item_type: item.item_type || '',
            service_requested: item.service_requested || '',
            description: item.description || '',
            initial_weight_grams: item.initial_weight_grams !== undefined ? String(item.initial_weight_grams) : '',
            material_details: item.material_details || '',
            unit_price: item.unit_price !== undefined ? String(item.unit_price) : '',
            photos: photosForItem
        });
        setItemErrors({});
        editItemModalRef.current?.open();
    };

    const saveItemMutation = useMutation({
        mutationFn: async (payload) => {
            if (itemEditing) {
                return updateOrderItem(itemEditing.id, payload);
            } else {
                return createOrderItem({
                    service_order_id: id,
                    ...payload
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['orderDetail', id]);
            queryClient.invalidateQueries(['orderItems', id]);
            queryClient.invalidateQueries(['ordersPreview']);
            editItemModalRef.current?.close();
            showToast(itemEditing ? 'Pieza actualizada correctamente' : 'Pieza agregada correctamente', 'success');
        },
        onError: (err) => {
            showToast(err?.message || 'Error al guardar la pieza', 'error');
        }
    });

    const deleteItemMutation = useMutation({
        mutationFn: (itemId) => deleteOrderItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries(['orderDetail', id]);
            queryClient.invalidateQueries(['orderItems', id]);
            queryClient.invalidateQueries(['ordersPreview']);
            showToast('Pieza eliminada correctamente', 'success');
        },
        onError: (err) => {
            showToast(err?.message || 'Error al eliminar la pieza', 'error');
        }
    });

    const handleSaveItem = (e) => {
        e.preventDefault();
        const errs = {};

        if (!itemForm.item_type) errs.item_type = 'Selecciona el tipo de joya';
        if (!itemForm.service_requested) errs.service_requested = 'Selecciona el servicio';
        if (!itemForm.description?.trim()) errs.description = 'Ingresa la descripción de la pieza';

        const weight = parseFloat(itemForm.initial_weight_grams);
        if (itemForm.initial_weight_grams === '' || isNaN(weight) || weight < 0) {
            errs.initial_weight_grams = 'Ingresa un peso válido (0 o mayor)';
        }

        const price = parseFloat(itemForm.unit_price);
        if (itemForm.unit_price === '' || isNaN(price) || price < 0) {
            errs.unit_price = 'Ingresa un precio válido (0 o mayor)';
        }

        if (Object.keys(errs).length > 0) {
            setItemErrors(errs);
            return;
        }

        const photoIds = (itemForm.photos || []).map((p) => p.id);

        saveItemMutation.mutate({
            item_type: itemForm.item_type,
            service_requested: itemForm.service_requested,
            description: itemForm.description.trim(),
            initial_weight_grams: weight,
            material_details: itemForm.material_details?.trim() || 'Sin observaciones',
            unit_price: price,
            photo_ids: photoIds
        });
    };

    const handleDeleteItem = async (item) => {
        if (confirm(`¿Estás seguro de que deseas eliminar la pieza "${item.description}"?`)) {
            // Eliminar fotografías asociadas
            const photoIds = item.photo_ids || [];
            if (photoIds.length > 0) {
                await Promise.all(
                    photoIds.map(async (pId) => {
                        try {
                            const metaRes = await getImageById(pId);
                            if (metaRes.success) {
                                await deleteImageMetadata(pId).catch(() => { });
                                if (metaRes.data.image.storage_path) {
                                    await deleteImage(metaRes.data.image.storage_path, metaRes.data.image.bucket || BUCKETS.PHOTOS).catch(() => { });
                                }
                            }
                        } catch (err) {
                            console.warn('Error borrando foto de item:', err);
                        }
                    })
                );
            }
            deleteItemMutation.mutate(item.id);
        }
    };

    // AYUDANTES DE FORMATO
    const formatCurrency = (val) => {
        const num = Number(val) || 0;
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Sin fecha';
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (statusStr) => {
        switch (statusStr?.toLowerCase()) {
            case 'recibido':
                return 'badge-info bg-info/10 text-info border-info/20';
            case 'en proceso':
                return 'badge-warning bg-warning/10 text-warning border-warning/20';
            case 'pendiente':
                return 'badge-warning bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'reparacion':
                return 'badge-secondary bg-secondary/10 text-secondary border-secondary/20';
            case 'listo':
                return 'badge-success bg-success/10 text-success border-success/20';
            case 'entregado':
                return 'badge-neutral bg-base-content/10 text-base-content border-base-content/20';
            case 'cancelado':
                return 'badge-error bg-error/10 text-error border-error/20';
            default:
                return 'badge-ghost bg-base-200 text-base-content/70';
        }
    };

    // GENERAR MENSAJE DE WHATSAPP CON EL RECIBO DE LA ORDEN
    const handleSendWhatsApp = () => {
        if (!customer?.phone) {
            showToast('El cliente no tiene número de teléfono registrado', 'error');
            return;
        }

        const cleanPhone = customer.phone.replace(/\D/g, '');
        const message = `*Joyería - Orden de Servicio #${order.folio || ''}*\n\nHola ${customer.names} ${customer.lastnames || ''},\n\n` +
            `Tu orden de servicio ha sido registrada con éxito:\n` +
            `• *Estado:* ${order.status}\n` +
            `• *Total Estimado:* ${formatCurrency(order.total_estimated_cost)}\n` +
            `• *Anticipo:* ${formatCurrency(order.advance_payment)}\n` +
            `• *Saldo Pendiente:* ${formatCurrency((order.total_estimated_cost || 0) - (order.advance_payment || 0))}\n` +
            `• *Fecha Prometida:* ${formatDate(order.promised_date)}\n\n` +
            `¡Gracias por tu confianza!`;

        const encodedMsg = encodeURIComponent(message);
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    };

    const handleDownloadPdf = () => {
        console.log("Descargar PDF")
    }

    // ESTADO DE CARGA Y ERRORES DE LA PÁGINA
    if (isLoadingOrder) {
        return (
            <div className="min-h-[80vh] bg-base-300 flex flex-col items-center justify-center p-6">
                <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
                <p className="text-sm font-semibold text-base-content/70 animate-pulse">
                    Cargando información de la orden...
                </p>
            </div>
        );
    }

    if (isErrorOrder || !order) {
        return (
            <div className="min-h-[80vh] bg-base-300 flex items-center justify-center p-4">
                <div className="card bg-base-100 border border-base-200 shadow-md max-w-md w-full p-6 text-center space-y-4 rounded-3xl">
                    <div className="w-14 h-14 bg-error/10 text-error rounded-2xl mx-auto flex items-center justify-center">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-base-content">No se pudo cargar la orden</h2>
                        <p className="text-xs text-base-content/60 mt-1">
                            {orderError?.message || 'La orden solicitada no existe o no se tienen permisos para verla.'}
                        </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button
                            type="button"
                            onClick={() => navigate('/service-orders')}
                            className="btn btn-outline btn-sm rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver a lista
                        </button>
                        <button
                            type="button"
                            onClick={() => refetchOrder()}
                            className="btn btn-primary btn-sm rounded-xl gap-1 text-white"
                        >
                            <RefreshCw className="w-4 h-4" /> Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const totalCost = parseFloat(order.total_estimated_cost) || 0;
    const advance = parseFloat(order.advance_payment) || 0;
    const pendingBalance = Math.max(0, totalCost - advance);

    return (
        <div className="min-h-screen bg-base-300 p-3 sm:p-6 lg:p-8 animate-fade-in space-y-5">
            {toast && <Toast message={toast.message} type={toast.type} />}

            {/* CONTENEDOR PRINCIPAL MAX-W-6XL */}
            <div className="max-w-6xl mx-auto space-y-5">

                {/* BOTÓN VOLVER Y ENCABEZADO DE ACCIONES */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-base-100 border border-base-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/service-orders')}
                            className="btn btn-circle btn-ghost btn-sm hover:bg-base-200 active:scale-95 transition-transform"
                            title="Volver a la lista de órdenes"
                            aria-label="Volver"
                        >
                            <ArrowLeft className="w-5 h-5 text-base-content/70" />
                        </button>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-extrabold text-base-content font-mono tracking-tight">
                                    Orden #{order.folio || '—'}
                                </h1>
                                <span className={`badge badge-md font-bold border ${getStatusBadge(order.status)}`}>
                                    {order.status || 'Recibido'}
                                </span>
                            </div>
                            <p className="text-xs text-base-content/60 mt-0.5 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                Registrada el {formatDate(order.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* BOTONES DE ACCIÓN PRINCIPALES */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-base-200">
                        <PDFDownloadLink
                            key={fullPreparedOrder?.order_items?.map((i) => i.photos?.map((p) => p.dataUrl || p.id).join('-')).join('_') || 'pdf-loading'}
                            document={<OrderServicePDF order={fullPreparedOrder || order} itemPhotosMap={resolvedItemPhotos} />}
                            fileName={`orden_${order?.folio || 'servicio'}.pdf`}
                        >
                            {({ blob, url, loading, error }) => (
                                loading ? (
                                    <span
                                        className="btn btn-error btn-sm h-11 rounded-xl font-bold gap-1.5 shadow-xs transition-all text-xs sm:text-sm flex-1 sm:flex-none text-white pointer-events-none opacity-70 flex items-center justify-center"
                                    >
                                        <Download className="w-4 h-4" />
                                        Cargando...
                                    </span>
                                ) : (
                                    <span
                                        className="btn btn-error btn-sm h-11 rounded-xl font-bold gap-1.5 shadow-xs active:scale-95 transition-all text-xs sm:text-sm flex-1 sm:flex-none text-white flex items-center justify-center"
                                    >
                                        <Download className="w-4 h-4" />
                                        Descargar PDF
                                    </span>
                                )
                            )}
                        </PDFDownloadLink>

                        {customer?.phone && (
                            <button
                                type="button"
                                onClick={handleSendWhatsApp}
                                className="btn btn-success btn-sm h-11 rounded-xl text-white font-bold gap-1.5 shadow-xs active:scale-95 transition-all text-xs sm:text-sm flex-1 sm:flex-none"
                                title="Enviar comprobante por WhatsApp"
                            >
                                <Send className="w-4 h-4" />
                                <span className="hidden xs:inline">Enviar</span> WhatsApp
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleOpenEditOrderModal}
                            className="btn btn-primary btn-sm h-11 rounded-xl font-bold gap-1.5 shadow-xs active:scale-95 transition-all text-xs sm:text-sm flex-1 sm:flex-none"
                        >
                            <Edit3 className="w-4 h-4" />
                            Editar Orden
                        </button>
                    </div>
                </div>

                {/* GRID DE DOS COLUMNAS EN DESKTOP (IZQ: DATOS / DER: PIEZAS Y FIRMA) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                    {/* COLUMNA IZQUIERDA: RESUMEN FINANCIERO, CLIENTE Y NOTAS (1 COL EN LG) */}
                    <div className="space-y-5 lg:col-span-1">

                        {/* TARJETA RESUMEN FINANCIERO */}
                        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-xs space-y-4">
                            <h2 className="text-sm font-extrabold text-base-content flex items-center gap-2 border-b border-base-200 pb-3">
                                <DollarSign className="w-4 h-4 text-primary" />
                                Balance de la Orden
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="text-base-content/70 font-medium">Costo Total Estimado:</span>
                                    <strong className="text-base-content font-bold">{formatCurrency(totalCost)}</strong>
                                </div>

                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="text-base-content/70 font-medium">Anticipo Recibido:</span>
                                    <strong className="text-success font-bold">{formatCurrency(advance)}</strong>
                                </div>

                                <div className="pt-2 border-t border-base-200 flex items-center justify-between">
                                    <span className="text-xs sm:text-sm font-bold text-base-content">Saldo Pendiente:</span>
                                    <span className={`text-base sm:text-lg font-extrabold ${pendingBalance > 0 ? 'text-amber-600' : 'text-success'}`}>
                                        {formatCurrency(pendingBalance)}
                                    </span>
                                </div>
                            </div>

                            {/* FECHA PROMESA DE ENTREGA */}
                            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3.5 flex items-center gap-3 mt-2">
                                <Clock className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <span className="text-[11px] font-bold text-base-content/60 block uppercase">
                                        Fecha Prometida de Entrega
                                    </span>
                                    <span className="text-xs sm:text-sm font-extrabold text-primary">
                                        {formatDate(order.promised_date)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TARJETA INFORMACIÓN DEL CLIENTE */}
                        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-xs space-y-3.5">
                            <h2 className="text-sm font-extrabold text-base-content flex items-center gap-2 border-b border-base-200 pb-3">
                                <User className="w-4 h-4 text-primary" />
                                Información del Cliente
                            </h2>

                            {customer ? (
                                <div className="space-y-2.5 text-xs sm:text-sm">
                                    <div>
                                        <span className="text-base-content/60 text-[11px] font-medium block">Nombre completo</span>
                                        <span className="font-bold text-base-content text-sm sm:text-base">
                                            {customer.names} {customer.lastnames || ''}
                                        </span>
                                    </div>

                                    {customer.phone && (
                                        <div className="flex items-center gap-2 text-base-content/80">
                                            <Phone className="w-4 h-4 text-primary shrink-0" />
                                            <a
                                                href={`tel:${customer.phone}`}
                                                className="hover:underline font-semibold text-primary"
                                            >
                                                {customer.phone}
                                            </a>
                                        </div>
                                    )}

                                    {customer.email && (
                                        <div className="flex items-center gap-2 text-base-content/80">
                                            <Mail className="w-4 h-4 text-primary shrink-0" />
                                            <span className="truncate">{customer.email}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-base-content/50 italic">
                                    No hay cliente asociado a esta orden.
                                </p>
                            )}
                        </div>

                        {/* TARJETA OBSERVACIONES GENERALES */}
                        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-xs space-y-3">
                            <h2 className="text-sm font-extrabold text-base-content flex items-center gap-2 border-b border-base-200 pb-3">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                Observaciones Generales
                            </h2>
                            <p className="text-xs sm:text-sm text-base-content/80 whitespace-pre-wrap leading-relaxed">
                                {order.notes_general || 'Sin observaciones adicionales.'}
                            </p>
                        </div>

                        {/* TARJETA DE FIRMA DIGITAL SI EXISTE */}
                        {order.signature_data && (
                            <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-xs space-y-3">
                                <h2 className="text-sm font-extrabold text-base-content flex items-center gap-2 border-b border-base-200 pb-3">
                                    <PenTool className="w-4 h-4 text-primary" />
                                    Firma Digital del Cliente
                                </h2>
                                <div className="bg-base-200/50 rounded-xl p-2 border border-base-300 flex items-center justify-center overflow-hidden">
                                    <SignatureDisplay signatureData={order.signature_data} />
                                </div>
                                <span className="text-[11px] text-base-content/60 flex items-center gap-1 justify-center">
                                    <ShieldCheck className="w-3.5 h-3.5 text-success" />
                                    Firma de conformidad capturada al registrar
                                </span>
                            </div>
                        )}

                    </div>

                    {/* COLUMNA DERECHA: PIEZAS REGISTRADAS (2 COLS EN LG) */}
                    <div className="space-y-5 lg:col-span-2">
                        <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-base-200 pb-3">
                                <div className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-primary" />
                                    <h2 className="text-base font-extrabold text-base-content">
                                        Piezas / Joyas de la Orden
                                    </h2>
                                    <span className="badge badge-primary badge-sm font-bold">
                                        {items.length}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleOpenAddItemModal}
                                    className="btn btn-primary btn-sm h-9 rounded-xl px-3 font-bold gap-1 active:scale-95 transition-all text-xs"
                                >
                                    <Plus className="w-4 h-4" />
                                    Añadir pieza
                                </button>
                            </div>

                            {/* LISTA DE PIEZAS */}
                            {isLoadingItems ? (
                                <div className="py-12 text-center space-y-2">
                                    <span className="loading loading-spinner loading-md text-primary"></span>
                                    <p className="text-xs text-base-content/60">Cargando piezas de la orden...</p>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="py-12 border-2 border-dashed border-base-300 rounded-2xl text-center space-y-3 p-4">
                                    <Package className="w-10 h-10 text-base-content/30 mx-auto" />
                                    <p className="text-sm font-bold text-base-content">No hay piezas registradas en esta orden</p>
                                    <button
                                        type="button"
                                        onClick={handleOpenAddItemModal}
                                        className="btn btn-primary btn-sm rounded-xl text-xs gap-1.5"
                                    >
                                        <Plus className="w-4 h-4" /> Agregar primera pieza
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3.5">
                                    {items.map((item, idx) => {
                                        const typeDisplay = ITEM_TYPES[item.item_type] || item.item_type;
                                        const serviceDisplay = SERVICE_TYPES[item.service_requested] || item.service_requested;
                                        const itemPhotos = resolvedItemPhotos[item.id] || [];

                                        return (
                                            <div
                                                key={item.id || idx}
                                                className="bg-base-100 border border-base-200 hover:border-primary/40 rounded-2xl p-4 shadow-xs space-y-3 transition-all"
                                            >
                                                {/* CABECERA DE LA PIEZA */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="bg-primary/10 text-primary border border-primary/20 font-extrabold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1">
                                                            <Package className="w-3.5 h-3.5" />
                                                            Pieza #{idx + 1} • {typeDisplay}
                                                        </span>
                                                        <span className="bg-secondary/10 text-secondary border border-secondary/20 font-bold px-2 py-0.5 rounded-lg text-xs flex items-center gap-1">
                                                            <Hammer className="w-3.5 h-3.5" />
                                                            {serviceDisplay}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEditItemModal(item)}
                                                            className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10"
                                                            title="Editar pieza"
                                                            aria-label="Editar pieza"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteItem(item)}
                                                            className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                                                            title="Eliminar pieza"
                                                            aria-label="Eliminar pieza"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* DESCRIPCIÓN */}
                                                <p className="text-sm font-bold text-base-content leading-snug">
                                                    {item.description}
                                                </p>

                                                {/* METADATOS: PESO, PRECIO, OBSERVACIONES */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-base-200/50 rounded-xl p-3 text-xs">
                                                    <div>
                                                        <span className="text-[11px] text-base-content/60 block font-medium">Peso Inicial</span>
                                                        <span className="font-bold text-base-content flex items-center gap-1 mt-0.5">
                                                            <Scale className="w-3.5 h-3.5 text-primary" />
                                                            {item.initial_weight_grams} g
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <span className="text-[11px] text-base-content/60 block font-medium">Precio Unitario</span>
                                                        <span className="font-extrabold text-primary flex items-center gap-1 mt-0.5">
                                                            <DollarSign className="w-3.5 h-3.5" />
                                                            {formatCurrency(item.unit_price)}
                                                        </span>
                                                    </div>

                                                    <div className="col-span-2 sm:col-span-1">
                                                        <span className="text-[11px] text-base-content/60 block font-medium">Detalles / Estado</span>
                                                        <span className="italic text-base-content/80 truncate block mt-0.5">
                                                            {item.material_details || 'Sin observaciones'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* GALERÍA DE FOTOS DE LA PIEZA */}
                                                {itemPhotos.length > 0 && (
                                                    <div className="space-y-1.5 pt-1">
                                                        <span className="text-[11px] font-bold text-base-content/60 flex items-center gap-1">
                                                            <Camera className="w-3.5 h-3.5 text-primary" />
                                                            Fotografías adjuntas ({itemPhotos.length})
                                                        </span>
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                            {itemPhotos.map((photo, pIdx) => (
                                                                <div
                                                                    key={photo.id || pIdx}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={() => photo.signedUrl && setLightboxImage(photo.signedUrl)}
                                                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && photo.signedUrl && setLightboxImage(photo.signedUrl)}
                                                                    className="relative rounded-xl overflow-hidden aspect-video border border-base-300 bg-base-200 cursor-pointer group shadow-2xs hover:opacity-90 transition-all"
                                                                >
                                                                    {photo.signedUrl ? (
                                                                        <img
                                                                            src={photo.signedUrl}
                                                                            alt={`Foto ${pIdx + 1}`}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex items-center justify-center h-full text-[10px] text-base-content/40">
                                                                            Cargando foto...
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL PARA EDITAR ENCABEZADO / DATOS GENERALES DE LA ORDEN */}
            <Modal
                ref={editOrderModalRef}
                className="max-w-lg"
                modalTitle="Editar Orden de Servicio"
                modalSubtitle="Modifica el estado, la fecha prometida de entrega y los montos generales"
            >
                <form onSubmit={handleSaveOrderHeader} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* ESTADO */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Estado de la Orden
                                </span>
                            </label>
                            <select
                                className="select select-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary"
                                value={orderForm.status}
                                onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                            >
                                {ORDER_STATUS_OPTIONS.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>

                        {/* FECHA PROMESA */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Fecha Prometida de Entrega
                                </span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary"
                                value={orderForm.promised_date}
                                onChange={(e) => setOrderForm({ ...orderForm, promised_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* COSTO TOTAL ESTIMADO */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Costo Total Estimado ($)
                                </span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input input-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary"
                                value={orderForm.total_estimated_cost}
                                onChange={(e) => setOrderForm({ ...orderForm, total_estimated_cost: e.target.value })}
                            />
                        </div>

                        {/* ANTICIPO */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Anticipo Recibido ($)
                                </span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input input-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary"
                                value={orderForm.advance_payment}
                                onChange={(e) => setOrderForm({ ...orderForm, advance_payment: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* OBSERVACIONES GENERALES */}
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-xs font-semibold text-base-content">
                                Observaciones Generales
                            </span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered w-full pt-2.5 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary min-h-24"
                            placeholder="Añade observaciones o instrucciones especiales..."
                            value={orderForm.notes_general}
                            onChange={(e) => setOrderForm({ ...orderForm, notes_general: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-3 border-t border-base-200 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => editOrderModalRef.current?.close()}
                            className="btn btn-ghost h-11 rounded-xl text-xs sm:text-sm font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={updateOrderMutation.isPending}
                            className="btn btn-primary h-11 rounded-xl px-4 text-xs sm:text-sm font-bold shadow-xs gap-1.5 active:scale-95 transition-all text-white"
                        >
                            {updateOrderMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL PARA AGREGAR O EDITAR PIEZA DE LA ORDEN */}
            <Modal
                ref={editItemModalRef}
                className="max-w-xl"
                modalTitle={itemEditing ? 'Editar Pieza' : 'Añadir Nueva Pieza'}
                modalSubtitle="Modifica la información de la joya, servicio y sus fotografías"
            >
                <form onSubmit={handleSaveItem} className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* TIPO DE JOYA */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Tipo de Joya <span className="text-error">*</span>
                                </span>
                            </label>
                            <select
                                className={`select select-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${itemErrors.item_type ? 'border-error' : ''}`}
                                value={itemForm.item_type}
                                onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value })}
                            >
                                <option value="" disabled>Selecciona tipo...</option>
                                {Object.entries(ITEM_TYPES).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                            {itemErrors.item_type && (
                                <span className="text-xs text-error mt-0.5 font-medium">{itemErrors.item_type}</span>
                            )}
                        </div>

                        {/* TIPO DE SERVICIO */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Tipo de Servicio <span className="text-error">*</span>
                                </span>
                            </label>
                            <select
                                className={`select select-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${itemErrors.service_requested ? 'border-error' : ''}`}
                                value={itemForm.service_requested}
                                onChange={(e) => setItemForm({ ...itemForm, service_requested: e.target.value })}
                            >
                                <option value="" disabled>Selecciona servicio...</option>
                                {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                            {itemErrors.service_requested && (
                                <span className="text-xs text-error mt-0.5 font-medium">{itemErrors.service_requested}</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* DESCRIPCIÓN DE LA PIEZA */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Descripción de la Pieza <span className="text-error">*</span>
                                </span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: Anillo de oro 14k con rubí"
                                className={`input input-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${itemErrors.description ? 'border-error' : ''}`}
                                value={itemForm.description}
                                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                            />
                            {itemErrors.description && (
                                <span className="text-xs text-error mt-0.5 font-medium">{itemErrors.description}</span>
                            )}
                        </div>

                        {/* PESO INICIAL */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Peso Inicial (gramos) <span className="text-error">*</span>
                                </span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Ej: 3.50"
                                className={`input input-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${itemErrors.initial_weight_grams ? 'border-error' : ''}`}
                                value={itemForm.initial_weight_grams}
                                onChange={(e) => setItemForm({ ...itemForm, initial_weight_grams: e.target.value })}
                            />
                            {itemErrors.initial_weight_grams && (
                                <span className="text-xs text-error mt-0.5 font-medium">{itemErrors.initial_weight_grams}</span>
                            )}
                        </div>
                    </div>

                    {/* PRECIO UNITARIO */}
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-xs font-semibold text-base-content">
                                Precio Unitario ($) <span className="text-error">*</span>
                            </span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className={`input input-bordered w-full h-11 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${itemErrors.unit_price ? 'border-error' : ''}`}
                            value={itemForm.unit_price}
                            onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
                        />
                        {itemErrors.unit_price && (
                            <span className="text-xs text-error mt-0.5 font-medium">{itemErrors.unit_price}</span>
                        )}
                    </div>

                    {/* OBSERVACIONES / DETALLES DE MATERIAL */}
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-xs font-semibold text-base-content">
                                Observaciones / Estado de la Pieza
                            </span>
                        </label>
                        <textarea
                            placeholder="Detalles sobre desgaste previo, gemas sueltas..."
                            className="textarea textarea-bordered w-full pt-2.5 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary min-h-20"
                            value={itemForm.material_details}
                            onChange={(e) => setItemForm({ ...itemForm, material_details: e.target.value })}
                        ></textarea>
                    </div>

                    {/* FOTOGRAFÍAS DE LA PIEZA */}
                    <ItemPhotoManager
                        photos={itemForm.photos}
                        onChangePhotos={(photos) => setItemForm({ ...itemForm, photos })}
                    />

                    {/* BOTONES DE ACCIÓN */}
                    <div className="pt-3 border-t border-base-200 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => editItemModalRef.current?.close()}
                            className="btn btn-ghost h-11 rounded-xl text-xs sm:text-sm font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saveItemMutation.isPending}
                            className="btn btn-primary h-11 rounded-xl px-4 text-xs sm:text-sm font-bold shadow-xs gap-1.5 active:scale-95 transition-all text-white"
                        >
                            {saveItemMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                                </>
                            ) : itemEditing ? (
                                'Guardar Cambios'
                            ) : (
                                'Añadir Pieza'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* LIGHTBOX MODAL PARA VER FOTOGRAFÍA EN GRANDE */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 btn btn-circle btn-ghost text-white/80 hover:text-white z-50"
                        aria-label="Cerrar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Fotografía ampliada"
                        className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
