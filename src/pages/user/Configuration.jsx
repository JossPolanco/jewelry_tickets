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

export default function Configuration() {
    const modalRef = useRef(null);
    const alertRef = useRef(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('theme');
    });
  
    const changeTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        setCurrentTheme(theme);
    };

    const themes = [
        'aurora',
        'dark',
    ]

    const logoutMutation = useMutation({
        mutationFn: logoutUser,

        onSuccess: () => {
            queryClient.clear();
            navigate('/');
        },
    })

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">

            {/* HEADER */}
            <div className="space-y-1 py-2 text-center md:text-left">
                <div className='flex items-center justify-center'>
                    Titulo
                </div>
                <p className="text-md text-base-content/60 text-center">
                    Personaliza tu rincón y administra tu cuenta.
                </p>
            </div>

            {/* USER CARD */}
            <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                <div className="card-body p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* AVATAR */}
                            {/* <div className="avatar avatar-online w-14 h-14 ring-2 ring-primary/10 rounded-full overflow-hidden shadow-inner shrink-0 relative">
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
                            </div> */}

                            {/* NAME & NICKNAME */}
                            {/* <div className="min-w-0">
                                <h2 className="text-base font-bold text-base-content truncate">{profile?.display_name || "Cosa Linda"}</h2>
                                <p className="text-xs text-base-content/50 truncate">@{profile?.nickname || "nickname"}</p>
                            </div> */}
                        </div>

                        {/* ACTIONS ROW */}
                        <div className="flex items-center gap-2 shrink-0">
                            <button className="btn btn-sm btn-ghost gap-1.5 text-primary text-xs font-semibold px-3 rounded-xl bg-primary/5 active:bg-primary/10 transition-colors"
                                type="button"
                                onClick={() => modalRef.current?.open()}
                                disabled={false}
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
        </div>

    )
}