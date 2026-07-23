import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Menu, Pencil, Undo2, Redo2, MoreVertical, Trash2, Download } from "lucide-react";
import DrawerConf from "./DrawerConf";
import Modal from '../Modal';

// HELPER PARA CONVERTIR HEX A RGBA
const hexToRgba = (hex, alpha) => {
    let c = hex.substring(1);
    if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// HELPER PARA OBTENER EL COLOR CON EL ESTILO INCORPORADO EN EL ALFA
const getStyledColor = (colorHex, style) => {
    let r = 0, g = 0, b = 0, alpha = 0.99;

    if (colorHex.startsWith("rgba")) {
        const match = colorHex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            r = parseInt(match[1]);
            g = parseInt(match[2]);
            b = parseInt(match[3]);
            alpha = match[4] !== undefined ? parseFloat(match[4]) : 0.99;
        }
    } else {
        let c = colorHex.substring(1);
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        r = parseInt(c.substring(0, 2), 16);
        g = parseInt(c.substring(2, 4), 16);
        b = parseInt(c.substring(4, 6), 16);
    }

    if (style === 'dashed') alpha = 0.98;
    else if (style === 'dotted') alpha = 0.97;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Drawer = forwardRef((props, ref) => {
    const canvasRef = useRef(null);
    const dropdownRef = useRef(null);
    const extraModal = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !event.target.closest('summary')) {
                dropdownRef.current.removeAttribute('open');
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // CONFIGURACIONES DEL CANVAS
    const [title, setTitle] = useState("Mi dibujo");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState("Mi dibujo");

    const [activeTab, setActiveTab] = useState("draw");
    const [strokeColor, setStrokeColor] = useState("#000000"); // DEAULT NEGRO
    const [strokeWidth, setStrokeWidth] = useState(8);
    const [strokeStyle, setStrokeStyle] = useState("solid");

    const [eraseMode, setEraseMode] = useState(false);
    const [eraserWidth, setEraserWidth] = useState(10);
    const [eraserMode, setEraserMode] = useState("mask");

    const [canvasColor, setCanvasColor] = useState("#ffffff");
    const [bgType, setBgType] = useState("solid");
    const [opacity, setOpacity] = useState(100);

    // ESTADO PARA EL HISTORIAL DEL CANVAS (deshacer y rehacer)
    const [paths, setPaths] = useState([]);
    const [history, setHistory] = useState([]);

    useImperativeHandle(ref, () => ({
        getDrawingData: async () => {
            const dataUrl = await canvasRef.current?.exportImage("png");
            return {
                title,
                dataUrl,
                isEmpty: paths.length === 0
            };
        },
        resetCanvas: () => {
            handleClearCanvas();
            setTitle("Mi dibujo");
        }
    }));

    // HANDELLERS PARA EL TITULO
    const startEditing = () => {
        setTempTitle(title);
        setIsEditingTitle(true);
    };

    const saveTitle = () => {
        if (tempTitle.trim()) {
            setTitle(tempTitle.trim());
        }
        setIsEditingTitle(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            saveTitle();
        } else if (e.key === "Escape") {
            setIsEditingTitle(false);
        }
    };

    // Canvas action handlers
    const handleCanvasChange = (updatedPaths) => {
        setPaths(updatedPaths);

        // Verificamos si los nuevos trazos son un prefijo de la pila de historial existente.
        // Si lo son (caso de deshacer/rehacer), no alteramos la pila completa de historial.
        // Si no lo son (nuevo trazo dibujado), actualizamos la pila completa.
        const isPrefix = updatedPaths.length <= history.length &&
            updatedPaths.every((stroke, i) => JSON.stringify(stroke) === JSON.stringify(history[i]));

        if (!isPrefix) {
            setHistory(updatedPaths);
        }
    };

    const handleExportPNG = async () => {
        try {
            const dataUrl = await canvasRef.current?.exportImage("png");
            if (!dataUrl) return;
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `${title.toLowerCase().replace(/\s+/g, "_")}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting PNG:", error);
        }
    };

    const handleExportSVG = async () => {
        try {
            const svgContent = await canvasRef.current?.exportSvg();
            if (!svgContent) return;
            const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${title.toLowerCase().replace(/\s+/g, "_")}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting SVG:", error);
        }
    };

    const handleClearCanvas = () => {
        canvasRef.current?.clearCanvas();
        setCanvasColor("#ffffff")
        setHistory([]);
    };

    // FUNCION PARA OBTENER EL COLOR DE FONDO CON OPACIDAD
    const canvasBgColor = hexToRgba(canvasColor, opacity / 100);

    return (
        <div className="not-prose flex flex-col gap-4 w-full">
            {/* ESTILOS PARA PERSONALIZAR LA LINEA POR ATRIBUTO DE COLOR DE TRAZO */}
            <style dangerouslySetInnerHTML={{
                __html: `
                svg path[stroke*="0.98"] {
                    stroke-dasharray: 8, 8 !important;
                }
                svg path[stroke*="0.97"] {
                    stroke-dasharray: 2, 6 !important;
                    stroke-linecap: round !important;
                }
            ` }} />

            {/* HEADER CONTROLS */}
            <div className="flex items-center justify-between px-3 py-2 bg-base-100 rounded-2xl border border-base-200 shadow-sm min-h-14">
                <div className="flex items-center gap-1">
                    <button type="button" className="btn btn-ghost btn-circle btn-sm" onClick={() => extraModal.current?.open()} aria-label="Menú de opciones">
                        <Menu className="w-5 h-5 text-base-content/70" />
                    </button>
                    {isEditingTitle ? (
                        <input className="input input-sm input-ghost font-bold text-base w-32 focus:outline-hidden border-b border-primary rounded-none p-0 h-8"
                            type="text"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            aria-label="Título del dibujo"
                        />
                    ) : (
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-base text-base-content/90 truncate max-w-35">
                                {title}
                            </span>
                            <button
                                type="button"
                                onClick={startEditing}
                                className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-primary active:scale-95"
                                aria-label="Editar título"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-0.5">
                    <button
                        type="button"
                        onClick={() => canvasRef.current?.undo()}
                        disabled={paths.length === 0}
                        className="btn btn-ghost btn-circle btn-sm disabled:opacity-40 disabled:bg-transparent"
                        title="Deshacer"
                    >
                        <Undo2 className="w-5 h-5 text-base-content/80" />
                    </button>
                    <button
                        type="button"
                        onClick={() => canvasRef.current?.redo()}
                        className="btn btn-ghost btn-circle btn-sm"
                        title="Rehacer"
                    >
                        <Redo2 className="w-5 h-5 text-base-content/80" />
                    </button>

                    {/* DROPDOWN MENU PARA EXPORTAR Y LIMPIAR */}
                    <details ref={dropdownRef} className="dropdown dropdown-end">
                        <summary className="btn btn-ghost btn-circle btn-sm list-none select-none outline-none [&::-webkit-details-marker]:hidden" aria-label="Más opciones">
                            <MoreVertical className="w-5 h-5 text-base-content/80" />
                        </summary>
                        <ul className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-2xl w-48 z-30 border border-base-200 mt-1">
                            <li>
                                <button type="button" onClick={handleExportPNG} className="flex items-center gap-2 py-2 px-3 text-xs font-semibold">
                                    <Download className="w-4 h-4" /> Exportar PNG
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={handleExportSVG} className="flex items-center gap-2 py-2 px-3 text-xs font-semibold">
                                    <Download className="w-4 h-4" /> Exportar SVG
                                </button>
                            </li>
                            <div className="divider my-1"></div>
                            <li>
                                <button type="button" onClick={handleClearCanvas} className="flex items-center gap-2 py-2 px-3 text-xs text-error font-semibold">
                                    <Trash2 className="w-4 h-4" /> Limpiar lienzo
                                </button>
                            </li>
                        </ul>
                    </details>
                </div>
            </div>

            {/* CANVAS WORKSPACE CONTAINER */}
            <div className="relative rounded-3xl border border-base-200 overflow-hidden shadow-md aspect-square w-full max-w-full bg-base-100" >
                {/* ESTILO PARA EL FONDO DOTTED */}
                {bgType === "dotted" && (
                    <div className="absolute inset-0 pointer-events-none z-10" style={{
                        backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.15) 1.2px, transparent 1.2px)",
                        backgroundSize: "16px 16px"
                    }} />
                )}

                {/* CANVAS CON SUS ESTILOS SEGUN EL STROKESTYLE */}
                <ReactSketchCanvas
                    ref={canvasRef}
                    onChange={handleCanvasChange}
                    strokeWidth={strokeWidth}
                    strokeColor={getStyledColor(strokeColor, strokeStyle)}
                    eraserWidth={eraserWidth}
                    eraserMode={eraserMode}
                    canvasColor={canvasBgColor}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>

            {/* CONFIGURATION PANEL */}
            <DrawerConf
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                strokeColor={strokeColor}
                setStrokeColor={setStrokeColor}
                strokeWidth={strokeWidth}
                setStrokeWidth={setStrokeWidth}
                strokeStyle={strokeStyle}
                setStrokeStyle={setStrokeStyle}
                eraseMode={eraseMode}
                setEraseMode={setEraseMode}
                eraserWidth={eraserWidth}
                setEraserWidth={setEraserWidth}
                eraserMode={eraserMode}
                setEraserMode={setEraserMode}
                canvasColor={canvasColor}
                setCanvasColor={setCanvasColor}
                bgType={bgType}
                setBgType={setBgType}
                opacity={opacity}
                setOpacity={setOpacity}
                paths={paths}
                history={history}
                setHistory={setHistory}
                canvasRef={canvasRef}
                handleExportPNG={handleExportPNG}
                handleExportSVG={handleExportSVG}
                handleClearCanvas={handleClearCanvas}
            />

            <Modal ref={extraModal} modalTitle="Funciones extra" modalSubtitle="Aqui iran futuras funciones extra no importantes">
                pssss aun no hay nada aca
            </Modal>
        </div>

    );
});

export default Drawer;