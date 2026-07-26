import React from 'react';
import { Package, Wrench, MessageSquare } from 'lucide-react';

export default function StepItems() {
    return (
        <div className="space-y-4 py-2 animate-fade-in">
            <div className="border-b border-base-200 pb-2">
                <h3 className="text-base font-semibold text-base-content flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    PASO 2: PIEZAS
                </h3>
                <p className="text-xs text-base-content/70">
                    Registra las joyas o piezas recibidas y los trabajos a realizar.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text font-medium">Descripción de la Pieza</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Ej: Anillo de oro 14k con diamante"
                            className="input input-bordered w-full pl-10"
                            readOnly
                        />
                        <Package className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                    </div>
                </div>

                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text font-medium">Tipo de Servicio</span>
                    </label>
                    <div className="relative">
                        <select className="select select-bordered w-full pl-10" disabled defaultValue="">
                            <option value="" disabled>Selecciona el servicio...</option>
                            <option value="repair">Reparación</option>
                            <option value="adjustment">Ajuste de medida</option>
                            <option value="engraving">Grabado</option>
                            <option value="custom">Fabricación / Diseño</option>
                        </select>
                        <Wrench className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text font-medium">Observaciones de la Pieza / Estado Inicial</span>
                </label>
                <div className="relative">
                    <textarea
                        placeholder="Detalles sobre rayones, gemas sueltas, desgaste previo..."
                        className="textarea textarea-bordered w-full pl-10 pt-3 min-h-20"
                        readOnly
                    ></textarea>
                    <MessageSquare className="w-4 h-4 absolute left-3 top-3.5 text-base-content/40" />
                </div>
            </div>
        </div>
    );
}
