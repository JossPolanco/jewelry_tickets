import { HomeHeaderBanner, HomeKpiCards, HomePriorityWidget, Modal, CreateOrderWizard, Toast } from '@/components';
import { getHomeDashboardSummary } from '@/services/orders';
import { useUser } from '@/utils/context/UserContext';
import { useQuery } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';

export default function Home() {
    const { user, organization } = useUser();
    const [toastState, setToastState] = useState(null);
    const orderModalRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToastState({ message, type });
        setTimeout(() => {
            setToastState(null);
        }, 4000);
    };

    const openOrderModal = () => {
        orderModalRef.current?.open();
    };

    const closeOrderModal = () => {
        orderModalRef.current?.close();
    };
    
    // OBTENER RESUMEN DEL DASHBOARD (KPIs + ENTREGAS PROMETIDAS)
    const { data: dashboardData, isLoading, error } = useQuery({
        queryKey: ['homeDashboard', organization?.organization_id],
        queryFn: () => getHomeDashboardSummary({ organization_id: organization?.organization_id }),
        enabled: !!organization?.organization_id,
        refetchInterval: 30000, // REFRESH CADA 30 SEGUNDOS
    });

    const kpis = dashboardData?.kpis || {
        inProgressCount: 0,
        readyForPickupCount: 0,
        deliveredThisMonthCount: 0,
        overdueOrDueTodayCount: 0,
    };

    const upcomingDeliveries = dashboardData?.upcomingDeliveries || [];

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 animate-fade-in pb-24">
            {/* NOTIFICACIÓN TOAST */}
            {toastState && (
                <Toast
                    message={toastState.message}
                    type={toastState.type}
                />
            )}

            {/* BANNER DE SALUDO Y ACCIÓN RÁPIDA PRINCIPAL (CON BUSCADOR RÁPIDO) */}
            <HomeHeaderBanner
                user={user}
                organization={organization}
                onOpenNewOrderModal={openOrderModal}
            />

            {/* ERROR STATE */}
            {error && (
                <div className="alert alert-error rounded-2xl shadow-xs text-sm py-3">
                    <span>Ocurrió un error al cargar la información del panel. Intenta recargar la página.</span>
                </div>
            )}

            {/* TARJETAS DE RESUMEN OPERATIVO (KPIs DE ESTADO 2x2 EN MÓVIL, 4x1 EN ESCRITORIO) */}
            <HomeKpiCards
                kpis={kpis}
                isLoading={isLoading}
            />

            {/* WIDGET DE PRIORIDADES: "ENTREGAS PROMETIDAS PARA ESTA SEMANA" */}
            <HomePriorityWidget
                upcomingDeliveries={upcomingDeliveries}
                isLoading={isLoading}
            />

            {/* MODAL DE CREACIÓN DE ORDEN (WIZARD) */}
            <Modal
                ref={orderModalRef}
                modalTitle="Nueva Orden de Servicio"
                modalSubtitle="Registra las piezas, costos, cliente y firma para crear una nueva orden"
            >
                <CreateOrderWizard
                    onClose={closeOrderModal}
                    showToast={showToast}
                />
            </Modal>
        </div>
    );
}