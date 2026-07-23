import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

const ICON_MAP = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger: AlertCircle,
    error: AlertCircle,
};

const VARIANT_CLASSES = {
    info: 'alert-info',
    success: 'alert-success',
    warning: 'alert-warning',
    danger: 'alert-error',
    error: 'alert-error',
};

const Alert = forwardRef(function Alert(
    {
        isOpen: controlledIsOpen,
        onClose,
        type = 'info',
        position = 'center',
        title,
        message,
        children,
        actions,
        buttons,
        showCloseButton = true,
        className = '',
    },
    ref
) {
    const [imperativeState, setImperativeState] = useState(null);

    useImperativeHandle(ref, () => ({
        open: (options = {}) => {
            setImperativeState({
                isOpen: true,
                ...options,
            });
        },
        close: () => {
            setImperativeState(null);
            if (onClose) onClose();
        },
    }));

    const isImperative = imperativeState !== null;
    const activeIsOpen = isImperative ? imperativeState.isOpen : controlledIsOpen;

    if (!activeIsOpen) return null;

    const activeType = isImperative && imperativeState.type ? imperativeState.type : type;
    const activePosition = isImperative && imperativeState.position ? imperativeState.position : position;
    const activeTitle = isImperative && imperativeState.title !== undefined ? imperativeState.title : title;
    const activeMessage = isImperative && imperativeState.message !== undefined ? imperativeState.message : message;
    const activeActions = isImperative && imperativeState.actions !== undefined ? imperativeState.actions : (actions || buttons);
    const activeShowClose = isImperative && imperativeState.showCloseButton !== undefined ? imperativeState.showCloseButton : showCloseButton;
    const activeClassName = isImperative && imperativeState.className ? imperativeState.className : className;

    const IconComponent = ICON_MAP[activeType] || ICON_MAP.info;
    const variantClass = VARIANT_CLASSES[activeType] || VARIANT_CLASSES.info;

    const handleClose = () => {
        if (isImperative) {
            setImperativeState(null);
        }
        if (onClose) {
            onClose();
        }
    };

    const positionClasses = activePosition === 'top'
        ? 'items-start justify-center pt-6 sm:pt-10 px-4'
        : 'items-center justify-center p-4';

    return (
        <div
            className={`fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in ${positionClasses}`}
            onClick={handleClose}
            role="presentation"
        >
            <div
                role="alert"
                className={`alert ${variantClass} shadow-2xl max-w-lg w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-base-content/10 animate-scale-in ${activeClassName}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <IconComponent className="h-6 w-6 shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex flex-col text-left overflow-hidden">
                        {activeTitle && (
                            <h5 className="font-semibold text-base leading-snug wrap-break-words">
                                {activeTitle}
                            </h5>
                        )}
                        {(activeMessage || children) && (
                            <div className="text-sm opacity-90 wrap-break-words">
                                {activeMessage || children}
                            </div>
                        )}
                    </div>
                </div>

                {(activeActions || activeShowClose) && (
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-2 sm:mt-0">
                        {activeActions}
                        {activeShowClose && (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn btn-sm btn-ghost btn-circle text-current hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                aria-label="Cerrar alerta"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

export default Alert;
