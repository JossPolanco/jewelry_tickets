import React from 'react';
import { useNavigate } from 'react-router';
import { Calendar, Clock, ChevronRight, User, Phone, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDate as formatDateUtil } from '@/utils';

export default function HomePriorityWidget({ upcomingDeliveries = [], isLoading = false }) {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return formatDateUtil(dateString, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    const getUrgencyBadge = (daysDiff) => {
        if (daysDiff < 0) {
            const absDays = Math.abs(daysDiff);
            return {
                label: `Atrasada (${absDays} ${absDays === 1 ? 'día' : 'días'})`,
                className: 'bg-rose-500/15 text-rose-700 border-rose-500/30 font-bold',
                icon: AlertTriangle
            };
        }
        if (daysDiff === 0) {
            return {
                label: '¡ENTREGA HOY!',
                className: 'bg-rose-500 text-white font-bold animate-pulse',
                icon: Clock
            };
        }
        if (daysDiff === 1) {
            return {
                label: 'Mañana',
                className: 'bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold',
                icon: Clock
            };
        }
        return {
            label: `En ${daysDiff} días`,
            className: 'bg-blue-500/10 text-blue-700 border-blue-500/20 font-semibold',
            icon: Calendar
        };
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'recibido':
                return 'bg-info/10 text-info border-info/20';
            case 'en proceso':
            case 'reparación':
            case 'reparacion':
                return 'bg-warning/10 text-warning border-warning/20';
            case 'pendiente':
                return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'listo':
                return 'bg-success/10 text-success border-success/20';
            default:
                return 'bg-base-200 text-base-content/70 border-base-300';
        }
    };

    return (
        <div className="w-full bg-base-100 border border-base-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            {/* ENCABEZADO DEL WIDGET */}
            <div className="flex items-center justify-between gap-3 border-b border-base-200 pb-3.5">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-base-content tracking-tight">
                            Entregas Prometidas para esta Semana
                        </h2>
                        <p className="text-xs text-base-content/60 font-medium">
                            Prioridad de atención según la fecha pactada con el cliente
                        </p>
                    </div>
                </div>

                {!isLoading && (
                    <span className="bg-base-200 px-3 py-1 rounded-full text-xs font-bold text-base-content/80 shrink-0">
                        {upcomingDeliveries.length} {upcomingDeliveries.length === 1 ? 'orden' : 'órdenes'}
                    </span>
                )}
            </div>

            {/* LISTA DE ENTREGAS PROMETIDAS */}
            <div className="space-y-2.5">
                {isLoading ? (
                    <div className="space-y-3 py-2">
                        {[1, 2, 3].map((idx) => (
                            <div key={idx} className="bg-base-200/40 rounded-2xl p-4 animate-pulse flex items-center justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-base-200 rounded w-1/3" />
                                    <div className="h-3 bg-base-200 rounded w-1/2" />
                                </div>
                                <div className="h-6 w-20 bg-base-200 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : upcomingDeliveries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-base-200/30 rounded-2xl border border-dashed border-base-200">
                        <div className="w-12 h-12 bg-success/10 text-success rounded-full flex items-center justify-center mb-2.5">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-base-content">¡Todo al día!</h3>
                        <p className="text-xs text-base-content/60 max-w-xs mt-0.5">
                            No hay entregas pendientes ni atrasadas programadas para esta semana.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-base-200/60 flex flex-col gap-2 max-h-108 overflow-y-auto pr-1">
                        {upcomingDeliveries.map((order) => {
                            const urgency = getUrgencyBadge(order.daysDiff);
                            const UrgencyIcon = urgency.icon;
                            const customer = order.tbl_customers;
                            const customerName = customer?.full_name ||
                                (customer?.names ? `${customer.names} ${customer.lastnames || ''}`.trim() : 'Sin cliente');

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => navigate(`/service-orders/detail/${order.id}`)}
                                    className="bg-base-100 hover:bg-base-200/60 active:bg-base-200 border border-base-200/80 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        {/* FOLIO */}
                                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary font-mono font-bold flex flex-col items-center justify-center text-xs shrink-0 border border-primary/20">
                                            <span className="text-[10px] opacity-70 leading-none">FOLIO</span>
                                            <span className="text-sm font-extrabold leading-none mt-0.5">#{order.folio || '—'}</span>
                                        </div>

                                        {/* INFO DEL CLIENTE Y ORDEN */}
                                        <div className="min-w-0 space-y-1 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-base-content group-hover:text-primary transition-colors truncate">
                                                    {customerName}
                                                </span>
                                                <span className={`badge badge-xs font-semibold border ${getStatusBadge(order.status)}`}>
                                                    {order.status || 'Recibido'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-base-content/60 flex-wrap">
                                                {customer?.phone && (
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Phone className="w-3 h-3 text-base-content/40 shrink-0" />
                                                        {customer.phone}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-base-content/40 shrink-0" />
                                                    Promesa: <strong className="text-base-content/80">{formatDate(order.promised_date)}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* INSIGNIA DE URGENCIA Y FLECHA */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2.5 py-1 rounded-full text-xs border flex items-center gap-1 ${urgency.className}`}>
                                            <UrgencyIcon className="w-3.5 h-3.5" />
                                            <span>{urgency.label}</span>
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-base-content/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
