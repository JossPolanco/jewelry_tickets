import React, { useEffect, useRef } from 'react';
import { DollarSign, Calendar, CreditCard, RefreshCw } from 'lucide-react';
import { useFormContext, Controller } from 'react-hook-form';
import { DayPicker } from "react-day-picker";
import { Modal } from "@/components/";
import { es } from 'date-fns/locale';

// Helper: Convierte Date u otro valor estrictamente a 'YYYY-MM-DD'
const formatDateToYYYYMMDD = (dateVal) => {
    if (!dateVal) return "";
    if (dateVal instanceof Date) {
        if (isNaN(dateVal.getTime())) return "";
        const year = dateVal.getFullYear();
        const month = String(dateVal.getMonth() + 1).padStart(2, '0');
        const day = String(dateVal.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    if (typeof dateVal === 'string') {
        const match = dateVal.match(/^\d{4}-\d{2}-\d{2}/);
        if (match) return match[0];
    }
    return String(dateVal);
};

// Helper: Convierte string 'YYYY-MM-DD' a Date local para DayPicker
const parseYYYYMMDDToDate = (dateStr) => {
    if (!dateStr) return undefined;
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? undefined : dateStr;
    if (typeof dateStr === 'string') {
        const cleanStr = dateStr.split('T')[0];
        const parts = cleanStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                return new Date(year, month, day);
            }
        }
    }
    return undefined;
};

export default function StepCostsDate() {
    const formContext = useFormContext();
    const register = formContext?.register;
    const watch = formContext?.watch;
    const setValue = formContext?.setValue;
    const errors = formContext?.formState?.errors;
    const refCalendarModal = useRef(null);
    const control = formContext?.control;

    const items = watch ? watch('items') || [] : [];
    const currentCost = watch ? watch('total_estimated_cost') : 0;

    const itemsTotal = items.reduce((sum, item) => sum + (parseFloat(item?.unit_price) || 0), 0);

    // Asigna por default la suma de los ítems si costo estimado no se ha fijado o es 0
    useEffect(() => {
        if (setValue && (currentCost === undefined || currentCost === null || currentCost === 0)) {
            setValue('total_estimated_cost', itemsTotal, { shouldValidate: true });
        }
    }, [itemsTotal, currentCost, setValue]);

    const dateFieldValue = watch ? (watch('promised_date') || watch('realizationDate') || '') : '';

    return (
        <div className="space-y-4 py-2 animate-fade-in">
            <div className="border-b border-base-200 pb-2">
                <h3 className="text-base font-semibold text-base-content flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    PASO 3: COSTOS / FECHA
                </h3>
                <p className="text-xs text-base-content/70">
                    Establece los costos estimados, anticipos y la fecha de entrega acordada.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* COSTO TOTAL ESTIMADO (DEFAULT SUMA DE ITEMS, EDITABLE) */}
                <div className="form-control w-full">
                    <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm font-semibold text-base-content">
                            Costo Total Estimado ($) <span className="text-error">*</span>
                        </span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className={`input input-bordered w-full h-11 pl-9 pr-3 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${errors?.total_estimated_cost ? 'border-error' : ''}`}
                            {...(register ? register('total_estimated_cost', { valueAsNumber: true }) : {})}
                        />
                        <DollarSign className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                    </div>
                    {errors?.total_estimated_cost && (
                        <span className="text-xs text-error mt-0.5 font-medium">
                            {errors.total_estimated_cost.message}
                        </span>
                    )}

                    {/* INDICADOR DE SUMA DE PIEZAS */}
                    <div className="mt-1.5 text-[11px] text-base-content/70 flex items-center justify-between bg-base-200/60 px-2.5 py-1 rounded-lg">
                        <span>
                            Suma de piezas: <strong className="text-primary font-bold">${itemsTotal.toFixed(2)}</strong>
                        </span>
                        {Number(currentCost) !== itemsTotal && (
                            <button
                                type="button"
                                onClick={() => setValue && setValue('total_estimated_cost', itemsTotal, { shouldValidate: true })}
                                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                title="Usar suma total de los ítems"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Restablecer (${itemsTotal.toFixed(2)})
                            </button>
                        )}
                    </div>
                </div>

                {/* ANTICIPO / PAGO ADELANTADO */}
                <div className="form-control w-full">
                    <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm font-semibold text-base-content">
                            Anticipo / Pago Adelantado ($)
                        </span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className={`input input-bordered w-full h-11 pl-9 pr-3 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary ${errors?.advance_payment ? 'border-error' : ''}`}
                            {...(register ? register('advance_payment', { valueAsNumber: true }) : {})}
                        />
                        <CreditCard className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                    </div>
                    {errors?.advance_payment && (
                        <span className="text-xs text-error mt-0.5 font-medium">
                            {errors.advance_payment.message}
                        </span>
                    )}
                </div>
            </div>

            {/* FECHA DE ENTREGA / REALIZACIÓN */}
            <div className="form-control w-full">
                <label className="label py-1">
                    <span className="label-text text-xs sm:text-sm font-semibold text-base-content">
                        Fecha de entrega acordada <span className="text-error">*</span>
                    </span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        readOnly
                        className={`input input-bordered w-full h-11 pl-9 pr-3 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary cursor-pointer transition-colors hover:border-base-400 focus:ring-2 focus:ring-primary/20 ${(errors?.promised_date || errors?.realizationDate) ? 'border-error' : ''}`}
                        placeholder="Seleccionar fecha (YYYY-MM-DD)"
                        value={formatDateToYYYYMMDD(dateFieldValue)}
                        onClick={() => refCalendarModal.current?.open()}
                    />
                    <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40 pointer-events-none" />
                </div>
                {(errors?.promised_date || errors?.realizationDate) && (
                    <span className="text-xs text-error mt-0.5 font-medium">
                        {(errors?.promised_date || errors?.realizationDate)?.message}
                    </span>
                )}
            </div>

            <Modal ref={refCalendarModal} modalTitle="Seleccionar fecha de entrega" className="max-w-sm md:max-w-sm">
                <Controller
                    control={control}
                    name="promised_date"
                    render={({ field }) => {
                        const selectedDateObject = parseYYYYMMDDToDate(field.value || watch?.('realizationDate'));
                        return (
                            <div className="flex flex-col items-center justify-center p-1.5 overflow-hidden max-w-full">
                                <DayPicker
                                    mode="single"
                                    selected={selectedDateObject}
                                    onSelect={(date) => {
                                        if (date) {
                                            const formattedDate = formatDateToYYYYMMDD(date);
                                            field.onChange(formattedDate);
                                            if (setValue) {
                                                setValue('realizationDate', formattedDate, { shouldValidate: true });
                                            }
                                            refCalendarModal.current?.close();
                                        }
                                    }}
                                    locale={es}
                                />
                            </div>
                        );
                    }}
                />
            </Modal>
        </div>
    );
}
