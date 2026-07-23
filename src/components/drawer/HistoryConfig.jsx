import { Undo, Redo } from 'lucide-react';

export default function HistoryConfig({ paths, history = [], canvasRef, canvasColor }) {
    // HELPER PARA RENDERIZAR MINI SVG THUMBNAILS DE TRAZOS
    const renderHistoryThumbnail = (strokeSlice) => {
        return (
            <svg viewBox="0 0 400 400" className="w-full h-full object-contain" style={{ backgroundColor: canvasColor }}>
                {strokeSlice.map((stroke, index) => {
                    const d = stroke.paths.reduce((acc, point, i) => {
                        return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
                    }, "");

                    const color = stroke.eraser ? canvasColor : stroke.strokeColor;

                    return (
                        <path
                            key={index}
                            d={d}
                            stroke={color}
                            strokeWidth={stroke.strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    );
                })}
            </svg>
        );
    };

    // CARGA TRAZOS A UN INDICE ESPECIFICO
    const handleJumpToHistory = (index) => {
        const sliced = history.slice(0, index + 1);
        canvasRef.current?.clearCanvas();
        canvasRef.current?.loadPaths(sliced);
    };

    return (
        <div className="space-y-4 animate-fade-in w-full text-left">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-base-content/85">Historial (Deshacer/Rehacer)</h3>
                <span className="text-xs text-base-content/50 font-mono">
                    {history.length} {history.length === 1 ? 'trazo' : 'trazos'}
                </span>
            </div>

            {/* BOTONES DESHACER/REHACER */}
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => canvasRef.current?.undo()}
                    className="flex-1 btn btn-primary btn-sm rounded-xl min-h-11 flex items-center justify-center gap-2 text-xs transform active:scale-90 ease-in-out "
                >
                    <Undo className="w-4 h-4" />
                    Deshacer
                </button>
                <button
                    type="button"
                    onClick={() => canvasRef.current?.redo()}
                    className="flex-1 btn btn-primary btn-sm rounded-xl min-h-11 flex items-center justify-center gap-2 text-xs transform active:scale-90 ease-in-out "
                >
                    <Redo className="w-4 h-4" />
                    Rehacer
                </button>
            </div>

            {/* STROKE TIMELINE REPRESENTANDO VISUAL UNDO STATES*/}
            {history.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-base-200">
                    <span className="text-xs text-base-content/60 block">Linecita de tiempo de trazitos</span>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {history.map((stroke, index) => {
                            const isActive = index === paths.length - 1;
                            return (
                                <button
                                    key={stroke?.id || stroke?.timestamp || `history-step-${index}`}
                                    type="button"
                                    onClick={() => handleJumpToHistory(index)}
                                    className={`shrink-0 w-16 h-16 rounded-lg border overflow-hidden relative active:scale-95 bg-base-100 flex items-center justify-center transition-transform ${isActive
                                            ? 'border-primary ring-2 ring-primary/40 font-semibold'
                                            : 'border-base-200'
                                        }`}
                                >
                                    {renderHistoryThumbnail(history.slice(0, index + 1))}
                                    <div className={`absolute bottom-0 right-0 px-1 text-[8px] font-mono ${isActive ? 'bg-primary text-primary-content' : 'bg-base-300/80 text-base-content'
                                        }`}>
                                        #{index + 1}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <span className="text-[10px] text-base-content/50 block italic">Haz clic en un trazo anterior para saltar directamente a ese punto del historial.</span>
                </div>
            ) : (
                <div className="text-center py-4 text-xs text-base-content/40">
                    Dibuja algo en el lienzo para ver el historial
                </div>
            )}
        </div>
    );
}
