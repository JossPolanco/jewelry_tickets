import { Link, useNavigate } from "react-router";
import React from "react";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
            <div className="relative text-center max-w-2xl">
                <div className="absolute inset-0 blur-3xl opacity-20">
                    <div className="w-72 h-72 bg-primary rounded-full mx-auto" />
                </div>

                <div className="relative">
                    <h1 className="text-[8rem] md:text-[10rem] font-black text-primary leading-none">
                        404
                    </h1>

                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Oops... Te perdiste
                    </h2>

                    <p className="text-lg text-base-content/70 mb-8">
                        La página que estás intentando visitar no existe o ha sido eliminada.
                    </p>

                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link to="/home" className="btn btn-primary">
                            Volver a home
                        </Link>

                        <button type="button"
                            onClick={() => window.history.back()}
                            className="btn btn-ghost"
                        >
                            Regresar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}