import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@/utils/context/UserContext';
import React, { useRef, useState } from 'react';
import { Modal, FabAdd, CreateOrderWizard, Toast } from '@/components';
import { useForm } from 'react-hook-form';
import z from 'zod';

export default function ServiceOrders() {
    const { organization } = useUser();
    const queryClient = useQueryClient();
    const [toastState, setToastState] = useState(null);

    const showToast = (message, type = 'success') => {
        setToastState({ message, type });
        setTimeout(() => {
            setToastState(null);
        }, 4000);
    };

    const orderModalRef = useRef(null);

    const openOrderModal = () => {
        orderModalRef.current?.open();
    };

    const closeOrderModal = () => {
        orderModalRef.current?.close();
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in pb-20">
            {toastState && (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                />
            )}

            <FabAdd onClick={openOrderModal} />

            <Modal ref={orderModalRef} modalTitle="Nueva Orden" modalSubtitle="Registra los datos de una nueva orden para gestionar sus pedidos">
                <CreateOrderWizard onClose={closeOrderModal} showToast={showToast} />
            </Modal>
        </div>
    );
}
