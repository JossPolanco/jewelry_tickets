import { BookHeart, CalendarHeart, StickyNote, CheckSquare, Sparkles, MapPin, Palette, FlaskConical, Settings, Heart, Sparkle } from 'lucide-react';
// import { getUserPosition } from '@/utils/geolocation';
import { UserMoodCard } from '@/components';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

export default function Home() {
    const navigate = useNavigate();

    // useEffect(() => {
    //     getUserPosition();
    // }, []);

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5 animate-fade-in pb-20">
            {/* HEADER CON ATTS */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-secondary/15 via-primary/10 to-accent/15 border border-secondary/20 p-5 sm:p-6 shadow-sm">
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center shrink-0 text-secondary shadow-inner">
                        <Heart className="w-6 h-6 fill-secondary animate-pulse" />
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary uppercase tracking-wider">
                            <Sparkle className="w-3.5 h-3.5 fill-secondary" />
                            <span>Our App Bbyyyy</span>
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-base-content">
                            FELICES 3 MESESITOS BBYYY
                        </h1>
                        <p className="text-xs sm:text-sm text-base-content/70 font-medium">
                            Att. Josué 💕
                        </p>
                    </div>
                </div>
            </div>

            {/* TARJETA DE ESTADO DE ÁNIMO */}
            <UserMoodCard />

            {/* GRID PARA LOS BOTONES */}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">

                {/* DIARIO (2C COLUMNAS DE ANCHO) */}
                <button type="button" onClick={() => navigate('/diary')} className="btn btn-soft btn-primary col-span-2 min-h-35 sm:min-h-40 h-full w-full rounded-3xl p-5 flex flex-col justify-between items-start text-left group shadow-sm hover:shadow-md active:scale-[0.98] transition-transform duration-200 border-none">
                    <div className="w-full flex items-center justify-between">
                        <span className="badge badge-primary badge-sm font-medium tracking-wide">
                            HISTORIAS
                        </span>
                        <div className="p-2.5 rounded-2xl bg-primary/15 text-primary group-hover:scale-110 transition-transform duration-200">
                            <BookHeart className="w-7 h-7" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Diario</h2>
                        <p className="text-xs sm:text-sm opacity-80 line-clamp-1 font-normal">
                            Nuestros momentos juntos ✨
                        </p>
                    </div>
                </button>

                {/* CITAS (1 COLUMNA DE ANCHO - 2 FILAS DE ALTO) */}
                <button type="button" onClick={() => navigate('/dates')} className="btn btn-soft btn-secondary col-span-1 row-span-2 min-h-55 h-full w-full rounded-3xl p-4 flex flex-col justify-between items-center text-center group shadow-sm hover:shadow-md active:scale-[0.98] transition-transform duration-200 border-none">
                    <div className="p-3 rounded-2xl bg-secondary/15 text-secondary group-hover:scale-110 transition-transform duration-200 mt-2">
                        <CalendarHeart className="w-9 h-9" />
                    </div>
                    <div className="mb-2">
                        <span className="badge badge-secondary badge-xs mb-1">Citas</span>
                        <h2 className="text-base sm:text-lg font-bold">Nuestras Cititas</h2>
                        <p className="text-[11px] sm:text-xs opacity-75 mt-0.5">Planes juntos 💖</p>
                    </div>
                </button>

                {/* NOTAS (1 COLUMNA DE ANCHO - 1 FILA DE ALTO) */}
                <button type="button" onClick={() => navigate('/notes')} className="btn btn-soft btn-info col-span-1 min-h-26.25 h-full w-full rounded-3xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 group shadow-sm hover:shadow-md active:scale-[0.97] transition-transform duration-200 border-none">
                    <div className="p-2 rounded-2xl bg-info/15 text-info group-hover:scale-110 transition-transform duration-200">
                        <StickyNote className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold">Notitas</span>
                </button>

                {/* TAREAS (1 COLUMNA DE ANCHO - 1 FILA DE ALTO) */}
                <button type="button" onClick={() => navigate('/tasks')} className="btn btn-soft btn-success col-span-1 min-h-26.25 h-full w-full rounded-3xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 group shadow-sm hover:shadow-md active:scale-[0.97] transition-transform duration-200 border-none">
                    <div className="p-2 rounded-2xl bg-success/15 text-success group-hover:scale-110 transition-transform duration-200">
                        <CheckSquare className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold">Tareitas</span>
                </button>

                {/* ANIVERSARIOS (1 COLUMNA DE ANCHO - 1 FILA DE ALTO) */}
                <button type="button" onClick={() => navigate('/anniversaries')} className="btn btn-soft btn-warning col-span-1 min-h-26.25 h-full w-full rounded-3xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 group shadow-sm hover:shadow-md active:scale-[0.97] transition-transform duration-200 border-none">
                    <div className="p-2 rounded-2xl bg-warning/15 text-warning group-hover:scale-110 transition-transform duration-200">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold">Waniversarios</span>
                </button>

                {/* UBICACIÓN (1 COLUMNA DE ANCHO - 1 FILA DE ALTO) */}
                <button type="button" onClick={() => navigate('/geolocation')} className="btn btn-soft btn-error col-span-1 min-h-26.25 h-full w-full rounded-3xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 group shadow-sm hover:shadow-md active:scale-[0.97] transition-transform duration-200 border-none">
                    <div className="p-2 rounded-2xl bg-error/15 text-error group-hover:scale-110 transition-transform duration-200">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold">Mapita</span>
                </button>

                {/* LIENZO DE DIBUJO (2C COLUMNAS DE ANCHO) */}
                <button type="button" onClick={() => navigate('/games')} className="btn btn-soft btn-secondary col-span-2 min-h-23.75 h-full w-full rounded-3xl p-4 flex flex-row items-center justify-center gap-3 group border-2 active:scale-[0.98] transition-transform duration-200">
                    <div className="p-2 rounded-2xl bg-secondary/10 group-hover:scale-110 transition-transform duration-200">
                        <Palette className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <span className="text-sm sm:text-base font-bold block">Juegos</span>
                        <span className="text-xs opacity-70 font-normal block">Juegitos para jugar jeje</span>
                    </div>
                </button>

                {/* PRUEBAS (1 COLUMNA DE ANCHO - 1 FILA DE ALTO) */}
                <button type="button" onClick={() => navigate('/testing')} className="btn btn-soft btn-neutral col-span-1 min-h-23.75 h-full w-full rounded-3xl p-3 flex flex-col items-center justify-center text-center gap-1 group border-2 active:scale-[0.97] transition-transform duration-200 opacity-80 hover:opacity-100">
                    <FlaskConical className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-xs font-semibold">Pruebas</span>
                </button>

                <button type="button" onClick={() => navigate('/config')} className="btn btn-soft btn-neutral col-span-1 min-h-23.75 h-full w-full rounded-3xl p-3 flex flex-col items-center justify-center text-center gap-1 group border-2 active:scale-[0.97] transition-transform duration-200 opacity-80 hover:opacity-100">
                    <Settings className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-xs font-semibold">Ajustes</span>
                </button>

            </div>
        </div>
    );
}
