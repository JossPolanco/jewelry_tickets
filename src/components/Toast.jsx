const POSITIONS = {
    'top-center': 'fixed top-6 left-1/2 -translate-x-1/2 z-[9999]',
    'top-start': 'fixed top-6 left-6 z-[9999]',
    'top-end': 'fixed top-6 right-6 z-[9999]',
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]',
    'bottom-start': 'fixed bottom-6 left-6 z-[9999]',
    'bottom-end': 'fixed bottom-6 right-6 z-[9999]',
};

const TYPES = {
    info: 'alert alert-info',
    success: 'alert alert-success text-white',
    warning: 'alert alert-warning',
    error: 'alert alert-error text-white',
};

export default function Toast({ message, position = 'top-center', type = 'info' }) {
    const posClass = POSITIONS[position] || POSITIONS['top-center'];
    const typeClass = TYPES[type] || TYPES.info;

    return (
        <div className={posClass}>
            <div className={`${typeClass} shadow-2xl border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-3 animate-fade-in`}>
                <span className="font-semibold text-sm">{message}</span>
            </div>
        </div>
    );
}
