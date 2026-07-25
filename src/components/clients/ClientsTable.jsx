import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getClients } from '@/services/clients';
import { useUser } from '@/utils/context/UserContext';
import { Modal } from '@/components';
import {
    Search,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Pencil,
    Trash2,
    Phone,
    Mail,
    Calendar,
    X,
    Users,
    RefreshCw,
    User,
    Info,
    ExternalLink,
    BadgeCheck
} from 'lucide-react';

export default function ClientsTable() {
    const { organization } = useUser();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    // Estado y refs para el modal de lectura al mantener click/touch en una fila
    const [selectedClient, setSelectedClient] = useState(null);
    const detailModalRef = useRef(null);
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

    // Manejadores de mantener presionado (Long Press) en la fila
    const handlePressStart = (client) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setSelectedClient(client);
            detailModalRef.current?.open();
            timerRef.current = null;
        }, 450);
    };

    const handlePressEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    // Obtención de clientes mediante el servicio getClients
    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['clients', organization?.organization_id, pageIndex, pageSize, debouncedSearch],
        queryFn: () =>
            getClients({
                pageIndex,
                pageSize,
                organization_id: organization?.organization_id,
                search: debouncedSearch,
            }),
        enabled: !!organization?.organization_id,
        keepPreviousData: true,
    });

    const clients = data?.data || [];
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

    const getInitials = (names, lastnames) => {
        const first = names ? names.trim().charAt(0) : '';
        const last = lastnames ? lastnames.trim().charAt(0) : '';
        return (first + last).toUpperCase() || 'C';
    };

    return (
        <div className="w-full bg-base-100 border border-base-200 rounded-2xl shadow-sm overflow-hidden transition-all">
            {/* Header de la Tabla con Buscador */}
            <div className="p-4 sm:p-5 border-b border-base-200 bg-base-100/50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o correo..."
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
                        Total: <strong className="text-base-content">{totalCount}</strong> {totalCount === 1 ? 'cliente' : 'clientes'}
                    </span>
                </div>
            </div>

            {/* Contenido de la Tabla */}
            <div className="overflow-x-auto min-h-75">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                        <span className="text-sm font-medium text-base-content/60">Cargando clientes...</span>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center space-y-3">
                        <div className="alert alert-error max-w-md mx-auto rounded-xl shadow-sm text-sm py-3">
                            <span>Error al cargar la lista de clientes</span>
                        </div>
                        <button
                            onClick={() => refetch()}
                            className="btn btn-outline btn-sm gap-2 rounded-xl"
                        >
                            <RefreshCw className="w-4 h-4" /> Reintentar
                        </button>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="w-14 h-14 bg-base-200/70 rounded-full flex items-center justify-center text-base-content/40 mb-3">
                            <Users className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-semibold text-base-content">No se encontraron clientes</h3>
                        <p className="text-xs text-base-content/60 max-w-xs mt-1">
                            {debouncedSearch
                                ? `No hay resultados para "${debouncedSearch}". Intenta con otros términos.`
                                : 'Aún no tienes clientes registrados.'}
                        </p>
                    </div>
                ) : (
                    <table className="table table-zebra w-full text-sm">
                        <thead>
                            <tr className="border-b border-base-200 bg-base-200/40 text-base-content/70">
                                <th className="py-3.5 pl-5 font-semibold">Cliente</th>
                                <th className="py-3.5 font-semibold">Contacto</th>
                                <th className="py-3.5 font-semibold">Correo</th>
                                <th className="py-3.5 font-semibold">Registro</th>
                                <th className="py-3.5 pr-5 text-right font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-200">
                            {clients.map((client) => {
                                const fullName = client.full_name || `${client.names || ''} ${client.lastnames || ''}`.trim() || 'Sin Nombre';
                                return (
                                    <tr
                                        key={client.id}
                                        onMouseDown={() => handlePressStart(client)}
                                        onMouseUp={handlePressEnd}
                                        onMouseLeave={handlePressEnd}
                                        onTouchStart={() => handlePressStart(client)}
                                        onTouchEnd={handlePressEnd}
                                        onTouchMove={handlePressEnd}
                                        className="hover:bg-base-200/50 transition-colors cursor-pointer select-none touch-manipulation"
                                        title="Mantén presionado para ver los detalles del cliente"
                                    >
                                        {/* Cliente / Nombre */}
                                        <td className="py-3 pl-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                                                    {getInitials(client.names, client.lastnames)}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-base-content block leading-tight">
                                                        {fullName}
                                                    </span>
                                                    <span className="text-[11px] text-base-content/50 block mt-0.5">
                                                        ID: {client.id ? client.id.substring(0, 8) : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contacto / Teléfono */}
                                        <td className="py-3">
                                            <div className="flex items-center gap-1.5 text-base-content/80 font-medium">
                                                <Phone className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                                <span>{client.phone || '—'}</span>
                                            </div>
                                        </td>

                                        {/* Correo */}
                                        <td className="py-3">
                                            <div className="flex items-center gap-1.5 text-base-content/80">
                                                <Mail className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                                <span className="truncate max-w-45">{client.email || '—'}</span>
                                            </div>
                                        </td>

                                        {/* Fecha Registro */}
                                        <td className="py-3 text-base-content/70">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                                <span>{formatDate(client.created_at)}</span>
                                            </div>
                                        </td>

                                        {/* Acciones / Panel 3 Puntos */}
                                        <td
                                            className="py-3 pr-5 text-right"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onTouchStart={(e) => e.stopPropagation()}
                                        >
                                            <div className="dropdown dropdown-left dropdown-end">
                                                <div
                                                    tabIndex={0}
                                                    role="button"
                                                    className="btn btn-ghost btn-xs sm:btn-sm btn-square rounded-lg hover:bg-base-200"
                                                    title="Opciones"
                                                >
                                                    <MoreVertical className="w-4.5 h-4.5 text-base-content/70" />
                                                </div>
                                                <ul
                                                    tabIndex={0}
                                                    className="dropdown-content menu p-1.5 shadow-xl bg-base-100 rounded-xl w-36 border border-base-200 z-30 space-y-1"
                                                >
                                                    <li>
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-2 text-xs font-semibold py-2 text-base-content hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                                            onClick={(e) => {
                                                                e.currentTarget.blur();
                                                                // TODO: Implementar funcionalidad de Editar cliente
                                                            }}
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-primary" />
                                                            <span>Editar</span>
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-2 text-xs font-semibold py-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                                                            onClick={(e) => {
                                                                e.currentTarget.blur();
                                                                // TODO: Implementar funcionalidad de Eliminar cliente
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-error" />
                                                            <span>Eliminar</span>
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Paginación */}
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

            {/* MODAL PARA VER INFO DEL CLIENTE */}
            <Modal
                ref={detailModalRef}
                modalTitle="Información del Cliente"
                modalSubtitle="Consulta detallada de datos registrados"
                className="max-w-xl"
            >
                {selectedClient && (
                    <div className="space-y-5 pt-2">
                        {/* CABECERA CON AVATAR E IDENTIFICADOR DEL CLIENTE */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-base-200/50 border border-base-200">
                            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content font-bold text-xl flex items-center justify-center shadow-sm shrink-0">
                                {getInitials(selectedClient.names, selectedClient.lastnames)}
                            </div>
                            <div className="space-y-1 overflow-hidden">
                                <h3 className="text-lg font-bold text-base-content leading-tight truncate">
                                    {selectedClient.full_name || `${selectedClient.names || ''} ${selectedClient.lastnames || ''}`}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="badge badge-success badge-sm font-semibold gap-1">
                                        <BadgeCheck className="w-3 h-3" /> Activo
                                    </span>
                                    <span className="text-[11px] text-base-content/50 font-mono truncate">
                                        ID: {selectedClient.id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* GRID CON INFORMACIÓN DEL CLIENTE */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-base-100 border border-base-200 space-y-1">
                                <span className="text-xs text-base-content/60 font-medium flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-primary" /> Nombres
                                </span>
                                <p className="text-sm font-semibold text-base-content">{selectedClient.names || '—'}</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-base-100 border border-base-200 space-y-1">
                                <span className="text-xs text-base-content/60 font-medium flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-primary" /> Apellidos
                                </span>
                                <p className="text-sm font-semibold text-base-content">{selectedClient.lastnames || '—'}</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-base-100 border border-base-200 space-y-1">
                                <span className="text-xs text-base-content/60 font-medium flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-primary" /> Teléfono / WhatsApp
                                </span>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-base-content">{selectedClient.phone || '—'}</p>
                                    {selectedClient.phone && (
                                        <a
                                            href={`https://wa.me/${selectedClient.phone.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-ghost btn-xs text-primary gap-1 p-1 hover:bg-primary/10"
                                            title="Abrir WhatsApp"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl bg-base-100 border border-base-200 space-y-1">
                                <span className="text-xs text-base-content/60 font-medium flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-primary" /> Correo Electrónico
                                </span>
                                <p className="text-sm font-semibold text-base-content truncate">{selectedClient.email || '—'}</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-base-100 border border-base-200 space-y-1 sm:col-span-2">
                                <span className="text-xs text-base-content/60 font-medium flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha de Registro
                                </span>
                                <p className="text-sm font-semibold text-base-content">
                                    {selectedClient.created_at
                                        ? new Date(selectedClient.created_at).toLocaleString('es-ES', {
                                            dateStyle: 'full',
                                            timeStyle: 'short',
                                        })
                                        : '—'}
                                </p>
                            </div>
                        </div>

                        {/* PIE DEL MODAL */}
                        <div className="flex justify-end pt-3 border-t border-base-200">
                            <button
                                type="button"
                                onClick={() => detailModalRef.current?.close()}
                                className="btn btn-primary h-11 px-6 rounded-xl text-sm font-semibold shadow-sm active:scale-95"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
