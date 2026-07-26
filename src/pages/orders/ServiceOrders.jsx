import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/utils/context/UserContext';
import React, { useRef, useEffect } from 'react';
import { Modal, FabAdd, SignatureInput } from '@/components';
import { useForm } from 'react-hook-form';
import z from 'zod';

const orderSchema = z.object({
    organization_id: z.string().min(1, "ID de organización requerido"),
    customer_id: z.string().min(1, "ID de cliente requerido"),
    folio: z.string().min(1, "Folio requerido"),
    status: z.string().min(1, "Estado requerido"),
    total_estimated_cost: z.number().min(1, "Costo estimado requerido"),
    advance_payment: z.number().min(1, "Pago adelantado requerido"),
    signature_data: z.any().nullable().optional(),
    notes_general: z.string().min(1, "Notas generales requeridas"),
    promised_date: z.string().min(1, "Fecha prometida requerida"),
})

export default function ServiceOrders() {
    const { organization } = useUser()
    const queryClient = useQueryClient()

    const orderModalRef = useRef(null)

    const openOrderModal = () => {
        addClientModalRef.current?.open()
    }
    const closeAddClientModal = () => {
        addClientModalRef.current?.close()
    }
    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in pb-20">

            <SignatureInput/>

            <FabAdd onClick={openOrderModal} />

            <Modal ref={orderModalRef} modalTitle="Nueva Orden" modalSubtitle="Registra los datos de una nueva orden para gestionar sus pedidos">
                Hola
            </Modal>
        </div>
    )
}
