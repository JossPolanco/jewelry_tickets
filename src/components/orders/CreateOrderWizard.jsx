import React, { useState } from 'react';
import { User, Package, DollarSign, PenTool, ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';
import StepClient from './steps/StepClient';
import StepItems from './steps/StepItems';
import StepCostsDate from './steps/StepCostsDate';
import StepSignature from './steps/StepSignature';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { useUser } from '@/utils/context/UserContext';
import { zodResolver } from '@hookform/resolvers/zod';

const itemSchema = z.object({
    service_order_id: z.string().optional(),
    item_type: z.string().min(1, "Tipo de item requerido"),
    description: z.string().min(1, "Descripción del item requerido"),
    initial_weight_grams: z.coerce.number({ invalid_type_error: "El peso debe ser un número válido" }).min(0, "Peso inicial en gramos requerido"),
    material_details: z.string().optional().default(""),
    service_requested: z.string().min(1, "Servicio solicitado requerido"),
    photo_ids: z.array(z.string()).optional().default([]),
})

const orderSchema = z.object({
    organization_id: z.string().min(1, "ID de organización requerido"),
    customer_id: z.string().min(1, "ID de cliente requerido"),
    folio: z.string().min(1, "Folio requerido"),
    status: z.string().min(1, "Estado requerido"),
    total_estimated_cost: z.number().min(1, "Costo estimado requerido"),
    advance_payment: z.number().optional().default(0.00),
    signature_data: z.any().nullable().optional(),
    notes_general: z.string().optional().default("Sin observaciones"),
    promised_date: z.string().min(1, "Fecha prometida requerida"),
    items: z.array(itemSchema).min(1, "Debe agregar al menos una pieza"),
});

const STEPS = [
    { id: 1, label: 'CLIENTE', icon: User },
    { id: 2, label: 'PIEZAS', icon: Package },
    { id: 3, label: 'COSTOS/FECHA', icon: DollarSign },
    { id: 4, label: 'FIRMA', icon: PenTool },
];

export default function CreateOrderWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const { organization } = useUser()

    const methods = useForm({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            organization_id: organization?.organization_id || "",
            customer_id: "",
            folio: "",
            status: "PENDIENTE",
            total_estimated_cost: 0.00,
            advance_payment: 0.00,
            signature_data: null,
            notes_general: "Sin observaciones",
            promised_date: "",
            items: [],
        }
    })

    const { handleSubmit, trigger } = methods;

    const handleNext = async () => {
        let fieldsToValidate = [];

        if (currentStep === 1) fieldsToValidate = ['customer_id'];
        if (currentStep === 2) fieldsToValidate = ['items'];

        const isStepValid = await methods.trigger(fieldsToValidate);

        if (isStepValid && currentStep < STEPS.length) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const onSubmit = (data) => {
        console.log("Datos de la orden a guardar:", data);
        // Aquí llamarás a tu servicio de Supabase para guardar la orden e ítems
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <StepClient />;
            case 2:
                return <StepItems />;
            case 3:
                return <StepCostsDate />;
            case 4:
                return <StepSignature />;
            default:
                return <StepClient />;
        }
    };

    return (
        <div className="w-full flex flex-col space-y-6">
            <FormProvider {...methods}>
                <div className="w-full flex flex-col space-y-6">
                    {/* Stepper Header */}
                    <div className="w-full">
                        <ul className="steps steps-horizontal w-full text-xs sm:text-sm font-medium">
                            {STEPS.map((step) => {
                                const Icon = step.icon;
                                const isCompleted = currentStep > step.id;
                                const isActive = currentStep === step.id;

                                return (
                                    <li key={step.id} data-content={isCompleted ? '✓' : step.id} className={`step ${isActive || isCompleted ? 'step-primary' : ''} transition-all duration-200`} >
                                        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 mt-1">
                                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : ''}`} />
                                            <span className={`${isActive ? 'font-bold text-primary' : ''}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Step Content Area */}
                    <div className="min-h-65 bg-base-100/50 rounded-2xl p-2 sm:p-4 border border-base-200">
                        {renderStepContent()}
                    </div>

                    {/* Footer Navigation Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-base-200">
                        <button
                            type="button"
                            onClick={handlePrev}
                            disabled={currentStep === 1}
                            className="btn btn-outline btn-sm sm:btn-md gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Anterior
                        </button>

                        <span className="text-xs text-base-content/60 font-medium">
                            Paso {currentStep} de {STEPS.length}
                        </span>

                        {currentStep < STEPS.length ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="btn btn-primary btn-sm sm:btn-md gap-1"
                            >
                                Siguiente
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={methods.handleSubmit(onSubmit)}
                                className="btn btn-success btn-sm sm:btn-md gap-1 text-white"
                            >
                                <Save className="w-4 h-4" />
                                Guardar Orden
                            </button>
                        )}
                    </div>
                </div>
            </FormProvider>
        </div>
    );
}
