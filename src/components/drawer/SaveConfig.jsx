import { Trash2 } from 'lucide-react';

export default function SaveConfig({ handleExportPNG, handleExportSVG, handleClearCanvas, }) {
    return (
        <div className="space-y-4 animate-fade-in w-full text-left">
            <h3 className="text-sm font-bold text-base-content/85">Guardar boceto</h3>

            <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-primary rounded-xl min-h-11 text-xs font-semibold" type="button" onClick={handleExportPNG}>
                    Exportar PNG
                </button>
                <button className="btn btn-outline rounded-xl min-h-11 text-xs font-semibold" type="button" onClick={handleExportSVG}>
                    Exportar SVG
                </button>
            </div>

            <button type="button" onClick={handleClearCanvas} className="w-full btn btn-error btn-outline rounded-xl min-h-11 text-xs font-semibold flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                Limpiar todo
            </button>
        </div>
    );
}
