import React from 'react';
import { DollarSign, Calendar, CreditCard } from 'lucide-react';

export default function StepCostsDate() {
    return (
        <div className="space-y-4 py-2 animate-fade-in">
            <div className="border-b border-base-200 pb-2">
                <h3 className="text-base font-semibold text-base-content flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    PASO 3: COSTOS/FECHA
                </h3>
                <p className="text-xs text-base-content/70">
                    Establece los costos estimados, anticipos y la fecha de entrega acordada.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text font-medium">Costo Total Estimado ($)</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="0.00"
                            className="input input-bordered w-full pl-10"
                            readOnly
                        />
                        <DollarSign className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                    </div>
                </div>

                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text font-medium">Anticipo / Pago Adelantado ($)</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="0.00"
                            className="input input-bordered w-full pl-10"
                            readOnly
                        />
                        <CreditCard className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                    </div>
                </div>
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text font-medium">Fecha Prometida de Entrega</span>
                </label>
                <div className="relative">
                    <input
                        type="date"
                        className="input input-bordered w-full pl-10"
                        readOnly
                    />
                    <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                </div>
            </div>
        </div>
    );
}
