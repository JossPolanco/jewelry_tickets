import React, { forwardRef, useId, useImperativeHandle, useRef } from 'react';

const Modal = forwardRef(function Modal({ className, modalTitle, modalSubtitle, children }, ref) {
    const dialogRef = useRef(null);
    const titleId = useId();

    useImperativeHandle(ref, () => ({
        open: () => dialogRef.current.showModal(),
        close: () => dialogRef.current.close(),
    }))

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={modalTitle ? titleId : undefined}
            aria-label={modalTitle ? undefined : "Modal dialog"}
            className="modal sm:modal-middle"
        >
            <div className={`modal-box w-11/12 max-w-5xl rounded-3xl border border-base-300/60 bg-base-100/95 p-0 shadow-2xl backdrop-blur ${className}`}>
                <div className="flex justify-between items-center w-full px-4 pt-2">   
                    <h4 id={titleId} className="text-lg font-semibold ml-2.5">{modalTitle}</h4>
                    <form method="dialog">
                        <button type="submit" className="btn btn-sm btn-circle btn-soft btn-error animate-pulse">✕</button>
                    </form>
                </div>
                <div className="px-6 pb-6 pt-1">
                        {modalSubtitle ? (
                            <p className="text-sm text-base-content/70 pb-6">{modalSubtitle}</p>
                        ) : null}
                    {children}
                </div>
            </div>
        </dialog>
    );
});

export default Modal;