import { User, Users, Phone, Mail, UserPlus, AlertCircle, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientsTable, Modal, FabAdd } from '@/components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/utils/context/UserContext';
import { createClient } from '@/services/clients';
import React, { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';

const clienteSchema = z.object({
    organization_id: z.string().min(1, "ID de organización requerido"),
    names: z.string().min(1, "El nombre es obligatorio"),
    lastnames: z.string().min(1, "El apellido es obligatorio"),
    phone: z.string().min(1, "El teléfono es obligatorio"),
    email: z.string().email("Ingresa un correo electrónico válido").or(z.literal("")).optional(),
})

export default function Clients() {

    const queryClient = useQueryClient()
    const { organization } = useUser()

    const addClientModalRef = useRef(null)
    const openAddClientModal = () => {
        addClientModalRef.current?.open()
    }
    const closeAddClientModal = () => {
        addClientModalRef.current?.close()
    }

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
        resolver: zodResolver(clienteSchema),
        defaultValues: {
            organization_id: organization?.organization_id || "",
            names: "",
            lastnames: "",
            phone: "",
            email: "",
        }
    })

    useEffect(() => {
        if (organization?.organization_id) {
            setValue("organization_id", organization.organization_id)
        }
    }, [organization, setValue])

    const handleSubmitClient = (data) => {
        const payload = {
            ...data,
            organization_id: data.organization_id || organization?.organization_id || ""
        }
        addClientMutation.mutate(payload)
    }

    const addClientMutation = useMutation({
        mutationFn: createClient,
        onSuccess: () => {
            queryClient.invalidateQueries(['clients'])
            reset({
                organization_id: organization?.organization_id || "",
                names: "",
                lastnames: "",
                phone: "",
                email: "",
            })
            closeAddClientModal()
        },
        onError: (error) => {
            console.error('Error agregando cliente:', error)
        },
    })

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in pb-20">
            <ClientsTable />

            <FabAdd onClick={openAddClientModal} />

            <Modal ref={addClientModalRef} modalTitle="Nuevo Cliente" modalSubtitle="Registra los datos de un nuevo cliente para gestionar sus pedidos">
                <form onSubmit={handleSubmit(handleSubmitClient)} className="space-y-5 pt-2">
                    {addClientMutation.isError && (
                        <div className="alert alert-error text-sm py-3 rounded-2xl flex items-start gap-2">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold block">Error al guardar cliente</span>
                                <span className="text-xs opacity-90">Ocurrió un inconveniente. Inténtalo de nuevo.</span>
                            </div>
                        </div>
                    )}

                    {/* Fila Nombres y Apellidos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombres */}
                        <div className="form-control">
                            <label htmlFor="names" className="label py-1.5">
                                <span className="label-text text-base font-semibold text-base-content/90">
                                    Nombres <span className="text-error">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="names"
                                    placeholder="Ej. María Elena"
                                    {...register("names")}
                                    className={`input input-bordered w-full pl-11 h-12 text-base rounded-xl border-base-200 focus:border-primary focus:outline-none transition-all ${errors.names ? 'input-error border-error' : ''}`}
                                />
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                            </div>
                            {errors.names && (
                                <span className="text-error text-xs font-medium mt-1 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {errors.names.message}
                                </span>
                            )}
                        </div>

                        {/* Apellidos */}
                        <div className="form-control">
                            <label htmlFor="lastnames" className="label py-1.5">
                                <span className="label-text text-base font-semibold text-base-content/90">
                                    Apellidos <span className="text-error">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="lastnames"
                                    placeholder="Ej. Rodríguez López"
                                    {...register("lastnames")}
                                    className={`input input-bordered w-full pl-11 h-12 text-base rounded-xl border-base-200 focus:border-primary focus:outline-none transition-all ${errors.lastnames ? 'input-error border-error' : ''}`}
                                />
                                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                            </div>
                            {errors.lastnames && (
                                <span className="text-error text-xs font-medium mt-1 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {errors.lastnames.message}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Teléfono */}
                    <div className="form-control">
                        <label htmlFor="phone" className="label py-1.5">
                            <span className="label-text text-base font-semibold text-base-content/90">
                                Teléfono / WhatsApp <span className="text-error">*</span>
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                id="phone"
                                placeholder="Ej. 8888-8888"
                                {...register("phone")}
                                className={`input input-bordered w-full pl-11 h-12 text-base rounded-xl border-base-200 focus:border-primary focus:outline-none transition-all ${errors.phone ? 'input-error border-error' : ''}`}
                            />
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                        </div>
                        {errors.phone && (
                            <span className="text-error text-xs font-medium mt-1 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.phone.message}
                            </span>
                        )}
                    </div>

                    {/* Correo Electrónico (Opcional) */}
                    <div className="form-control">
                        <label htmlFor="email" className="label py-1.5">
                            <span className="label-text text-base font-semibold text-base-content/90">
                                Correo Electrónico <span className="text-xs font-normal text-base-content/60">(Opcional)</span>
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                placeholder="Ej. maria@ejemplo.com"
                                {...register("email")}
                                className={`input input-bordered w-full pl-11 h-12 text-base rounded-xl border-base-200 focus:border-primary focus:outline-none transition-all ${errors.email ? 'input-error border-error' : ''}`}
                            />
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
                        </div>
                        {errors.email && (
                            <span className="text-error text-xs font-medium mt-1 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.email.message}
                            </span>
                        )}
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-3 pt-4 border-t border-base-200">
                        <button
                            type="button"
                            onClick={closeAddClientModal}
                            className="btn btn-ghost h-12 rounded-xl text-base w-full sm:w-auto"
                            disabled={addClientMutation.isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary h-12 rounded-xl text-base font-semibold w-full sm:w-auto px-8 active:scale-95 shadow-md flex items-center justify-center gap-2"
                            disabled={addClientMutation.isPending}
                        >
                            {addClientMutation.isPending ? (
                                <>
                                    <span className="loading loading-spinner loading-md"></span>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus size={20} />
                                    <span>Guardar Cliente</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

