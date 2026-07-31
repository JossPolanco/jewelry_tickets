import { Search, Plus, X, Sparkles, Phone, User, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { quickSearchOrders } from '@/services/orders';
import { useNavigate } from 'react-router';

export default function HomeHeaderBanner({ user, organization, onOpenNewOrderModal }) {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResultsDropdown, setShowResultsDropdown] = useState(false);
    const searchContainerRef = useRef(null);

    // SALUDO DINAMICO DEPENDIENDO DE LA HORA DEL DIA
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '¡Hola! Buen día';
        if (hour < 19) return '¡Hola! Buenas tardes';
        return '¡Hola! Buenas noches';
    };

    // FECHA ACTUAL FORMATEADA AL ESPAÑOL
    const getCurrentFormattedDate = () => {
        const now = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const dateStr = now.toLocaleDateString('es-ES', options);
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    };

    // NOMBRE DEL USUARIO O FALLBACK
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

    // DEBOUNCE DE LA BÚSQUEDA RÁPIDA
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 250);
        return () => clearTimeout(timer);
    }, [search]);

    // EJECUTAR BÚSQUEDA CUANDO CAMBIA DEBOUNCEDSEARCH
    useEffect(() => {
        let isCurrent = true;
        if (!debouncedSearch) {
            setSearchResults([]);
            setIsSearching(false);
            setShowResultsDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowResultsDropdown(true);

        quickSearchOrders({
            organization_id: organization?.organization_id,
            search: debouncedSearch,
        })
            .then((results) => {
                if (isCurrent) {
                    setSearchResults(results || []);
                    setIsSearching(false);
                }
            })
            .catch((err) => {
                console.error("Error en búsqueda rápida:", err);
                if (isCurrent) {
                    setSearchResults([]);
                    setIsSearching(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [debouncedSearch, organization?.organization_id]);

    // CERRAR DROPDOWN AL HACER CLICK FUERA
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowResultsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // HANDLER PARA CUANDO SELECCIONA UNA ORDEN DEL DROPDOWN
    const handleSelectOrder = (orderId) => {
        setShowResultsDropdown(false);
        setSearch('');
        navigate(`/service-orders/detail/${orderId}`);
    };

    // GET STATUS BADGE CLASS
    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'recibido':
                return 'badge-info bg-info/10 text-info border-info/20';
            case 'en proceso':
            case 'reparación':
            case 'reparacion':
                return 'badge-warning bg-warning/10 text-warning border-warning/20';
            case 'pendiente':
                return 'badge-warning bg-amber-500/10 text-amber-600 border-amber-500/20';
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

    return (
        <div className="w-full bg-base-100 border border-base-200 rounded-3xl p-5 sm:p-7 shadow-sm relative transition-all">
            {/* SUTIL RESPLANDOR DECORATIVO DE JOYERÍA */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <div className="flex flex-col gap-5 relative z-10">
                {/* SALUDO Y BOTÓN HERO CTA */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* SALUDO Y FECHA */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center p-1.5 rounded-xl bg-primary/10 text-primary">
                                <Sparkles className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
                                {getGreeting()}{userName ? `, ${userName}` : ''}
                            </h1>
                        </div>
                        <p className="text-sm font-medium text-base-content/70 flex items-center gap-1.5 pl-0.5">
                            <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
                            <span>{getCurrentFormattedDate()}</span>
                        </p>
                    </div>

                    {/* HERO CTA BUTTON */}
                    <button
                        onClick={onOpenNewOrderModal}
                        className="btn btn-primary h-13 sm:h-14 px-6 rounded-2xl shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2.5 text-white font-bold text-base sm:text-lg w-full md:w-auto shrink-0"
                    >
                        <Plus className="w-6 h-6 stroke-3" />
                        <span>Nueva Orden de Servicio</span>
                    </button>
                </div>

                {/* BUSCADOR RÁPIDO */}
                <div ref={searchContainerRef} className="relative w-full mt-1">
                    <div className="relative flex items-center">
                        <Search className="absolute left-4 text-base-content/40 w-5 h-5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar nota por folio, cliente o teléfono..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onFocus={() => {
                                if (debouncedSearch && searchResults.length > 0) {
                                    setShowResultsDropdown(true);
                                }
                            }}
                            className="input input-bordered w-full pl-12 pr-10 h-13 text-base rounded-2xl border-base-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-xs"
                        />
                        {search ? (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setSearchResults([]);
                                    setShowResultsDropdown(false);
                                }}
                                className="absolute right-3.5 text-base-content/40 hover:text-base-content p-1 rounded-full hover:bg-base-200 transition-colors"
                                title="Limpiar búsqueda"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        ) : isSearching ? (
                            <span className="absolute right-3.5">
                                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            </span>
                        ) : null}
                    </div>

                    {/* RESULTADOS DE BÚSQUEDA RÁPIDA (DROPDOWN / POPUP) */}
                    {showResultsDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-base-100 border border-base-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto animate-fade-in divide-y divide-base-200">
                            {isSearching ? (
                                <div className="p-4 flex items-center justify-center gap-2 text-sm text-base-content/60">
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    <span>Buscando órdenes...</span>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="p-5 text-center text-sm text-base-content/60">
                                    No se encontraron órdenes con &quot;<strong>{debouncedSearch}</strong>&quot;
                                </div>
                            ) : (
                                <div>
                                    <div className="px-4 py-2 bg-base-200/50 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                                        Resultados de búsqueda rápida ({searchResults.length})
                                    </div>
                                    {searchResults.map((order) => {
                                        const customer = order.tbl_customers;
                                        const customerName = customer?.full_name ||
                                            (customer?.names ? `${customer.names} ${customer.lastnames || ''}`.trim() : 'Sin cliente');

                                        return (
                                            <div
                                                key={order.id}
                                                onClick={() => handleSelectOrder(order.id)}
                                                className="p-3.5 sm:p-4 hover:bg-base-200/60 active:bg-base-200 cursor-pointer transition-colors flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-mono font-bold flex items-center justify-center text-sm shrink-0">
                                                        #{order.folio || '—'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold text-sm text-base-content truncate flex items-center gap-1">
                                                                <User className="w-3.5 h-3.5 text-base-content/50" />
                                                                {customerName}
                                                            </span>
                                                            <span className={`badge badge-xs font-semibold border ${getStatusBadgeClass(order.status)}`}>
                                                                {order.status || 'Recibido'}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-base-content/60 flex items-center gap-3 mt-1">
                                                            {customer?.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3 text-base-content/40" />
                                                                    {customer.phone}
                                                                </span>
                                                            )}
                                                            {order.promised_date && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3 text-base-content/40" />
                                                                    Promesa: {new Date(order.promised_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-base-content/40 shrink-0" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
