import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const POSITION_STYLES = {
    'top-center': {
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
    },
    'top-start': {
        position: 'fixed',
        top: '1.5rem',
        left: '1.5rem',
        zIndex: 99999,
    },
    'top-end': {
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 99999,
    },
    'bottom-center': {
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
    },
    'bottom-start': {
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        zIndex: 99999,
    },
    'bottom-end': {
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 99999,
    },
};

const TYPES = {
    info: 'alert alert-info',
    success: 'alert alert-success text-white',
    warning: 'alert alert-warning',
    error: 'alert alert-error text-white',
};

export default function Toast({ message, position = 'top-center', type = 'info' }) {
    const toastRef = useRef(null);
    const posStyle = POSITION_STYLES[position] || POSITION_STYLES['top-center'];
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
            style={{
                margin: 0,
                inset: 'auto',
                background: 'transparent',
                border: 'none',
                padding: 0,
                overflow: 'visible',
                pointerEvents: 'auto',
                ...posStyle,
            }}
        >
            <div className={`${typeClass} shadow-2xl border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3 animate-fade-in`}>
                <span className="font-semibold text-sm">{message}</span>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}

