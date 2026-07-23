export default function FabAdd({ onClick, ...props }) {
    return (
        <div className="fixed bottom-16 right-4 z-50">
            <button className="btn btn-lg btn-circle btn-primary shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer select-none active:scale-98"
                type="button"
                onClick={onClick}
                {...props}
            >
                <svg aria-label="New" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </div>
    )
}
