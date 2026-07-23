import { Pencil, Eraser, Palette, Paintbrush, History, Download } from 'lucide-react';
import BackgroundConfig from './BackgroundConfig';
import HistoryConfig from './HistoryConfig';
import EraserConfig from './EraserConfig';
import BrushConfig from './BrushConfig';
import ColorConfig from './ColorConfig';
import SaveConfig from './SaveConfig';

export default function DrawerConf({
    activeTab,
    setActiveTab,
    strokeColor,
    setStrokeColor,
    strokeWidth,
    setStrokeWidth,
    strokeStyle,
    setStrokeStyle,
    eraseMode,
    setEraseMode,
    eraserWidth,
    setEraserWidth,
    eraserMode,
    setEraserMode,
    canvasColor,
    setCanvasColor,
    bgType,
    setBgType,
    opacity,
    setOpacity,
    paths,
    history,
    setHistory,
    canvasRef,
    handleExportPNG,
    handleExportSVG,
    handleClearCanvas
}) {
    return (
        <div className="w-full space-y-4 animate-slide-up">
            {/* TOOL SELECTOR CARD */}
            <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-2">
                <div className="grid grid-cols-6 gap-1">
                    {/* Dibujar */}
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('draw');
                            setEraseMode(false);
                            canvasRef.current?.eraseMode(false);
                        }}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-transform duration-200 min-h-12.5 transform active:scale-110 ease-in-out ${activeTab === 'draw'
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-base-content/60 active:bg-base-200'
                            }`}
                    >
                        <Pencil className="w-5 h-5 mb-1" />
                        <span className="text-[10px] tracking-wide font-medium">Dibujar</span>
                    </button>

                    {/* Borrar */}
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('erase');
                            setEraseMode(true);
                            canvasRef.current?.eraseMode(true);
                        }}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-transform duration-200 min-h-12.5 transform active:scale-110 ease-in-out ${activeTab === 'erase'
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-base-content/60 active:bg-base-200'
                            }`}
                    >
                        <Eraser className="w-5 h-5 mb-1" />
                        <span className="text-[10px] tracking-wide font-medium">Borrar</span>
                    </button>

                    {/* Color */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('color')}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-transform duration-200 min-h-12.5 transform active:scale-110 ease-in-out ${activeTab === 'color'
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-base-content/60 active:bg-base-200'
                            }`}
                    >
                        <Palette className="w-5 h-5 mb-1" />
                        <span className="text-[10px] tracking-wide font-medium">Color</span>
                    </button>

                    {/* Fondo */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('background')}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-transform duration-200 min-h-12.5 transform active:scale-110 ease-in-out ${activeTab === 'background'
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-base-content/60 active:bg-base-200'
                            }`}
                    >
                        <Paintbrush className="w-5 h-5 mb-1" />
                        <span className="text-[10px] tracking-wide font-medium">Fondo</span>
                    </button>

                    {/* Historial */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-transform duration-200 min-h-12.5 transform active:scale-110 ease-in-out ${activeTab === 'history'
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-base-content/60 active:bg-base-200'
                            }`}
                    >
                        <History className="w-5 h-5 mb-1" />
                        <span className="text-[10px] tracking-wide font-medium">Historial</span>
                    </button>

                    {/* Guardar */}
                    <button
                        type="button"
                        onClick={() => setActiveTab('save')}
                        className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-transform duration-200 min-h-12.5 transform active:scale-110 ease-in-out  ${activeTab === 'save'
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-base-content/60 active:bg-base-200'
                            }`}
                    >
                        <Download className="w-5 h-5 mb-1" />
                        <span className="text-[10px] tracking-wide font-medium">Guardar</span>
                    </button>
                </div>
            </div>

            {/* DYNAMIC SETTINGS CARD */}
            <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl p-4 min-h-40 flex flex-col justify-center">
                {activeTab === 'draw' && (
                    <BrushConfig
                        strokeWidth={strokeWidth}
                        setStrokeWidth={setStrokeWidth}
                        strokeStyle={strokeStyle}
                        setStrokeStyle={setStrokeStyle}
                        strokeColor={strokeColor}
                        setStrokeColor={setStrokeColor}
                    />
                )}

                {activeTab === 'erase' && (
                    <EraserConfig
                        eraserWidth={eraserWidth}
                        setEraserWidth={setEraserWidth}
                        eraserMode={eraserMode}
                        setEraserMode={setEraserMode}
                    />
                )}

                {activeTab === 'color' && (
                    <ColorConfig
                        strokeColor={strokeColor}
                        setStrokeColor={setStrokeColor}
                    />
                )}

                {activeTab === 'background' && (
                    <BackgroundConfig
                        canvasColor={canvasColor}
                        setCanvasColor={setCanvasColor}
                        bgType={bgType}
                        setBgType={setBgType}
                        opacity={opacity}
                        setOpacity={setOpacity}
                    />
                )}

                {activeTab === 'history' && (
                    <HistoryConfig
                        paths={paths}
                        history={history}
                        canvasRef={canvasRef}
                        canvasColor={canvasColor}
                    />
                )}

                {activeTab === 'save' && (
                    <SaveConfig
                        handleExportPNG={handleExportPNG}
                        handleExportSVG={handleExportSVG}
                        handleClearCanvas={handleClearCanvas}
                    />
                )}
            </div>
        </div>
    );
}
