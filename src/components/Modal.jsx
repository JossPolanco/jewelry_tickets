import React, { forwardRef, useId, useImperativeHandle, useRef } from 'react';

const Modal = forwardRef(function Modal({ className = '', modalTitle, modalSubtitle, children, footer }, ref) {
    const dialogRef = useRef(null);
    const titleId = useId();

    useImperativeHandle(ref, () => ({
        open: () => dialogRef.current?.showModal(),
        close: () => dialogRef.current?.close(),
    }));

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={modalTitle ? titleId : undefined}
            aria-label={modalTitle ? undefined : "Modal dialog"}
            className="modal items-center justify-center p-2 sm:p-4 backdrop:bg-black/60 z-50"
        >
            <div className={`modal-box w-full sm:w-11/12 max-w-5xl max-h-[78dvh] sm:max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl border border-base-300/60 bg-base-100 p-0 shadow-2xl overflow-hidden m-auto ${className}`}>
                {/* Header Fijo */}
                <div className="flex items-center justify-between w-full px-4 sm:px-6 py-3 sm:py-3.5 border-b border-base-200 shrink-0 bg-base-100 z-10">   
                    <div className="pr-2 space-y-0.5 min-w-0">
                        {modalTitle && (
                            <h4 id={titleId} className="text-sm sm:text-base font-bold text-base-content leading-tight truncate">
                                {modalTitle}
                            </h4>
                        )}
                        {modalSubtitle && (
                            <p className="text-[11px] sm:text-xs text-base-content/60 leading-tight truncate">
                                {modalSubtitle}
                            </p>
                        )}
                    </div>
                    <form method="dialog" className="shrink-0 ml-2">
                        <button 
                            type="submit" 
                            className="btn btn-xs sm:btn-sm btn-circle btn-ghost text-base-content/60 hover:text-base-content hover:bg-base-200 transition-colors"
                            aria-label="Cerrar modal"
                        >
                            ✕
                        </button>
                    </form>
                </div>

                {/* Cuerpo Desplazable */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
                    {children}
                </div>

                {/* Footer Fijo si es provisto */}
                {footer && (
                    <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-base-200 bg-base-100 shrink-0 z-10">
                        {footer}
                    </div>
                )}
            </div>
        </dialog>
    );
});

export default Modal;
