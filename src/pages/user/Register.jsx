import { registerUser } from "../../services/auth/authService";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { z } from "zod";

const registerSchema = z.object({
    email: z.string().email("Ingresa un correo válido"),
});

export default function Register() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const sendMagicLinkMutation = useMutation({
        mutationFn: registerUser,

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            navigate('/create-password');
        },

        onError: (error) => {
            console.log(error);
        }
    });

    const onSubmit = (data) => {
        console.log("data en onSubmit:", data.email);
        sendMagicLinkMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-base-300 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Botón volver */}
                <Link
                    to="/"
                    className="btn btn-ghost btn-sm mb-4"
                >
                    <ArrowLeft size={18} />
                    Volver
                </Link>

                <div className="card bg-base-100 shadow-2xl border border-base-200">
                    <div className="card-body">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="bg-primary/10 p-4 rounded-full mb-4">
                                <Sparkles
                                    size={32}
                                    className="text-primary"
                                />
                            </div>

                            <h1 className="text-3xl font-bold">
                                Crear Cuenta
                            </h1>

                            <p className="text-base-content/70 mt-2 text-sm">
                                Ingresa tu correo y se te enviará un enlace
                                mágico para acceder a NearU, wonita.
                            </p>
                        </div>

                        {sendMagicLinkMutation.isSuccess ? (
                            <div className="alert alert-success">
                                <Mail size={18} />
                                <span>
                                    Revisa tu correo. Se ha enviado un
                                    enlace para iniciar sesión.
                                </span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                                {sendMagicLinkMutation.isError && (
                                    <div className="alert alert-error">
                                        <span>
                                            Ocurrió un error al enviar el correo.
                                        </span>
                                    </div>
                                )}

                                <button type="submit" className={`btn btn-primary w-full ${sendMagicLinkMutation.isPending ? "btn-disabled" : ""}`}>
                                    {sendMagicLinkMutation.isPending ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Mail size={18} />
                                            Enviar Magic Link
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        <div className="divider">o</div>

                        <Link to="/" className="btn btn-outline w-full" >
                            Ya tengo una cuenta
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}