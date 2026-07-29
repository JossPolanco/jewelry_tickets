import { Search, ChevronLeft, ChevronRight, Calendar, X, RefreshCw, ClipboardList } from 'lucide-react';
import { useUser } from '@/utils/context/UserContext';
import { useState, useEffect, useRef } from 'react';
import { getOrderPreview } from '@/services/orders';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

export default function OrdersTable() {
    const navigate = useNavigate();
    const { organization } = useUser();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const timerRef = useRef(null);

    // Debounce de búsqueda para evitar peticiones excesivas
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPageIndex(0); // Reiniciar a la primera página al buscar
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Limpieza de timer de presionar fila
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Manejadores de mantener presionado (Long Press) en la fila para navegar a /order-detail{id}
    const handlePressStart = (order) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            navigate(`/order-detail/${order.id}`);
            timerRef.current = null;
        }, 450);
    };

    const handlePressEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    // Obtención de órdenes mediante getOrderPreview
    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['ordersPreview', organization?.organization_id, pageIndex, pageSize, debouncedSearch],
        queryFn: () =>
            getOrderPreview({
                pageIndex,
                pageSize,
                organization_id: organization?.organization_id,
                search: debouncedSearch,
            }),
        enabled: !!organization?.organization_id,
        keepPreviousData: true,
    });

    const orders = data?.data || [];
    const totalCount = data?.count || 0;
    const pageCount = data?.pageCount || (totalCount ? Math.ceil(totalCount / pageSize) : 0);

    const handlePrevPage = () => {
        if (pageIndex > 0) {
            setPageIndex((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (pageIndex < pageCount - 1) {
            setPageIndex((prev) => prev + 1);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(Number(e.target.value));
        setPageIndex(0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (amount) => {
        const num = Number(amount) || 0;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(num);
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
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

    return (
        <div className="w-full bg-base-100 border border-base-200 rounded-2xl shadow-sm overflow-hidden transition-all">
            {/* Header de la Tabla con Buscador */}
            <div className="p-4 sm:p-5 border-b border-base-200 bg-base-100/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por folio o estado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input-bordered w-full pl-10 pr-9 h-10 text-sm rounded-xl border-base-200 focus:border-primary focus:outline-none transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content p-0.5 rounded-full transition-colors"
                            title="Limpiar búsqueda"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-base-content/70 font-medium">
                    {isFetching && !isLoading && (
                        <span className="flex items-center gap-1.5 text-primary">
                            <span className="loading loading-spinner loading-xs"></span>
                            <span>Actualizando...</span>
                        </span>
                    )}
                    <span className="bg-base-200/60 px-3 py-1.5 rounded-lg border border-base-200">
                        Total: <strong className="text-base-content">{totalCount}</strong> {totalCount === 1 ? 'orden' : 'órdenes'}
                    </span>
                </div>
            </div>

            {/* Contenido de la Tabla */}
            <div className="overflow-x-auto min-h-75">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <span className="text-sm font-medium text-base-content/60">Cargando órdenes de servicio...</span>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center space-y-3">
                        <div className="alert alert-error max-w-md mx-auto rounded-xl shadow-sm text-sm py-3">
                            <span>Error al cargar la lista de órdenes</span>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="btn btn-outline btn-sm gap-2 rounded-xl"
                        >
                            <RefreshCw className="w-4 h-4" /> Reintentar
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="w-14 h-14 bg-base-200/70 rounded-full flex items-center justify-center text-base-content/40 mb-3">
                            <ClipboardList className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-semibold text-base-content">No se encontraron órdenes</h3>
                        <p className="text-xs text-base-content/60 max-w-xs mt-1">
                            {debouncedSearch
                                ? `No hay resultados para "${debouncedSearch}". Intenta con otros términos.`
                                : 'Aún no tienes órdenes de servicio registradas.'}
                        </p>
                    </div>
                ) : (
                    <table className="table table-zebra w-full text-sm">
                        <thead>
                            <tr className="border-b border-base-200 bg-base-200/40 text-base-content/70">
                                <th className="py-3.5 pl-5 font-semibold">Folio</th>
                                <th className="py-3.5 font-semibold">Estado</th>
                                <th className="py-3.5 font-semibold">Costo Est.</th>
                                <th className="py-3.5 font-semibold">Anticipo</th>
                                <th className="py-3.5 font-semibold">Fecha Promesa</th>
                                <th className="py-3.5 pr-5 font-semibold">Registro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-200">
                            {orders.map((order) => {
                                return (
                                    <tr
                                        key={order.id}
                                        onMouseDown={() => handlePressStart(order)}
                                        onMouseUp={handlePressEnd}
                                        onMouseLeave={handlePressEnd}
                                        onTouchStart={() => handlePressStart(order)}
                                        onTouchEnd={handlePressEnd}
                                        onTouchMove={handlePressEnd}
                                        className="hover:bg-base-200/50 transition-colors cursor-pointer select-none touch-manipulation"
                                        title="Mantén presionado para abrir los detalles de la orden"
                                    >
                                        {/* Folio */}
                                        <td className="py-3 pl-5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-base-content font-mono">
                                                    #{order.folio || '—'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* ESTADO */}
                                        <td className="py-3">
                                            <span className={`badge badge-sm font-semibold border ${getStatusBadge(order.status)}`}>
                                                {order.status || 'Recibido'}
                                            </span>
                                        </td>

                                        {/* COSTO ESTIMADO */}
                                        <td className="py-3 font-medium text-base-content gap-1 ">
                                            {formatCurrency(order.total_estimated_cost)}
                                        </td>

                                        {/* ANTICIPO */}
                                        <td className="py-3 font-medium text-base-content/80">
                                            {formatCurrency(order.advance_payment)}
                                        </td>

                                        {/* FECHA PROMESA/ENTREGA */}
                                        <td className="py-3 text-base-content/70">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                                <span>{formatDate(order.promised_date)}</span>
                                            </div>
                                        </td>

                                        {/* FECHA DE REGISTRO */}
                                        <td className="py-3 pr-5 text-base-content/70">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                                <span>{formatDate(order.created_at)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PAGINACION */}
            {!isLoading && !error && totalCount > 0 && (
                <div className="p-4 border-t border-base-200 bg-base-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Selector Registros por página & Info */}
                    <div className="flex items-center gap-3 text-xs text-base-content/70">
                        <span className="font-medium">Filas por página:</span>
                        <select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="select select-bordered select-xs rounded-lg focus:outline-none"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span>
                            Mostrando <strong className="text-base-content">{pageIndex * pageSize + 1}</strong> -{' '}
                            <strong className="text-base-content">{Math.min((pageIndex + 1) * pageSize, totalCount)}</strong> de{' '}
                            <strong className="text-base-content">{totalCount}</strong>
                        </span>
                    </div>

                    {/* Botones de Navegación de Páginas */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-base-content/70 font-medium mr-2">
                            Página <strong className="text-base-content">{pageIndex + 1}</strong> de{' '}
                            <strong className="text-base-content">{pageCount || 1}</strong>
                        </span>

                        <div className="join border border-base-200 rounded-xl overflow-hidden shadow-xs">
                            <button
                                onClick={handlePrevPage}
                                disabled={pageIndex === 0 || isLoading}
                                className="join-item btn btn-xs sm:btn-sm btn-ghost gap-1 disabled:bg-base-200/40"
                                title="Página anterior"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Anterior</span>
                            </button>
                            <button
                                onClick={handleNextPage}
                                disabled={pageIndex >= pageCount - 1 || isLoading}
                                className="join-item btn btn-xs sm:btn-sm btn-ghost gap-1 disabled:bg-base-200/40"
                                title="Página siguiente"
                            >
                                <span className="hidden sm:inline">Siguiente</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
