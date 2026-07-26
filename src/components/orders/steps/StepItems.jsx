import React, { useState, useRef } from 'react';
import { Package, Wrench, MessageSquare, Plus, Trash2, Edit3, Scale, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import ITEM_TYPES from '../../../utils/orders/item_types.js';
import SERVICE_TYPES from '../../../utils/orders/service_types.js';
import { useFormContext, useFieldArray } from 'react-hook-form';
import Modal from '@/components/Modal';

export default function StepItems() {
    const { control, formState: { errors }, clearErrors } = useFormContext();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "items"
    });

    const modalRef = useRef(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const initialFormState = {
        item_type: '',
        description: '',
        initial_weight_grams: '',
        service_requested: '',
        material_details: ''
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

    // Abre el modal en modo edición para un item específico
    const handleOpenEditModal = (index) => {
        const itemToEdit = fields[index];
        setEditingIndex(index);
        setFormData({
            item_type: itemToEdit.item_type || '',
            description: itemToEdit.description || '',
            initial_weight_grams: itemToEdit.initial_weight_grams !== undefined ? String(itemToEdit.initial_weight_grams) : '',
            service_requested: itemToEdit.service_requested || '',
            material_details: itemToEdit.material_details || ''
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

    // Valida y guarda (agrega o actualiza) el item en react-hook-form
    const handleSaveItem = (e) => {
        if (e) e.preventDefault();

        const errorsObj = {};
        if (!formData.item_type) errorsObj.item_type = 'Selecciona un tipo de joya';
        if (!formData.description?.trim()) errorsObj.description = 'Ingresa la descripción de la pieza';
        
        const parsedWeight = parseFloat(formData.initial_weight_grams);
        if (formData.initial_weight_grams === '' || isNaN(parsedWeight) || parsedWeight < 0) {
            errorsObj.initial_weight_grams = 'Ingresa un peso válido (0 o mayor)';
        }
        if (!formData.service_requested) errorsObj.service_requested = 'Selecciona el tipo de servicio';

        if (Object.keys(errorsObj).length > 0) {
            setLocalErrors(errorsObj);
            return;
        }

        const itemPayload = {
            item_type: formData.item_type,
            description: formData.description.trim(),
            initial_weight_grams: parsedWeight,
            service_requested: formData.service_requested,
            material_details: formData.material_details?.trim() || 'Sin observaciones',
            photo_ids: []
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

    return (
        <div className="space-y-4 py-1 animate-fade-in">
            {/* ENCABEZADO DEL PASO 2 */}
            <div className="border-b border-base-200 pb-2.5 flex items-center justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2">                        
                        <h3 className="text-sm sm:text-base font-bold text-base-content flex items-center gap-1.5">
                            <Package className="w-4 h-4 text-primary" />
                            Piezas / Joyas a Procesar
                        </h3>
                    </div>
                    <p className="text-xs text-base-content/70 mt-0.5">
                        Registra las joyas y trabajos para esta orden.
                    </p>
                </div>

                {fields.length > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        <span>{fields.length} {fields.length === 1 ? 'Pieza' : 'Piezas'}</span>
                    </div>
                )}
            </div>

            {/* ALERTA SI INTENTA AVANZAR SIN ITEMS */}
            {errors?.items && fields.length === 0 && (
                <div className="alert alert-error shadow-xs rounded-xl py-2.5 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Debe agregar al menos una pieza para continuar.</span>
                </div>
            )}

            {/* ESTADO VACÍO (EMPTY STATE COMPACTO) */}
            {fields.length === 0 ? (
                <div className="bg-base-100 border-2 border-dashed border-base-300 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-2.5 animate-fade-in shadow-2xs">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Package className="w-6 h-6" />
                    </div>
                    <div className="max-w-xs">
                        <h4 className="text-sm font-bold text-base-content">
                            No hay piezas registradas
                        </h4>
                        <p className="text-xs text-base-content/60 mt-0.5">
                            Añade al menos una pieza a reparar o fabricar para esta orden.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenAddModal}
                        className="btn btn-primary btn-md h-11 px-5 rounded-xl text-xs sm:text-sm font-bold shadow-xs gap-2 active:scale-95 transition-all mt-1"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Primera Pieza
                    </button>
                </div>
            ) : (
                /* LISTA DE PIEZAS REGISTRADAS COMPACTA */
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                            Piezas en esta orden ({fields.length})
                        </span>
                        <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="btn btn-primary btn-sm rounded-xl px-3 font-bold gap-1 active:scale-95 transition-all text-xs"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Añadir pieza
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                        {fields.map((item, index) => {
                            const typeDisplay = ITEM_TYPES[item.item_type] || item.item_type;
                            const serviceDisplay = SERVICE_TYPES[item.service_requested] || item.service_requested;

                            return (
                                <div
                                    key={item.id}
                                    className="bg-base-100 border border-base-200 hover:border-primary/40 rounded-xl p-3 shadow-2xs transition-all space-y-2 animate-fade-in"
                                >
                                    {/* CARD HEADER COMPACTO */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="badge badge-primary badge-sm font-bold text-[11px] h-5">
                                                #{index + 1}
                                            </span>
                                            <span className="bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-md text-[11px]">
                                                {typeDisplay}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
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
                                                onClick={() => remove(index)}
                                                className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                                                title="Eliminar pieza"
                                                aria-label="Eliminar pieza"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* DESCRIPCIÓN */}
                                    <h4 className="text-sm font-bold text-base-content leading-snug break-words">
                                        {item.description}
                                    </h4>

                                    {/* DETALLES EN LÍNEA */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-base-200/80 text-base-content/80 border border-base-300/40">
                                            <Scale className="w-3 h-3 text-primary" />
                                            <span>Peso: {item.initial_weight_grams} g</span>
                                        </span>

                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                                            <Wrench className="w-3 h-3 text-primary" />
                                            <span>Servicio: {serviceDisplay}</span>
                                        </span>
                                    </div>

                                    {/* OBSERVACIONES COMPACTAS */}
                                    {item.material_details && item.material_details !== 'Sin observaciones' && (
                                        <div className="text-xs text-base-content/70 flex items-center gap-1.5 italic bg-base-200/50 rounded-lg px-2.5 py-1 border border-base-200">
                                            <MessageSquare className="w-3 h-3 text-base-content/40 shrink-0" />
                                            <span className="truncate">{item.material_details}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL REUTILIZABLE DEL PROYECTO PARA CREAR / EDITAR PIEZA */}
            <Modal
                ref={modalRef}
                className="max-w-xl"
                modalTitle={editingIndex !== null ? `Editar Pieza #${editingIndex + 1}` : 'Agregar Nueva Pieza'}
                modalSubtitle="Completa los detalles de la joya o trabajo a realizar"
            >
                <div className="space-y-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* TIPO DE JOYA */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Tipo de Joya <span className="text-error">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <select
                                    className={`select select-bordered w-full h-11 pl-9 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${localErrors.item_type ? 'border-error' : ''}`}
                                    value={formData.item_type}
                                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                                >
                                    <option value="" disabled>Selecciona tipo...</option>
                                    {Object.entries(ITEM_TYPES).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                                <Tag className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40 pointer-events-none" />
                            </div>
                            {localErrors.item_type && (
                                <span className="text-xs text-error mt-0.5 font-medium">{localErrors.item_type}</span>
                            )}
                        </div>

                        {/* TIPO DE SERVICIO */}
                        <div className="form-control w-full">
                            <label className="label py-1">
                                <span className="label-text text-xs font-semibold text-base-content">
                                    Tipo de Servicio <span className="text-error">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <select
                                    className={`select select-bordered w-full h-11 pl-9 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${localErrors.service_requested ? 'border-error' : ''}`}
                                    value={formData.service_requested}
                                    onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })}
                                >
                                    <option value="" disabled>Selecciona servicio...</option>
                                    {Object.entries(SERVICE_TYPES).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                                <Wrench className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40 pointer-events-none" />
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

                    {/* ACCIONES DEL MODAL */}
                    <div className="pt-3 border-t border-base-200 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="btn btn-ghost h-11 rounded-xl text-xs sm:text-sm font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveItem}
                            className="btn btn-primary h-11 rounded-xl px-4 text-xs sm:text-sm font-bold shadow-xs gap-1.5 active:scale-95 transition-all"
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
