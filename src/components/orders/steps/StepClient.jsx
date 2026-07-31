import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, X, Loader2, Search, CheckCircle2, ChevronRight, UserCheck } from 'lucide-react';
import { searchClient, getClientById } from '@/services/clients/clientService';
import { useUser } from '@/utils/context/UserContext';
import { useQuery } from '@tanstack/react-query';
import { useFormContext } from 'react-hook-form';

export default function StepClient() {
    const { organization } = useUser();
    const formContext = useFormContext();
    const register = formContext?.register;
    const setValue = formContext?.setValue;
    const watch = formContext?.watch;
    const errors = formContext?.formState?.errors;

    const currentCustomerId = watch ? watch('customer_id') : '';

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // RECUPERA EL CLIENTE SI EXISTE UN CUSTOMER_ID (POR EJEMPLO DESDE UN BORRADOR)
    useEffect(() => {
        if (currentCustomerId && !selectedClient) {
            getClientById(currentCustomerId).then((client) => {
                if (client) {
                    const clientName = client.full_name || `${client.names || ''} ${client.lastnames || ''}`.trim();
                    setSelectedClient(client);
                    setSearchTerm(clientName);
                }
            }).catch((err) => console.warn("No se pudo cargar el cliente del borrador:", err));
        }
    }, [currentCustomerId, selectedClient]);

    // CIERRA EL DROPDOWN CUANDO SE HACE CLICK FUERA DEL COMPONENTE

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // CONSULTA DE BÚSQUEDA CON REACT-QUERY
    const { data: clients = [], isLoading } = useQuery({
        queryKey: ['searchClients', organization?.organization_id, searchTerm],
        queryFn: () => searchClient({
            organization_id: organization?.organization_id,
            search: searchTerm
        }),
        enabled: !!organization?.organization_id && searchTerm.trim().length > 0 && !selectedClient,
    });

    // SELECCIONA EL CLIENTE Y ACTUALIZA EL STATE
    const handleSelectClient = (client) => {
        const clientName = client.full_name || `${client.names || ''} ${client.lastnames || ''}`.trim();
        setSelectedClient(client);
        setSearchTerm(clientName);
        setIsOpen(false);
        if (setValue) {
            setValue('customer_id', client.id, { shouldValidate: true });
        }
    };

    // LIMPIA LOS CAMPOS
    const handleClear = () => {
        setSelectedClient(null);
        setSearchTerm('');
        if (setValue) {
            setValue('customer_id', '', { shouldValidate: true });
        }
        setIsOpen(false);
    };

    // ACTUALIZA EL STATE CON LOS CAMBIOS EN EL INPUT
    const handleInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (selectedClient) {
            setSelectedClient(null);
            if (setValue) {
                setValue('customer_id', '', { shouldValidate: true });
            }
        }
        setIsOpen(true);
    };

    return (
        <div className="space-y-3 sm:space-y-4 py-1 animate-fade-in">
            {/* INPUT OCULTO PARA EL ID DEL CLIENTE/USUARIO */}
            <input
                type="hidden"
                value={selectedClient?.id || currentCustomerId || ''}
                {...(register ? register('customer_id') : {})}
            />

            {/* ENCABEZADO DEL PASO 1 */}
            <div className="border-b border-base-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="badge badge-primary badge-sm font-bold tracking-wide text-[10px]">PASO 1</span>
                        <h3 className="text-sm sm:text-base font-bold text-base-content flex items-center gap-1.5">
                            <User className="w-4 h-4 text-primary" />
                            Selección de Cliente
                        </h3>
                    </div>
                    <p className="text-[11px] sm:text-xs text-base-content/70">
                        Busca por nombre, teléfono o correo para cargar sus datos en la orden.
                    </p>
                </div>

                {selectedClient && (
                    <div className="self-start sm:self-center flex items-center gap-1 px-2.5 py-1 bg-success/15 border border-success/30 rounded-full text-[11px] font-semibold text-success animate-fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        <span>Cliente seleccionado</span>
                    </div>
                )}
            </div>

            {/* CARD BANNER SI YA HAY UN CLIENTE SELECCIONADO */}
            {selectedClient && (
                <div className="bg-base-100 border-2 border-primary/40 rounded-xl p-3 shadow-xs flex items-center justify-between gap-2 animate-fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                            {selectedClient.full_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Cliente Registrado</span>
                                <UserCheck className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-base-content truncate">
                                {selectedClient.full_name}
                            </h4>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10 gap-1 shrink-0 font-semibold"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cambiar cliente</span>
                        <span className="sm:hidden">Cambiar</span>
                    </button>
                </div>
            )}

            {/* FORMULARIO DE BÚSQUEDA Y DATOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SEARCH INPUT CON DROPDOWN */}
                <div className="form-control w-full" ref={containerRef}>
                    <label className="label py-1">
                        <span className="label-text text-xs sm:text-sm font-semibold text-base-content">
                            Buscar Cliente <span className="text-error">*</span>
                        </span>
                    </label>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Escribe un nombre, teléfono o correo..."
                            className={`input input-bordered w-full h-10 sm:h-11 pl-9 pr-9 text-xs sm:text-sm font-medium rounded-xl border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${selectedClient ? 'border-primary/50 bg-primary/5 font-semibold text-primary' : ''
                                }`}
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={() => setIsOpen(true)}
                        />
                        <Search className={`w-4 h-4 absolute left-3 top-3 sm:top-3.5 transition-colors ${selectedClient ? 'text-primary' : 'text-base-content/40'
                            }`} />

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleClear}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-3 top-3 sm:top-3.5 text-base-content/40 hover:text-base-content active:scale-95 transition-all p-0.5 rounded-full hover:bg-base-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {errors?.customer_id && (
                        <span className="text-xs text-error mt-0.5 font-medium">
                            {errors.customer_id.message}
                        </span>
                    )}

                    {/* RESULTADOS DE LA BUSQUEDA - INLINE CON ALTURA FIJA */}
                    {isOpen && searchTerm.trim().length > 0 && !selectedClient && (
                        <div className="mt-1.5 bg-base-100 border border-base-300 rounded-xl shadow-md overflow-hidden">
                            <div className="px-3 py-1.5 bg-base-200/80 text-[10px] font-bold text-base-content/60 uppercase tracking-wider border-b border-base-200">
                                Clientes encontrados
                            </div>
                            <div className="max-h-44 overflow-y-auto">

                            {isLoading ? (
                                <div className="p-4 text-center text-xs text-base-content/70 flex flex-col items-center justify-center gap-1.5">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    <span>Buscando en la base de datos...</span>
                                </div>
                            ) : clients.length > 0 ? (
                                <div className="divide-y divide-base-200">
                                    {clients.map((client) => {
                                        const name = client.full_name || `${client.names || ''} ${client.lastnames || ''}`.trim();
                                        return (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => handleSelectClient(client)}
                                                className="w-full p-2.5 sm:p-3 text-left hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-center justify-between gap-2 group"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                        {name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-xs sm:text-sm text-base-content truncate group-hover:text-primary transition-colors">
                                                            {name}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-base-content/60">
                                                            {client.phone && (
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3 text-primary/70" />
                                                                    {client.phone}
                                                                </span>
                                                            )}
                                                            {client.email && (
                                                                <span className="flex items-center gap-1 truncate">
                                                                    <Mail className="w-3 h-3 text-primary/70" />
                                                                    {client.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <ChevronRight className="w-4 h-4 text-base-content/30 group-hover:text-primary transition-colors shrink-0" />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-xs text-base-content/60 flex flex-col items-center justify-center gap-1">
                                    <User className="w-6 h-6 text-base-content/30 mb-0.5" />
                                    <span className="font-semibold text-base-content">No se encontraron clientes</span>
                                    <span className="text-[11px] text-base-content/50">Intenta buscar con otro nombre o teléfono</span>
                                </div>
                            )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Telefono Input (Read Only) */}
                <div className="form-control w-full">
                    <label className="label py-1 flex justify-between items-center">
                        <span className="label-text text-xs sm:text-sm font-semibold text-base-content">
                            Teléfono / Contacto
                        </span>
                        <span className="label-text-alt text-[11px] text-base-content/50 font-medium">Solo lectura</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Selecciona un cliente para cargar..."
                            className="input input-bordered w-full h-10 sm:h-11 pl-9 text-xs sm:text-sm font-medium rounded-xl bg-base-200/60 border-base-300/80 cursor-not-allowed text-base-content"
                            value={selectedClient?.phone || ''}
                            readOnly
                        />
                        <Phone className="w-4 h-4 absolute left-3 top-3 sm:top-3.5 text-base-content/40" />
                    </div>
                </div>
            </div>

            {/* Email Input (Read Only) */}
            <div className="form-control w-full">
                <label className="label py-1 flex justify-between items-center">
                    <span className="label-text text-xs sm:text-sm font-semibold text-base-content">
                        Correo Electrónico
                    </span>
                    <span className="label-text-alt text-[11px] text-base-content/50 font-medium">Solo lectura</span>
                </label>
                <div className="relative">
                    <input
                        type="email"
                        placeholder="Selecciona un cliente para cargar..."
                        className="input input-bordered w-full h-10 sm:h-11 pl-9 text-xs sm:text-sm font-medium rounded-xl bg-base-200/60 border-base-300/80 cursor-not-allowed text-base-content"
                        value={selectedClient?.email || ''}
                        readOnly
                    />
                    <Mail className="w-4 h-4 absolute left-3 top-3 sm:top-3.5 text-base-content/40" />
                </div>
            </div>
        </div>
    );
}