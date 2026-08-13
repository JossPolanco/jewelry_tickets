import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const POSITIONS = {
    'top-center': 'fixed top-6 left-1/2 -translate-x-1/2 z-[99999]',
    'top-start': 'fixed top-6 left-6 z-[99999]',
    'top-end': 'fixed top-6 right-6 z-[99999]',
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999]',
    'bottom-start': 'fixed bottom-6 left-6 z-[99999]',
    'bottom-end': 'fixed bottom-6 right-6 z-[99999]',
};

const TYPES = {
    info: 'alert alert-info',
    success: 'alert alert-success text-white',
    warning: 'alert alert-warning',
    error: 'alert alert-error text-white',
};

export default function Toast({ message, position = 'top-center', type = 'info' }) {
    const toastRef = useRef(null);
    const posClass = POSITIONS[position] || POSITIONS['top-center'];
    const typeClass = TYPES[type] || TYPES.info;

    useEffect(() => {
        const el = toastRef.current;
        if (el && typeof el.showPopover === 'function') {
            try {
                el.showPopover();
            } catch {
                // Si ya está mostrando o no soporta popover, ignorar silenciosamente
            }
        }
    }, [message]);

    const content = (
        <div
            ref={toastRef}
            popover="manual"
            className={`${posClass} pointer-events-auto`}
            style={{
                margin: 0,
                inset: 'auto',
                background: 'transparent',
                border: 'none',
                padding: 0,
                overflow: 'visible',
            }}
        >
            <div className={`${typeClass} shadow-2xl border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3 animate-fade-in`}>
                <span className="font-semibold text-sm">{message}</span>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}

