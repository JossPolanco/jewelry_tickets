import { UploadPanel, GalleryPanel, Modal, Alert } from "@/components";
import { getCurrentUser } from '@/services/user';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function TestingPage() {
    const navigate = useNavigate()
    const modalRef = useRef(null)
    const alertRef = useRef(null)
    const [activeGallery, setActiveGallery] = useState('default')
    const [alertConfig, setAlertConfig] = useState(null)

    const { data: user } = useQuery({
        queryKey: ["user"],
        queryFn: getCurrentUser,
    });

    const openControlledAlert = (config) => {
        setAlertConfig(config)
    }

    return (
        <div className="max-w-md mx-auto p-4 space-y-6 pb-24 animate-fade-in">
            {/* Header / Navigation */}
            <div className="relative flex items-center justify-center py-2 border-b border-base-200/90 dark:border-base-800/40 mb-2">
                <button type="button" className="absolute left-0 btn btn-circle btn-primary text-white active:text-white md:hover:text-white active:bg-primary/80 md:hover:bg-primary/80 transition-transform duration-200"
                    onClick={() => navigate(-1)}
                    aria-label="Volver"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center justify-center py-4">
                    <Title />
                </div>
            </div>

            {/* Pruebas de Componente Alert */}
            <div className="space-y-3 p-4 bg-base-200/50 rounded-2xl border border-base-300">
                <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Pruebas del Componente Alert</p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        className="btn btn-info btn-sm text-white"
                        onClick={() => openControlledAlert({
                            type: 'info',
                            position: 'center',
                            title: 'Mensajes sin leer',
                            message: 'Tienes 12 mensajes sin leer en tu bandeja de entrada.'
                        })}
                    >
                        Info (Centrado)
                    </button>

                    <button
                        type="button"
                        className="btn btn-success btn-sm text-white"
                        onClick={() => openControlledAlert({
                            type: 'success',
                            position: 'top',
                            title: '¡Operación Exitosa!',
                            message: 'Los cambios se han guardado correctamente.'
                        })}
                    >
                        Success (Superior)
                    </button>

                    <button
                        type="button"
                        className="btn btn-warning btn-sm text-white"
                        onClick={() => openControlledAlert({
                            type: 'warning',
                            position: 'center',
                            title: '¿Confirmar Acción?',
                            message: 'Esta acción no se puede deshacer.',
                            actions: (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-outline"
                                        onClick={() => setAlertConfig(null)}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-xs btn-warning text-white"
                                        onClick={() => {
                                            setAlertConfig(null);
                                            setTimeout(() => {
                                                alertRef.current?.open({
                                                    type: 'success',
                                                    title: 'Acción Confirmada',
                                                    message: '¡Has confirmado la acción con éxito!'
                                                });
                                            }, 100);
                                        }}
                                    >
                                        Aceptar
                                    </button>
                                </div>
                            )
                        })}
                    >
                        Warning + Botones
                    </button>

                    <button
                        type="button"
                        className="btn btn-error btn-sm text-white"
                        onClick={() => openControlledAlert({
                            type: 'danger',
                            position: 'center',
                            title: 'Error de Conexión',
                            message: 'No se pudo establecer conexión con el servidor.'
                        })}
                    >
                        Danger / Error
                    </button>
                </div>

                <button
                    type="button"
                    className="btn btn-outline btn-secondary btn-sm w-full mt-2"
                    onClick={() => alertRef.current?.open({
                        type: 'info',
                        position: 'top',
                        title: 'Alerta Abierta Vía Ref',
                        message: 'Esta alerta fue lanzada utilizando alertRef.current.open()'
                    })}
                >
                    Probar Alerta vía Ref
                </button>
            </div>

            {/* Alert controlado */}
            {alertConfig && (
                <Alert
                    isOpen={Boolean(alertConfig)}
                    onClose={() => setAlertConfig(null)}
                    type={alertConfig.type}
                    position={alertConfig.position}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    actions={alertConfig.actions}
                />
            )}

            {/* Alert imperativo vía Ref */}
            <Alert ref={alertRef} />

            {/* Selector de galería */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Galería Activa</p>
                <div role="tablist" className="tabs tabs-boxed">
                    <button type="button" role="tab" className={`tab ${activeGallery === 'default' ? 'tab-active' : ''}`} onClick={() => setActiveGallery('default')} >
                        Por Defecto (default)
                    </button>
                    <button type="button" role="tab" className={`tab ${activeGallery === 'citas' ? 'tab-active' : ''}`} onClick={() => setActiveGallery('citas')} >
                        Citas (citas)
                    </button>
                </div>
            </div>

            <button type="button" className="btn btn-primary w-full" onClick={() => modalRef.current?.open()}>
                Abrir Modal de Prueba ({activeGallery})
            </button>

            <Modal ref={modalRef}>
                {/* Panel de subida */}
                <UploadPanel bucket='photos' gallery={activeGallery} user={user} />
            </Modal>

            {/* Galería de fotos del bucket "photos" */}
            <GalleryPanel bucket='photos' gallery={activeGallery} enableDelete={true} />
        </div>
    )
}

export function Title() {
    return (
        <h2 className="text-3xl font-extrabold tracking-tight text-center drop-shadow-xs bg-base-100 px-4 py-1.5 rounded-full">
            <span className="text-orange-500">P</span>
            <span className="text-orange-400">a</span>
            <span className="text-amber-400">g</span>
            <span className="text-yellow-400">i</span>
            <span className="text-lime-500">n</span>
            <span className="text-green-500">i</span>
            <span className="text-emerald-500">t</span>
            <span className="text-cyan-400">a</span>
            <span> </span>
            <span className="text-sky-500">d</span>
            <span className="text-blue-500">e</span>
            <span> </span>
            <span className="text-indigo-500">p</span>
            <span className="text-violet-500">r</span>
            <span className="text-fuchsia-500">u</span>
            <span className="text-pink-500">e</span>
            <span className="text-rose-500">b</span>
            <span className="text-red-500">a</span>
            <span className="text-orange-500">s</span>
        </h2>
    );
}