import React, { useRef, useEffect, useMemo } from 'react';
import { PenTool, FileText } from 'lucide-react';
import SignatureInput from '@/components/SignatureInput';
import { useFormContext } from 'react-hook-form';

export default function StepSignature() {
    const { register, setValue, getValues, watch } = useFormContext();
    const signatureRef = useRef(null);
    const hasUserDrawn = useRef(false);

    // Callback estable que NUNCA cambia de identidad - usa ref para setValue
    const setValueRef = useRef(setValue);
    setValueRef.current = setValue;

    const handleSignatureChange = useRef((data) => {
        hasUserDrawn.current = true;
        setValueRef.current('signature_data', data, { shouldDirty: true });
    }).current;

    // Detectar restauración de borrador: watch solo dispara re-render de StepSignature,
    // pero SignatureInput está blindado con React.memo(() => true)
    const watchedSignature = watch('signature_data');

    useEffect(() => {
        if (watchedSignature && !hasUserDrawn.current && signatureRef.current?.loadData) {
            signatureRef.current.loadData(watchedSignature);
        }
    }, [watchedSignature]);

    return (
        <div className="space-y-4 py-2 animate-fade-in">
            <div className="border-b border-base-200 pb-2">
                <h3 className="text-base font-semibold text-base-content flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-primary" />
                    PASO 4: FIRMA
                </h3>
                <p className="text-xs text-base-content/70">
                    Obtén la firma de conformidad del cliente y registra notas finales.
                </p>
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text font-medium">Notas Generales de la Orden</span>
                </label>
                <div className="relative">
                    <textarea
                        {...register("notes_general")}
                        placeholder="Términos particulares, instrucciones especiales de entrega..."
                        className="textarea textarea-bordered w-full pl-10 pt-3 min-h-17.5"
                    ></textarea>
                    <FileText className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                </div>
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text font-medium">Firma Digital del Cliente</span>
                </label>
                <div className="border border-base-300 rounded-2xl p-3 bg-base-200/30">
                    <SignatureInput
                        ref={signatureRef}
                        defaultValue={getValues('signature_data')}
                        onChange={handleSignatureChange}
                    />
                </div>
            </div>
        </div>
    );
}
