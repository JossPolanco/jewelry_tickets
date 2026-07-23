import { getUserProfile } from "@/services/user/userService";
import { getMoodsByGender } from "@/utils/getMoods";
import { useQuery } from "@tanstack/react-query";

export default function MoodSelector({ value, onChange, selectedMood, onSelectMood, label, error, disabled = false }) {
    const activeValue = value !== undefined ? value : selectedMood;
    const handleSelect = onChange || onSelectMood;

    const { data: profile, isLoading } = useQuery({
        queryKey: ["userProfile"],
        queryFn: getUserProfile,
    });

    const moods = getMoodsByGender(profile?.gender);

    return (
        <div className="form-control w-full">
            {label && (
                <label className="label mb-1.5 justify-start">
                    <span className="label-text font-medium text-base-content/85">{label}</span>
                </label>
            )}

            {isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full animate-pulse">
                    {Array.from({ length: 10 }).map((_, idx) => (
                        <div key={idx} className="h-24 bg-base-200/60 dark:bg-base-800/40 rounded-2xl" />
                    ))}
                </div>
            ) : (
                <div
                    role="radiogroup"
                    aria-label={label || "Seleccionar estado de ánimo"}
                    className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 w-full"
                >
                    {moods.map((mood) => {
                        const isSelected = activeValue ? activeValue.toString().toLowerCase() === mood.title.toLowerCase() : false;
                        return (
                            <button
                                key={mood.title}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                disabled={disabled}
                                onClick={() => handleSelect && handleSelect(mood.title.toLowerCase())}
                                className={`
                                    flex flex-col items-center justify-center py-3 px-1 rounded-2xl border
                                    transition-transform duration-200 min-h-24 focus:outline-none 
                                    active:scale-95
                                    ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
                                    ${isSelected
                                        ? `${mood.className || 'border-primary bg-primary/10 text-primary'} ring-2 ring-primary/30 shadow-xs font-bold scale-[1.02]`
                                        : 'border-base-200/90 dark:border-base-800 bg-base-100/80 dark:bg-base-900/30 text-base-content/75 md:hover:border-base-300 dark:md:hover:border-base-750 md:hover:bg-base-200/40'
                                    }
                                    ${error && !isSelected ? 'border-error/60 dark:border-error/40' : ''}
                                `}
                            >
                                <div className={`w-10 h-10 flex items-center justify-center mb-1.5 transition-transform duration-200 ${isSelected ? 'scale-110' : ''}`}>
                                    {mood.photo ? (
                                        <img
                                            src={mood.photo}
                                            alt={mood.title}
                                            className="w-10 h-10 object-contain drop-shadow-xs select-none"
                                        />
                                    ) : (
                                        <span className="text-2xl select-none" role="img" aria-label={mood.title}>
                                            {mood.emoji}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] sm:text-xs font-semibold tracking-wide text-center truncate w-full px-1 select-none ${isSelected ? 'font-bold' : ''}`}>
                                    {mood.title}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {error && (
                <label className="label mt-1 animate-fade-in">
                    <span className="label-text-alt text-error font-medium">{error}</span>
                </label>
            )}
        </div>
    );
}

