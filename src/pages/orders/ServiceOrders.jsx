import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/utils/context/UserContext';
import React, { useRef } from 'react';
import { Modal, FabAdd, CreateOrderWizard } from '@/components';
import { useForm } from 'react-hook-form';
import z from 'zod';


export default function ServiceOrders() {
    const { organization } = useUser();
    const queryClient = useQueryClient();

    const orderModalRef = useRef(null);

    const openOrderModal = () => {
        orderModalRef.current?.open();
    };

    const closeOrderModal = () => {
        orderModalRef.current?.close();
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in pb-20">

            <FabAdd onClick={openOrderModal} />

            <Modal ref={orderModalRef} modalTitle="Nueva Orden" modalSubtitle="Registra los datos de una nueva orden para gestionar sus pedidos">
                <CreateOrderWizard />
            </Modal>
        </div>
    );
}
