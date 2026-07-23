import { ChromePicker } from 'react-color';
import { Check } from 'lucide-react';
import { useRef } from 'react';
import Modal from '../Modal';

// FUNCION PARA VER SI EL COLOR ES CLARO O OSCURO PARA CAMBIAR EL COLOR DEL CHECK DEL COLOR EN EL MENU
const isLightColor = (color) => {
    if (!color) return false;
    const lower = color.toLowerCase();
    if (lower.startsWith('#')) {
        let c = lower.substring(1);
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000 > 125;
    }
    if (lower.startsWith('rgba') || lower.startsWith('rgb')) {
        const match = lower.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            return (r * 299 + g * 587 + b * 114) / 1000 > 125;
        }
    }
    return false;
};

// PALETA DE COLORES RAPIDOS
const QUICK_COLORS = [
    '#000000', // Charcoal/Black
    '#8e8e93', // Gray
    '#d1d1d6', // Light Gray
    '#ffffff', // White
    '#ff3b30', // Warm Red
    '#ff9500', // Warm Orange
    '#ffcc00', // Warm Yellow
    '#34c759', // Warm Green
    '#007aff', // Warm Blue
    '#af52de', // Warm Purple
];

// ESQUEMA DE COLORES PARA EL PICKER PERSONALIZADO
const colorSchema = " bg-[conic-gradient(from_0deg,_#ff0000,_#ff8000,_#ffff00,_#80ff00,_#00ff00,_#00ff80,_#00ffff,_#0080ff,_#0000ff,_#8000ff,_#ff00ff,_#ff0080,_#ff0000)]"

export default function BrushConfig({ strokeWidth, setStrokeWidth, strokeStyle, setStrokeStyle, strokeColor, setStrokeColor, }) {
    const customColorModalRef = useRef(null);

    const handleCustomColorClick = () => {
        customColorModalRef.current?.open();
    };

    return (
        <div className="space-y-4 animate-fade-in w-full text-left">
            <h3 className="text-sm font-bold text-base-content/85">Herramienta de dibujo</h3>

            {/* TAMAÑO DEL PINCEL */}
            <div className="space-y-2">
                <span className="text-xs text-base-content/60 block">Tamaño</span>
                <div className="flex items-center gap-3">
                    {[2, 5, 8, 15].map((sz) => (
                        <button
                            key={sz}
                            type="button"
                            onClick={() => setStrokeWidth(sz)}
                            aria-label={`Tamaño ${sz} px`}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-transform transform active:scale-110 ease-in-out ${strokeWidth === sz
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-base-200 text-base-content/70 active:bg-base-200'
                                }`}
                        >
                            <span className="rounded-full bg-current" style={{ width: `${Math.min(sz * 1.5 + 2, 20)}px`, height: `${Math.min(sz * 1.5 + 2, 20)}px` }} />
                        </button>
                    ))}
                    <div className="flex-1 min-w-20">
                        <input className="range range-primary range-sm w-full"
                            type="range"
                            min="1"
                            max="40"
                            value={strokeWidth}
                            onChange={(e) => setStrokeWidth(Number(e.target.value))}
                            aria-label="Tamaño de trazo"
                        />
                    </div>
                    <span className="text-xs font-mono font-semibold text-base-content/75 min-w-8 text-right">
                        {strokeWidth} px
                    </span>
                </div>
            </div>

            {/* ESTILO DEL TRAZO */}
            <div className="space-y-2">
                <span className="text-xs text-base-content/60 block">Estilo</span>
                <div className="flex gap-2">
                    {[
                        { id: 'solid', label: 'Normal', style: 'border-solid border-t-2' },
                        { id: 'dashed', label: 'Rayo', style: 'border-dashed border-t-2' },
                        { id: 'dotted', label: 'Puntos', style: 'border-dotted border-t-4' }
                    ].map((style) => (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => setStrokeStyle(style.id)}
                            className={`flex-1 py-2 px-3 flex flex-col items-center justify-center rounded-xl border transition-transform min-h-11 transform active:scale-110 ease-in-out ${strokeStyle === style.id
                                ? 'border-primary bg-primary/5 text-primary font-semibold'
                                : 'border-base-200 text-base-content/70 active:bg-base-200'
                                }`}
                        >
                            <div className={`w-full max-w-10 border-base-content/70 my-1 ${style.style}`} />
                            <span className="text-[10px] mt-1">{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* PALETA DE COLORES RAPIDOS DEL PINCEL */}
            <div className="space-y-2">
                <span className="text-xs text-base-content/60 block">Color del pincelito</span>
                <div className="flex flex-wrap items-center gap-2">
                    {QUICK_COLORS.map((color) => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setStrokeColor(color)}
                            aria-label={`Color ${color}`}
                            className={`w-9 h-9 rounded-full border transition-transform active:scale-95 flex items-center justify-center shadow-xs ${strokeColor.toLowerCase() === color.toLowerCase()
                                ? 'border-primary ring-2 ring-primary/40'
                                : 'border-base-300'
                                }`}
                            style={{ backgroundColor: color }}
                        >
                            {strokeColor.toLowerCase() === color.toLowerCase() && (
                                <Check className={`w-4 h-4 ${color === '#ffffff' ? 'text-black' : 'text-white'}`} />
                            )}
                        </button>
                    ))}

                    {/* Custom Color Picker */}
                    <button
                        type="button"
                        onClick={handleCustomColorClick}
                        aria-label="Color personalizado"
                        className={`w-9 h-9 rounded-full border border-base-300 active:scale-95 shadow-xs flex items-center justify-center
                        ${!QUICK_COLORS.includes(strokeColor.toLowerCase())
                                ? 'ring-2 ring-primary/40'
                                : colorSchema
                            }`}
                        style={!QUICK_COLORS.includes(strokeColor.toLowerCase()) ? { backgroundColor: strokeColor } : {}}
                    >
                        {!QUICK_COLORS.includes(strokeColor.toLowerCase()) && (
                            <Check className={`w-4 h-4 ${isLightColor(strokeColor) ? 'text-black' : 'text-white'}`} />
                        )}
                    </button>

                    {/* PREMIUM COLOR PICKER MODAL */}
                    <Modal className="max-w-xs" ref={customColorModalRef} modalTitle="Color personalizado" modalSubtitle="Elige el color y opacidad para tu pincel">
                        <div className="flex flex-col items-center justify-center gap-4 pt-2">
                            <ChromePicker
                                color={strokeColor}
                                onChange={(color) => {
                                    const { r, g, b, a } = color.rgb;
                                    setStrokeColor(`rgba(${r}, ${g}, ${b}, ${a})`);
                                }}
                                disableAlpha={false}
                                className="shadow-none! !border! border-base-200! bg-base-100!"
                                styles={{
                                    default: {
                                        picker: {
                                            boxShadow: 'none',
                                            background: 'transparent',
                                        }
                                    }
                                }}
                            />
                            {/* INFORMACION DEL COLOR */}
                            <div className="flex items-center gap-3 w-full justify-between bg-base-200/50 p-3 rounded-2xl border border-base-200">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full border border-base-300 shadow-sm shrink-0" style={{ backgroundColor: strokeColor }} />
                                    <div className="flex flex-col text-left overflow-hidden">
                                        <span className="text-[10px] font-semibold text-base-content/60">Color actual</span>
                                        <span className="font-mono text-xs font-bold text-base-content truncate max-w-35">
                                            {strokeColor}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => customColorModalRef.current?.close()}
                                    className="btn btn-primary btn-sm rounded-xl px-4 shrink-0"
                                >
                                    Listo
                                </button>
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>
        </div>
    );
}
