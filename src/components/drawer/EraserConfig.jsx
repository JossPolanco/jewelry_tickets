export default function EraserConfig({ eraserWidth, setEraserWidth, eraserMode, setEraserMode, }) {
    return (
        <div className="space-y-4 animate-fade-in w-full text-left">
            <h3 className="text-sm font-bold text-base-content/85">Herramienta de borrado</h3>

            {/* TAMÑO DEL BORRADOR PRESETS */}
            <div className="space-y-2">
                <span className="text-xs text-base-content/60 block">Tamañito del borrador</span>
                <div className="flex items-center gap-3">
                    {[5, 10, 15, 25].map((sz) => (
                        <button
                            key={sz}
                            type="button"
                            onClick={() => setEraserWidth(sz)}
                            aria-label={`Tamaño del borrador ${sz} px`}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl border transition-transform transform active:scale-110 ease-in-out ${eraserWidth === sz
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-base-200 text-base-content/70 active:bg-base-200'
                                }`}
                        >
                            <span
                                className="rounded-full bg-current"
                                style={{ width: `${Math.min(sz + 2, 22)}px`, height: `${Math.min(sz + 2, 22)}px` }}
                            />
                        </button>
                    ))}
                    <div className="flex-1 min-w-20">
                        <input
                            type="range"
                            min="1"
                            max="40"
                            value={eraserWidth}
                            onChange={(e) => setEraserWidth(Number(e.target.value))}
                            aria-label="Tamaño del borrador"
                            className="range range-primary range-sm w-full"
                        />
                    </div>
                    <span className="text-xs font-mono font-semibold text-base-content/75 min-w-8 text-right">
                        {eraserWidth} px
                    </span>
                </div>
            </div>

            {/* TIPO DE BORRADO */}
            <div className="space-y-2">
                <span className="text-xs text-base-content/60 block">Tipo de borrado</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setEraserMode('mask');
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-transform min-h-11 transform active:scale-90 ease-in-out ${eraserMode === 'mask'
                            ? 'border-primary bg-primary/5 text-primary font-semibold'
                            : 'border-base-200 text-base-content/70 active:bg-base-200'
                            }`}
                    >
                        Borrador parcial
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setEraserMode('stroke');
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium transition-transform min-h-11 transform active:scale-90 ease-in-out ${eraserMode === 'stroke'
                            ? 'border-primary bg-primary/5 text-primary font-semibold'
                            : 'border-base-200 text-base-content/70 active:bg-base-200'
                            }`}
                    >
                        Borrar trazo entero
                    </button>
                </div>
            </div>
        </div>
    );
}
