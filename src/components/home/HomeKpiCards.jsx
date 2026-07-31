import React from 'react';
import { Hammer, PackageCheck, ShoppingBag, AlertCircle } from 'lucide-react';

export default function HomeKpiCards({ kpis = {}, isLoading = false }) {
    const {
        inProgressCount = 0,
        readyForPickupCount = 0,
        deliveredThisMonthCount = 0,
        overdueOrDueTodayCount = 0,
    } = kpis;

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((idx) => (
                    <div key={idx} className="bg-base-100 border border-base-200 rounded-2xl p-4 sm:p-5 shadow-xs animate-pulse space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="h-4 w-20 bg-base-200 rounded-md" />
                            <div className="w-9 h-9 bg-base-200 rounded-xl" />
                        </div>
                        <div className="h-8 w-14 bg-base-200 rounded-lg" />
                        <div className="h-3 w-24 bg-base-200 rounded-md" />
                    </div>
                ))}
            </div>
        );
    }

    const cards = [
        {
            id: 'in_progress',
            title: 'En Reparación',
            subtitle: 'Piezas en taller',
            value: inProgressCount,
            badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            iconBg: 'bg-amber-500/10 text-amber-600',
            icon: Hammer,
            borderStyle: 'border-base-200 hover:border-amber-500/40',
        },
        {
            id: 'ready',
            title: 'Listas para Entrega',
            subtitle: 'Esperando recolección',
            value: readyForPickupCount,
            badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
            iconBg: 'bg-emerald-500/10 text-emerald-600',
            icon: PackageCheck,
            borderStyle: 'border-base-200 hover:border-emerald-500/40',
        },
        {
            id: 'delivered',
            title: 'Entregadas',
            subtitle: 'Entregas del mes',
            value: deliveredThisMonthCount,
            badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            iconBg: 'bg-blue-500/10 text-blue-600',
            icon: ShoppingBag,
            borderStyle: 'border-base-200 hover:border-blue-500/40',
        },
        {
            id: 'overdue',
            title: 'Atrasadas / Por Vencer',
            subtitle: 'Atención requerida',
            value: overdueOrDueTodayCount,
            badgeBg: overdueOrDueTodayCount > 0 ? 'bg-rose-500/15 text-rose-600 border-rose-500/30' : 'bg-base-200/60 text-base-content/60 border-base-200',
            iconBg: overdueOrDueTodayCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-base-200 text-base-content/60',
            icon: AlertCircle,
            borderStyle: overdueOrDueTodayCount > 0
                ? 'border-rose-500/40 bg-rose-500/5 shadow-xs'
                : 'border-base-200 hover:border-base-300',
            isUrgent: overdueOrDueTodayCount > 0
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.id}
                        className={`bg-base-100 border ${card.borderStyle} rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200 flex flex-col justify-between relative overflow-hidden group`}
                    >
                        {/* HEADER CON ICONO Y ETIQUETA */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-base-content/70 tracking-tight leading-tight">
                                {card.title}
                            </span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${card.iconBg}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>

                        {/* VALOR PRINCIPAL GRANDE */}
                        <div className="my-1">
                            <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${card.isUrgent ? 'text-rose-600' : 'text-base-content'}`}>
                                {card.value}
                            </span>
                        </div>

                        {/* SUBTÍTULO EXPLICATIVO */}
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-base-content/60 font-medium truncate">
                                {card.subtitle}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
