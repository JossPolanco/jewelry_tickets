import { Lock, Palette, Pencil, MapPin, Building2, Phone, FileText, AlertCircle, LogOut, Images } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getOrganizationById, updateOrganization } from '@/services/config';
import { logoutUser } from "../../services/auth/authService";
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import { z } from 'zod';
import { useUser } from '@/utils/context/UserContext';

const orgInfoSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    phone: z.string().min(1, "El teléfono es requerido"),
    address: z.string().min(1, "La dirección es requerida"),
});

const termsSchema = z.object({
    terms_and_conditions: z.string().min(1, "Los términos y condiciones son requeridos"),
});

export default function Configuration() {
    const orgModalRef = useRef(null);
    const termsModalRef = useRef(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { organization } = useUser();

    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('theme') || 'aurora';
    });

    const { data, isLoading } = useQuery({
        queryKey: ['organization', organization?.organization_id],
        queryFn: () => getOrganizationById(organization?.organization_id),
        enabled: !!organization?.organization_id,
    });

    // Form para Información de la Organización
    const {
        register: registerOrg,
        handleSubmit: handleSubmitOrg,
        reset: resetOrg,
        formState: { errors: orgErrors },
    } = useForm({
        resolver: zodResolver(orgInfoSchema),
        defaultValues: {
            name: "",
            phone: "",
            address: "",
        },
    });

    // Form para Términos y Condiciones
    const {
        register: registerTerms,
        handleSubmit: handleSubmitTerms,
        reset: resetTerms,
        formState: { errors: termsErrors },
    } = useForm({
        resolver: zodResolver(termsSchema),
        defaultValues: {
            terms_and_conditions: "",
        },
    });

    // Cargar los datos existentes en los formularios
    useEffect(() => {
        if (data) {
            resetOrg({
                name: data.name || "",
                phone: data.phone || "",
                address: data.address || "",
            });
            resetTerms({
                terms_and_conditions: data.terms_and_conditions || "",
            });
        }
    }, [data, resetOrg, resetTerms]);

    const changeTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        setCurrentTheme(theme);
    };

    const themes = ['aurora', 'dark'];

    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.clear();
            navigate('/');
        },
    });

    const updateOrgMutation = useMutation({
        mutationFn: (payload) => updateOrganization(organization?.organization_id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(['organization', organization?.organization_id]);
            orgModalRef.current?.close();
        },
    });

    const updateTermsMutation = useMutation({
        mutationFn: (payload) => updateOrganization(organization?.organization_id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(['organization', organization?.organization_id]);
            termsModalRef.current?.close();
        },
    });

    const handleOpenOrgModal = () => {
        if (data) {
            resetOrg({
                name: data.name || "",
                phone: data.phone || "",
                address: data.address || "",
            });
        }
        orgModalRef.current?.open();
    };

    const handleOpenTermsModal = () => {
        if (data) {
            resetTerms({
                terms_and_conditions: data.terms_and_conditions || "",
            });
        }
        termsModalRef.current?.open();
    };

    const onSubmitOrg = (values) => {
        updateOrgMutation.mutate(values);
    };

    const onSubmitTerms = (values) => {
        updateTermsMutation.mutate(values);
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 pb-20">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 text-center sm:text-left">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-base-content tracking-tight">
                        Configuración
                    </h1>
                    <p className="text-sm text-base-content/60">
                        Administra la información de tu negocio y preferencias del sistema.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-sm btn-ghost text-error hover:bg-error/10 rounded-xl font-medium text-xs px-4 h-10 gap-2 shrink-0 self-center sm:self-auto"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                >
                    {logoutMutation.isPending ? (
                        <span className="loading loading-spinner loading-xs" />
                    ) : (
                        <>
                            <LogOut size={16} />
                            <span>Cerrar sesión</span>
                        </>
                    )}
                </button>
            </div>

            {/* ORGANIZATION CARD */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm overflow-hidden">
                <div className="card-body p-5 sm:p-6 space-y-5">
                    {/* CARD HEADER */}
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-base-200/60">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
                                <Building2 size={22} />
                            </div>
                            <div>
                                <h2 className="font-bold text-base sm:text-lg text-base-content">
                                    Información de la Organización
                                </h2>
                                <p className="text-xs text-base-content/60">
                                    Datos visibles en ordenes de servicios.
                                </p>
                            </div>
                        </div>

                        <button
                            className="btn btn-sm btn-ghost gap-1.5 text-primary text-xs font-semibold px-3.5 h-9 rounded-xl bg-primary/5 active:bg-primary/10 transition-colors shrink-0"
                            type="button"
                            onClick={handleOpenOrgModal}
                            disabled={isLoading}
                        >
                            <Pencil size={14} />
                            <span>Editar</span>
                        </button>
                    </div>

                    {/* CARD CONTENT */}
                    {isLoading ? (
                        <div className="space-y-3 py-2">
                            <div className="skeleton h-5 w-48 rounded-lg" />
                            <div className="skeleton h-4 w-36 rounded-lg" />
                            <div className="skeleton h-4 w-64 rounded-lg" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                            {/* Nombre */}
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-base-200/30 border border-base-200/40">
                                <div className="p-2 rounded-xl bg-base-100 text-base-content/70 shrink-0 shadow-2xs">
                                    <Building2 size={16} />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50 block mb-0.5">
                                        Nombre
                                    </span>
                                    <p className="text-sm font-semibold text-base-content truncate">
                                        {data?.name || "Sin nombre registrado"}
                                    </p>
                                </div>
                            </div>

                            {/* TELÉFONO */}
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-base-200/30 border border-base-200/40">
                                <div className="p-2 rounded-xl bg-base-100 text-base-content/70 shrink-0 shadow-2xs">
                                    <Phone size={16} />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50 block mb-0.5">
                                        Teléfono
                                    </span>
                                    <p className="text-sm font-semibold text-base-content truncate">
                                        {data?.phone || "Sin teléfono registrado"}
                                    </p>
                                </div>
                            </div>

                            {/* DIRECCIÓN */}
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-base-200/30 border border-base-200/40">
                                <div className="p-2 rounded-xl bg-base-100 text-base-content/70 shrink-0 shadow-2xs">
                                    <MapPin size={16} />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/50 block mb-0.5">
                                        Dirección
                                    </span>
                                    <p className="text-sm font-semibold text-base-content truncate">
                                        {data?.address || "Sin dirección registrada"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* TERMS & CONDITIONS CARD */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm overflow-hidden">
                <div className="card-body p-5 sm:p-6 space-y-4">
                    {/* CARD HEADER */}
                    <div className="flex items-center justify-between gap-4 pb-3 border-b border-base-200/60">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary shrink-0">
                                <FileText size={22} />
                            </div>
                            <div>
                                <h2 className="font-bold text-base sm:text-lg text-base-content">
                                    Términos y Condiciones
                                </h2>
                                <p className="text-xs text-base-content/60">
                                    Políticas y garantías impresas en ordenes de servicio.
                                </p>
                            </div>
                        </div>

                        <button
                            className="btn btn-sm btn-ghost gap-1.5 text-primary text-xs font-semibold px-3.5 h-9 rounded-xl bg-primary/5 active:bg-primary/10 transition-colors shrink-0"
                            type="button"
                            onClick={handleOpenTermsModal}
                            disabled={isLoading}
                        >
                            <Pencil size={14} />
                            <span>Editar</span>
                        </button>
                    </div>

                    {/* CARD CONTENT */}
                    {isLoading ? (
                        <div className="space-y-2 py-2">
                            <div className="skeleton h-4 w-full rounded-lg" />
                            <div className="skeleton h-4 w-3/4 rounded-lg" />
                            <div className="skeleton h-4 w-1/2 rounded-lg" />
                        </div>
                    ) : (
                        <div className="bg-base-200/40 p-4 sm:p-5 rounded-2xl border border-base-200/60 max-h-60 overflow-y-auto">
                            {data?.terms_and_conditions ? (
                                <p className="text-sm text-base-content/90 whitespace-pre-wrap leading-relaxed">
                                    {data.terms_and_conditions}
                                </p>
                            ) : (
                                <div className="text-sm text-base-content/50 italic py-2 text-center sm:text-left">
                                    No se han registrado términos y condiciones aún. Haz clic en "Editar" para agregarlos.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* THEME CARD */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                <div className="card-body p-5 sm:p-6 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-success/10 text-success shrink-0">
                            <Images size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-base text-base-content">
                                Álbum de Fotos
                            </h2>
                            <p className="text-xs text-base-content/50 mt-0.5">
                                Fotos de los anillos en formato de album.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-full px-5 font-semibold text-xs active:scale-95 transition-transform shrink-0"
                        onClick={() => navigate('/album')}
                    >
                        Ir al album
                    </button>
                </div>
            </div>

            {/* PASSWORD CARD */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                <div className="card-body p-5 sm:p-6 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-warning/10 text-warning shrink-0">
                            <Lock size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-base text-base-content">
                                Contraseña
                            </h2>
                            <p className="text-xs text-base-content/50 mt-0.5">
                                Cambia tu contraseña para mantener tu cuenta segura.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-full px-5 font-semibold text-xs active:scale-95 transition-transform shrink-0"
                        onClick={() => navigate('/create-password')}
                    >
                        Cambiar
                    </button>
                </div>
            </div>

            {/* THEME CARD */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                <div className="card-body p-5 sm:p-6 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-info/10 text-info shrink-0">
                            <Palette size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-base text-base-content">
                                Tema de la aplicación
                            </h2>
                            <p className="text-xs text-base-content/50 mt-0.5">
                                Selecciona el tema visual que prefieras.
                            </p>
                        </div>
                    </div>

                    <div className="dropdown dropdown-end shrink-0">
                        <button type="button" tabIndex={0} className="btn btn-sm px-4 font-semibold text-xs capitalize flex items-center gap-1.5">
                            {currentTheme}
                            <svg
                                width="10px"
                                height="10px"
                                className="inline-block fill-current opacity-60"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 2048 2048">
                                <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
                            </svg>
                        </button>
                        <ul className="dropdown-content bg-base-300 rounded-box z-10 w-40 p-2 shadow-2xl mt-1">
                            {themes.map((theme) => (
                                <li key={theme}>
                                    <button type="button"
                                        className="btn btn-sm btn-ghost justify-start w-full capitalize"
                                        onClick={() => changeTheme(theme)}
                                    >
                                        {theme}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>            

            {/* INFORMACION DE ORGANIZACION */}
            <Modal
                ref={orgModalRef}
                modalTitle="Editar Información de la Organización"
                modalSubtitle="Modifica los datos principales de tu negocio"
            >
                <form onSubmit={handleSubmitOrg(onSubmitOrg)} className="space-y-4 py-2">
                    {updateOrgMutation.isError && (
                        <div className="alert alert-error text-sm py-3 rounded-2xl flex items-start gap-2">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold block">Error al actualizar</span>
                                <span className="text-xs opacity-90">
                                    {updateOrgMutation.error?.message || "Ocurrió un problema al guardar los cambios."}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* NOMBRE */}
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-sm font-semibold text-base-content/90">
                                Nombre de la Organización <span className="text-error">*</span>
                            </span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                                <Building2 size={18} />
                            </div>
                            <input
                                type="text"
                                className={`input input-bordered w-full pl-10 h-12 rounded-xl text-base border-base-200 bg-base-100 focus:border-primary ${orgErrors.name ? 'input-error' : ''}`}
                                placeholder="Ej. Joyería San José"
                                {...registerOrg("name")}
                            />
                        </div>
                        {orgErrors.name && (
                            <span className="text-error text-xs mt-1 font-medium">{orgErrors.name.message}</span>
                        )}
                    </div>

                    {/* TELEFONO */}
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-sm font-semibold text-base-content/90">
                                Teléfono de Contacto <span className="text-error">*</span>
                            </span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                                <Phone size={18} />
                            </div>
                            <input
                                type="text"
                                className={`input input-bordered w-full pl-10 h-12 rounded-xl text-base border-base-200 bg-base-100 focus:border-primary ${orgErrors.phone ? 'input-error' : ''}`}
                                placeholder="Ej. +52 55 1234 5678"
                                {...registerOrg("phone")}
                            />
                        </div>
                        {orgErrors.phone && (
                            <span className="text-error text-xs mt-1 font-medium">{orgErrors.phone.message}</span>
                        )}
                    </div>

                    {/* DIRECCIÓN */}
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-sm font-semibold text-base-content/90">
                                Dirección Física <span className="text-error">*</span>
                            </span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
                                <MapPin size={18} />
                            </div>
                            <input
                                type="text"
                                className={`input input-bordered w-full pl-10 h-12 rounded-xl text-base border-base-200 bg-base-100 focus:border-primary ${orgErrors.address ? 'input-error' : ''}`}
                                placeholder="Ej. Av. Hidalgo #123, Col. Centro"
                                {...registerOrg("address")}
                            />
                        </div>
                        {orgErrors.address && (
                            <span className="text-error text-xs mt-1 font-medium">{orgErrors.address.message}</span>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-200/60 mt-6">
                        <button
                            type="button"
                            className="btn btn-ghost h-11 rounded-xl px-5 text-sm font-semibold"
                            onClick={() => orgModalRef.current?.close()}
                            disabled={updateOrgMutation.isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary h-11 rounded-xl px-6 text-sm font-semibold"
                            disabled={updateOrgMutation.isPending}
                        >
                            {updateOrgMutation.isPending ? (
                                <>
                                    <span className="loading loading-spinner loading-xs" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                "Guardar cambios"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* TERMINOS Y CONDICIONES */}
            <Modal
                ref={termsModalRef}
                modalTitle="Editar Términos y Condiciones"
                modalSubtitle="Configura las cláusulas y garantías de tus servicios"
            >
                <form onSubmit={handleSubmitTerms(onSubmitTerms)} className="space-y-4 py-2">
                    {updateTermsMutation.isError && (
                        <div className="alert alert-error text-sm py-3 rounded-2xl flex items-start gap-2">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold block">Error al actualizar</span>
                                <span className="text-xs opacity-90">
                                    {updateTermsMutation.error?.message || "Ocurrió un problema al guardar los cambios."}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text text-sm font-semibold text-base-content/90">
                                Texto de Términos y Condiciones <span className="text-error">*</span>
                            </span>
                        </label>
                        <textarea
                            className={`textarea textarea-primary textarea-bordered w-full h-52 rounded-xl text-sm leading-relaxed border-base-200 bg-base-100 focus:border-primary p-3.5 ${termsErrors.terms_and_conditions ? 'textarea-error' : ''}`}
                            placeholder="Escribe aquí las políticas, garantías, plazos de reclamo y condiciones de entrega para tus clientes..."
                            {...registerTerms("terms_and_conditions")}
                        />
                        {termsErrors.terms_and_conditions && (
                            <span className="text-error text-xs mt-1 font-medium">{termsErrors.terms_and_conditions.message}</span>
                        )}
                        <p className="text-xs text-base-content/50 mt-1.5">
                            Este texto se utilizará en los boletos impresos y digitales enviados a los clientes.
                        </p>
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-200/60 mt-6">
                        <button
                            type="button"
                            className="btn btn-ghost h-11 rounded-xl px-5 text-sm font-semibold"
                            onClick={() => termsModalRef.current?.close()}
                            disabled={updateTermsMutation.isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary h-11 rounded-xl px-6 text-sm font-semibold"
                            disabled={updateTermsMutation.isPending}
                        >
                            {updateTermsMutation.isPending ? (
                                <>
                                    <span className="loading loading-spinner loading-xs" />
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                "Guardar cambios"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
