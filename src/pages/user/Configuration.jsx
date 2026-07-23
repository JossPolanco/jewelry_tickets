import { updateInfo, getUserProfile, uploadAvatar, deleteAvatar } from '../../services/user/userService';
import { Lock, Palette, Camera, Pencil, User, AtSign, Trash2, MapPin } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { logoutUser } from "../../services/auth/authService";
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';
import { z } from 'zod';
import { requestLocationPermission } from '../../utils/geolocation';
import { setCurrentLocation } from '../../services/geolocation';

export default function Configuration() {
    const modalRef = useRef(null);
    const alertRef = useRef(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('theme') || 'evelyn';
    });

    const [locationPermission, setLocationPermission] = useState("prompt");

    useEffect(() => {
        let active = true;
        let permissionObj = null;

        async function checkPermission() {
            if (!navigator.permissions) return;

            try {
                const permission = await navigator.permissions.query({
                    name: "geolocation",
                });

                if (!active) return;
                setLocationPermission(permission.state);
                permissionObj = permission;

                permission.onchange = () => {
                    if (active) setLocationPermission(permission.state);
                };
            } catch (error) {
                console.error("Error al verificar permisos de localización:", error);
            }
        }

        checkPermission();

        return () => {
            active = false;
            if (permissionObj) {
                permissionObj.onchange = null;
            }
        };
    }, []);

    const handleEnableLocation = () => {
        requestLocationPermission(
            (position) => {
                setLocationPermission("granted");
                setCurrentLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy_meters: position.coords.accuracy
                }).catch((error) => {
                    console.error("Error al guardar ubicación al conceder permiso:", error);
                });
            },
            (error) => {
                if (error.code === 1) { // PERMISSION_DENIED
                    setLocationPermission("denied");
                }
            }
        );
    };

    const changeTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        setCurrentTheme(theme);
    };

    const themes = [
        'valentine',
        'evelyn',
        'dark',
        'light',
        // 'modern-dark',
    ]

    const uploadAvatarMutation = useMutation({
        mutationFn: uploadAvatar,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['userProfile']
            });
        },
        onError: (error) => {
            console.error("Error al subir el avatar:", error);
            alertRef.current?.open({
                type: 'danger',
                title: 'Error al subir la imagen',
                message: error.message || 'Ocurrió un error al subir el avatar.'
            });
        }
    });

    const deleteAvatarMutation = useMutation({
        mutationFn: deleteAvatar,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['userProfile']
            });
        },
        onError: (error) => {
            console.error("Error al eliminar el avatar:", error);
            alertRef.current?.open({
                type: 'danger',
                title: 'Error al eliminar la imagen',
                message: error.message || 'Ocurrió un error al eliminar el avatar.'
            });
        }
    });

    const isAvatarPending = uploadAvatarMutation.isPending || deleteAvatarMutation.isPending;

    const logoutMutation = useMutation({
        mutationFn: logoutUser,

        onSuccess: () => {
            queryClient.clear();
            navigate('/');
        },
    })

    const { data: profile } = useQuery({
        queryKey: ['userProfile'],
        queryFn: getUserProfile,
    });

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">

            {/* HEADER */}
            <div className="space-y-1 py-2 text-center md:text-left">
                <div className='flex items-center justify-center'>
                    <Title />
                </div>
                <p className="text-sm text-base-content/60 text-center">
                    Personaliza tu rincón y administra tu cuenta.
                </p>
            </div>

            {/* USER CARD */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                <div className="card-body p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* AVATAR */}
                            <div className="avatar avatar-online w-14 h-14 ring-2 ring-primary/10 rounded-full overflow-hidden shadow-inner shrink-0 relative">
                                <img
                                    src={profile?.avatar_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPySnqxeKdKLTPzZFpDszmCg-e0NGSsFxqaw&s"}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                                {isAvatarPending && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="loading loading-spinner loading-sm text-white" />
                                    </div>
                                )}
                            </div>

                            {/* NAME & NICKNAME */}
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-base-content truncate">{profile?.display_name || "Cosa Linda"}</h2>
                                <p className="text-xs text-base-content/50 truncate">@{profile?.nickname || "nickname"}</p>
                            </div>
                        </div>

                        {/* ACTIONS ROW */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button className="btn btn-sm btn-ghost gap-1.5 text-primary text-xs font-semibold px-3 rounded-xl bg-primary/5 active:bg-primary/10 transition-colors"
                                type="button"
                                onClick={() => modalRef.current?.open()}
                                disabled={isAvatarPending}
                            >
                                <Pencil size={12} />
                                Editar
                            </button>

                            <button type="button" className="btn btn-sm btn-ghost text-error/70 active:text-error active:bg-error/10 hover:bg-error/5 rounded-xl font-medium text-xs px-3"
                                onClick={() => logoutMutation.mutate()}
                                disabled={logoutMutation.isPending}
                            >
                                {logoutMutation.isPending ? (
                                    <span className="loading loading-spinner loading-xs" />
                                ) : (
                                    "Cerrar sesión"
                                )}
                            </button>
                        </div>
                    </div>

                    <Modal modalTitle="Editar Perfil" modalSubtitle="Modifica tus datitos de perfil y fotito." ref={modalRef} className="max-w-md">
                        <UpdateInfo
                            profile={profile}
                            isAvatarPending={isAvatarPending}
                            onUploadPhoto={(file) => uploadAvatarMutation.mutate(file)}
                            onDeletePhoto={() => deleteAvatarMutation.mutate()}
                            onSuccess={() => modalRef.current?.close()}
                        />
                    </Modal>
                </div>
            </div>

            {/* PASSWORD */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                <div className="card-body p-6 flex flex-row items-center justify-between gap-4">
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

                    <button type="button" className="btn btn-primary btn-sm rounded-full px-5 font-semibold text-xs active:scale-95 transition-transform" onClick={() => navigate('/create-password')}>
                        Cambiar
                    </button>
                </div>
            </div>

            {/* THEME */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                <div className="card-body p-6 flex flex-row items-center justify-between gap-4">
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
                        <ul className="dropdown-content bg-base-300 rounded-box z-1 w-40 p-2 shadow-2xl mt-1">
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

            {/* LOCATION PERMISSION */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                <div className="card-body p-6 flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-secondary/10 text-secondary shrink-0">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-base text-base-content">
                                Permiso de localización
                            </h2>
                            <p className="text-xs text-base-content/50 mt-0.5">
                                Habilita el acceso a tu ubicación para usar el mapa.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {locationPermission === "granted" && (
                            <span className="badge badge-success gap-1 font-semibold p-3 text-xs">
                                Permitido
                            </span>
                        )}
                        {locationPermission === "prompt" && (
                            <button
                                className="btn btn-primary btn-sm rounded-full px-5 font-semibold text-xs active:scale-95 transition-transform"
                                type="button"
                                onClick={handleEnableLocation}
                            >
                                Habilitar
                            </button>
                        )}
                        {locationPermission === "denied" && (
                            <div className="flex flex-col items-end gap-1">
                                <span className="badge badge-error gap-1 font-semibold p-3 text-xs">
                                    Bloqueado
                                </span>
                                <span className="text-[10px] text-error/80 text-right">
                                    Actívalo en ajustes del navegador
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Alert ref={alertRef} />
        </div>

    )
}

const updateInfoSchema = z.object({
    name: z.string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(50, "No puede tener más de 50 caracteres")
        .trim(),
    nickname: z.string()
        .min(2, "El apodo debe tener al menos 2 caracteres")
        .max(30, "No puede tener más de 30 caracteres")
        .trim()
        .regex(/^[a-zA-Z0-9_]+$/, "El apodo solo puede contener letras, números y guiones bajos (_)"),
})

export function UpdateInfo({ profile, isAvatarPending, onUploadPhoto, onDeletePhoto, onSuccess }) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);

    const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm({
        resolver: zodResolver(updateInfoSchema),
        defaultValues: {
            name: profile?.display_name || "",
            nickname: profile?.nickname || "",
        }
    });

    // RECETEA EL FORMULARIO CUANDO SE CARGUEN LOS DATOS DEL PERFIL
    useEffect(() => {
        if (profile) {
            reset({
                name: profile.display_name || "",
                nickname: profile.nickname || "",
            });
        }
    }, [profile, reset]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onUploadPhoto?.(file);
        }
    };

    const handleUpdateInfo = (data) => {
        // Enviar solo si los datos son diferentes
        if (data.name === profile?.display_name && data.nickname === profile?.nickname) {
            onSuccess?.();
            return;
        }
        updateInfoMutation.mutate(data);
    }

    const updateInfoMutation = useMutation({
        mutationFn: updateInfo,

        onSuccess: (result) => {
            queryClient.invalidateQueries({
                queryKey: ['userProfile']
            });
            onSuccess?.();
        },

        onError: (error) => {
            console.error("Error al actualizar la información:", error);
        }
    });

    return (
        <form onSubmit={handleSubmit(handleUpdateInfo)} className="space-y-5" >

            {/* AVATAR EDIT SECTION */}
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-base-200/50">
                <div className="relative w-20 h-20">
                    <div className="avatar w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/20 shadow-inner">
                        <img
                            src={profile?.avatar_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPySnqxeKdKLTPzZFpDszmCg-e0NGSsFxqaw&s"}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                        {isAvatarPending && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                <span className="loading loading-spinner loading-sm text-white" />
                            </div>
                        )}
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isAvatarPending}
                />

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        className="btn btn-xs btn-outline btn-primary rounded-full px-3"
                        disabled={isAvatarPending}
                    >
                        <Camera size={10} className="mr-1" />
                        Subir foto
                    </button>
                    {profile?.avatar && (
                        <button
                            type="button"
                            onClick={onDeletePhoto}
                            className="btn btn-xs btn-outline btn-error rounded-full px-3"
                            disabled={isAvatarPending}
                        >
                            <Trash2 size={10} className="mr-1" />
                            Eliminar
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4 pt-2">
                {/* Nombre */}
                <div>
                    <label className="label">
                        <span className="label-text font-medium">Nombre visible</span>
                    </label>
                    <div className="relative">
                        <input className={`input input-bordered w-full pl-10 focus:border-primary focus:outline-none ${errors.name ? "input-error" : ""}`}
                            type="text"
                            placeholder="Juan Gabriel"
                            {...register("name")}
                            disabled={updateInfoMutation.isPending || isAvatarPending}
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                    </div>
                    {errors.name && (
                        <span className="text-error text-sm mt-1 block">
                            {errors.name.message}
                        </span>
                    )}
                </div>

                {/* Apodo */}
                <div>
                    <label className="label">
                        <span className="label-text font-medium">Apodo</span>
                    </label>
                    <div className="relative">
                        <input className={`input input-bordered w-full pl-10 focus:border-primary focus:outline-none ${errors.nickname ? "input-error" : ""}`}
                            type="text"
                            placeholder="Apodo"
                            {...register("nickname")}
                            disabled={updateInfoMutation.isPending || isAvatarPending}
                        />
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                    </div>
                    {errors.nickname && (
                        <span className="text-error text-sm mt-1 block">
                            {errors.nickname.message}
                        </span>
                    )}
                </div>
            </div>

            {updateInfoMutation.isError && (
                <div className="alert alert-error text-sm py-2.5 px-4 rounded-2xl flex gap-2">
                    <span className="text-white text-xs leading-relaxed">
                        {updateInfoMutation.error?.message || "Ocurrió un error al guardar la información. Por favor, intenta de nuevo."}
                    </span>
                </div>
            )}

            <button className="btn btn-primary w-full animate-none rounded-xl" type="submit"
                disabled={!isDirty || updateInfoMutation.isPending || isAvatarPending}
            >
                {updateInfoMutation.isPending ? (
                    <>
                        <span className="loading loading-spinner loading-sm" />
                        Guardando cambios...
                    </>
                ) : (
                    "Guardar cambios"
                )}
            </button>
        </form>
    );
}

export function Title() {
    return (
        <h2 className="text-3xl font-extrabold tracking-tight text-center drop-shadow-xs bg-base-100 px-4 py-1.5 rounded-full">
            <span className="text-orange-500">C</span>
            <span className="text-orange-400">o</span>
            <span className="text-amber-400">n</span>
            <span className="text-yellow-400">f</span>
            <span className="text-lime-500">i</span>
            <span className="text-green-500">g</span>
            <span className="text-emerald-500">u</span>
            <span className="text-cyan-400">r</span>
            <span className="text-sky-500">a</span>
            <span className="text-blue-500">c</span>
            <span className="text-indigo-500">i</span>
            <span className="text-violet-500">ó</span>
            <span className="text-fuchsia-500">n</span>
        </h2>
    );
}