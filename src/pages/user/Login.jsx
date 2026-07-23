import { Mail, Lock, Heart, Eye, EyeOff } from 'lucide-react';
import { loginUser } from '../../services/auth/authService';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../utils/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
    email: z.string().email("Ingresa un correo electrónico válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
            session?.user ? navigate('/home') : navigate('/');
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(loginSchema)
    });

    const queryClient = useQueryClient();

    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            navigate('/home');
        },
        onError: (error) => {
            console.error("Login error:", error);
        }
    });

    const handleLogin = (data) => {
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-base-300 flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center text-center mb-6 px-2">
                    <div className="bg-primary/10 p-4 rounded-full mb-4 animate-pulse">
                        <Heart
                            size={32}
                            className="text-primary fill-primary"
                        />
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-base-content">
                        Tickets
                    </h1>

                    <p className="text-base-content mt-3 text-sm leading-relaxed max-w-sm">
                        Un espacio para guardar todos tus recuerdos y momentos especiales.
                    </p>
                </div>

                {/* FORMULARIO */}
                <div className="card bg-base-100 shadow-2xl border border-base-200">
                    <div className="card-body gap-4">
                        <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Correo electrónico</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="amor@ejemplo.com"
                                        className="input input-bordered w-full pl-10 focus:border-primary focus:outline-none"
                                        {...register("email")}
                                    />
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                                </div>
                                {errors.email && (
                                    <span className="text-error text-sm mt-1 block">
                                        {errors.email.message}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Contraseña</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="input input-bordered w-full pl-10 pr-10 focus:border-primary focus:outline-none"
                                        {...register("password")}
                                    />
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 focus:outline-none"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="text-error text-sm mt-1 block">
                                        {errors.password.message}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-start text-sm">
                                <button
                                    type="button"
                                    className="link link-primary link-hover font-medium text-xs"
                                    onClick={() => navigate("/register")}
                                >
                                    Crear Cuenta
                                </button>
                            </div>

                            {loginMutation.isError && (
                                <div className="alert alert-error text-sm py-3 px-4 rounded-xl flex items-start gap-2 shadow-sm">
                                    <span className="text-left">
                                        {loginMutation.error?.message === "Invalid login credentials"
                                            ? "El correo o la contraseña son incorrectos. Inténtalo de nuevo, mi amor. 💕"
                                            : loginMutation.error?.message || "Ocurrió un error al iniciar sesión."}
                                    </span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className={`btn btn-primary w-full mt-2 ${loginMutation.isPending ? "btn-disabled" : ""}`}
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    <>
                                        <span>Iniciar Sesión</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}

