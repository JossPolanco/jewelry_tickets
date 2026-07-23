import { ChromePicker } from 'react-color';
import { useRef } from 'react';
import Modal from '../Modal';

const BACKGROUND_PRESETS = [
    { name: 'Blanco', color: '#ffffff', type: 'solid' },
    { name: 'Crema', color: '#faf6ee', type: 'solid' },
    { name: 'Puntos', color: '#ffffff', type: 'dotted' },
    { name: 'Oscuro', color: '#1e1e2e', type: 'solid' }
];

// FUNCION PARA DETECTAR SI EL COLOR ES CLARO O OSCURO PARA CAMBIAR EL COLOR DEL CHECK DEL COLOR EN EL MENU
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

export default function BackgroundConfig({ canvasColor, setCanvasColor, bgType, setBgType, opacity, setOpacity }) {
    const customColorModalRef = useRef(null);

    const isPresetSelected = BACKGROUND_PRESETS.some(
        (preset) => canvasColor.toLowerCase() === preset.color.toLowerCase() && bgType === preset.type
    );
    const isCustomSelected = !isPresetSelected;

    return (
        <div className="space-y-4 animate-fade-in w-full text-left">
            <h3 className="text-sm font-bold text-base-content/85">Fondo del lienzo</h3>

            <div className="space-y-2">
                <span className="text-xs text-base-content/60 block">Color de fondo</span>
                <div className="grid grid-cols-4 gap-2">
                    {BACKGROUND_PRESETS.map((preset) => {
                        const isSelected = canvasColor.toLowerCase() === preset.color.toLowerCase() && bgType === preset.type;
                        const isDotted = preset.type === 'dotted';
                        const isDark = !isDotted && !isLightColor(preset.color);
                        const textClass = isDotted
                            ? 'text-base-content'
                            : (isDark ? 'text-white' : 'text-zinc-800');

                        return (
                            <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                    setCanvasColor(preset.color);
                                    setBgType(preset.type);
                                }}
                                className={`relative h-12 rounded-xl border flex items-center justify-center transition-transform overflow-hidden ${isSelected
                                    ? 'border-primary ring-2 ring-primary/40 font-semibold'
                                    : 'border-base-200 active:bg-base-200'
                                    }`}
                            >
                                <div
                                    className="absolute inset-0 z-0"
                                    style={{
                                        backgroundColor: preset.color,
                                        backgroundImage: preset.type === 'dotted'
                                            ? 'radial-gradient(var(--color-base-content) 1.2px, transparent 1.2px)'
                                            : 'none',
                                        backgroundSize: '10px 10px',
                                        opacity: 0.15
                                    }}
                                />
                                {preset.type === 'solid' && (
                                    <div className="absolute inset-0 z-0" style={{ backgroundColor: preset.color }} />
                                )}
                                <span className={`relative z-10 text-[10px] uppercase font-bold tracking-wider ${textClass}`}>
                                    {preset.name}
                                </span>
                            </button>
                        );
                    })}

                    {/* BOTON DE COLOR PERSONALIZADO */}
                    <button
                        type="button"
                        onClick={() => customColorModalRef.current?.open()}
                        className={`relative h-12 rounded-xl border flex items-center justify-center transition-transform overflow-hidden col-span-4 ${isCustomSelected
                            ? 'border-primary ring-2 ring-primary/40 font-semibold'
                            : 'border-base-200 active:bg-base-200'
                            }`}
                    >
                        <div
                            className="absolute inset-0 z-0"
                            style={isCustomSelected ? {
                                backgroundColor: canvasColor
                            } : {
                                background: "conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080, #ff0000)",
                                opacity: 0.15
                            }}
                        />
                        <span className={`relative z-10 text-[10px] uppercase font-bold tracking-wider ${isCustomSelected
                            ? (isLightColor(canvasColor) ? 'text-zinc-800' : 'text-white')
                            : 'text-base-content'
                            }`}>
                            Personalizado
                        </span>
                    </button>
                </div>
            </div>

            {/* SLIDER DE OPACIDAD DEL FONDO */}
            <div className="space-y-2">
                <span className="text-xs text-base-content/60 block">Opacidad de fondo</span>
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        aria-label="Opacidad de fondo"
                        className="range range-primary range-sm flex-1"
                    />
                    <span className="text-xs font-mono font-semibold text-base-content/75 min-w-8 text-right">
                        {opacity}%
                    </span>
                </div>
            </div>

            {/* PREMIUM COLOR PICKER MODAL */}
            <Modal
                ref={customColorModalRef}
                modalTitle="Color de fondo personalizado"
                modalSubtitle="Elige un color de fondo para el lienzo"
                className="max-w-xs"
            >
                <div className="flex flex-col items-center justify-center gap-4 pt-2">
                    <ChromePicker
                        color={canvasColor}
                        onChange={(color) => {
                            setCanvasColor(color.hex);
                            // Mantenemos el tipo sólido para fondos personalizados
                            setBgType('solid');
                        }}
                        disableAlpha={true}
                        className="shadow-none! border! border-base-200! bg-base-100!"
                        styles={{
                            default: {
                                picker: {
                                    boxShadow: 'none',
                                    background: 'transparent',
                                }
                            }
                        }}
                    />

                    {/* INFORMACION DEL COLOR ACTUAL */}
                    <div className="flex items-center gap-3 w-full justify-between bg-base-200/50 p-3 rounded-2xl border border-base-200">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-full border border-base-300 shadow-sm shrink-0" style={{ backgroundColor: canvasColor }} />
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="text-[10px] font-semibold text-base-content/60">Color de fondo</span>
                                <span className="font-mono text-xs font-bold text-base-content truncate max-w-35">
                                    {canvasColor.toUpperCase()}
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
    );
}
