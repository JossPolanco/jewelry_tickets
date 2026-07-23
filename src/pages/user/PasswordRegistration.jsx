import { setUserPassword } from "../../services/auth/authService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

const registerSchema = z.object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "La confirmación de contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

export default function PasswordRegistration() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const queryClient = useQueryClient();

    const setPswMutation = useMutation({
        mutationFn: setUserPassword,

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            navigate('/home');
        },

        onError: (error) => {
            console.error("Error al actualizar la contraseña:", error);
        }
    });

    const onSubmit = (data) => {
        setPswMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Botón volver */}
                <button type="button"
                    className="btn btn-ghost btn-sm gap-1.5 text-base-content/60 active:bg-base-300 rounded-xl mb-4 px-3 font-semibold text-xs transition-colors"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={14} />
                    Volver
                </button>

                <div className="card bg-base-100 rounded-3xl border border-base-200/50 shadow-sm">
                    <div className="card-body p-6 md:p-8 gap-5">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-primary/10 p-4 rounded-full mb-3">
                                <Lock
                                    size={28}
                                    className="text-primary"
                                />
                            </div>

                            <h1 className="text-2xl font-bold tracking-tight text-base-content">
                                Asegura tu rincón
                            </h1>

                            <p className="text-base-content/60 mt-1.5 text-xs leading-relaxed max-w-70">
                                Crea una contraseña para proteger nuestro espacio especial y mantenerlo siempre privado.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="label py-1">
                                    <span className="label-text font-medium text-xs">
                                        Contraseña
                                    </span>
                                </label>

                                <div className="relative">
                                    <input className={`input input-bordered w-full pl-10 pr-10 focus:border-primary focus:outline-none text-sm rounded-xl ${errors.password ? "input-error" : ""}`}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        {...register("password")}
                                    />
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" size={16} />
                                    <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 active:text-base-content/75 focus:outline-none"
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {errors.password && (
                                    <span className="text-error text-[11px] mt-1.5 block pl-1">
                                        {errors.password.message}
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="label py-1">
                                    <span className="label-text font-medium text-xs">
                                        Confirmar contraseña
                                    </span>
                                </label>

                                <div className="relative">
                                    <input className={`input input-bordered w-full pl-10 pr-10 focus:border-primary focus:outline-none text-sm rounded-xl ${errors.confirmPassword ? "input-error" : ""}`}
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        {...register("confirmPassword")}
                                    />
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" size={16} />
                                    <button className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 active:text-base-content/75 focus:outline-none"
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {errors.confirmPassword && (
                                    <span className="text-error text-[11px] mt-1.5 block pl-1">
                                        {errors.confirmPassword.message}
                                    </span>
                                )}
                            </div>

                            {setPswMutation.isError && (
                                <div className="alert alert-error text-xs py-2.5 px-4 rounded-xl flex gap-2">
                                    <span className="text-white leading-relaxed text-left">
                                        {setPswMutation.error.message || "Ocurrió un error al guardar tu contraseña."}
                                    </span>
                                </div>
                            )}

                            <div className="pt-2 space-y-3">
                                <button className={`btn btn-primary w-full rounded-xl active:scale-[0.98] transition-transform text-xs font-semibold ${setPswMutation.isPending ? "btn-disabled" : ""}`}
                                    type="submit"
                                    disabled={setPswMutation.isPending}
                                >
                                    {setPswMutation.isPending ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={14} />
                                            Guardar contraseña
                                        </>
                                    )}
                                </button>

                                <button className="btn btn-outline btn-ghost w-full rounded-xl active:scale-[0.98] transition-transform text-xs font-semibold"
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    disabled={setPswMutation.isPending}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}