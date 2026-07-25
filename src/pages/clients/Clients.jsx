import React, { useState, useRef } from 'react'
import { ClientsTable, Modal, FabAdd } from '@/components'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllClients, createClient, editClient } from '@/services/clients'

const clienteSchema = z.object({
    organization_id: z.string().min(1, "Organization ID is required"),
    names: z.string().min(1, "Nombres is required"),
    lastnames: z.string().min(1, "Apellidos is required"),
    phone: z.string().min(1, "Telefono is required"),
    email: z.string().email("Email is invalid").optional(),
})

export default function Clients() {

    const queryClient = useQueryClient()

    const addClientModalRef = useRef(null)
    const openAddClientModal = () => {
        addClientModalRef.current.open()
    }
    const closeAddClientModal = () => {
        addClientModalRef.current.close()
    }

//     const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
// const { data, isLoading } = useQuery({
//   queryKey: ['clients', pageIndex, pageSize],
//   queryFn: () => getUsers({ pageIndex, pageSize, organization_id: currentOrgId }),
//   keepPreviousData: true,
// });

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in pb-20">
            <ClientsTable />

            <FabAdd onClick={openAddClientModal} />

            <Modal ref={addClientModalRef} modalTitle="Nuevo Cliente" modalSubtitle="Agregar un nuevo cliente">
                <form>

                </form>
            </Modal>
        </div>
    )
}
