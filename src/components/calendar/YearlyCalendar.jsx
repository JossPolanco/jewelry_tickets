import React from "react";
import { ChevronLeft, ChevronRight, CalendarRange } from "lucide-react";

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export default function YearlyCalendar({ currentDate, setCurrentDate, onViewMonth }) {
    const year = currentDate.getFullYear();

    // Helper to generate the 42 cells for a given month index
    const generateMonthCells = (monthIndex) => {
        const startDay = new Date(year, monthIndex, 1).getDay();
        const startDayOffset = startDay === 0 ? 6 : startDay - 1;
        const totalDays = new Date(year, monthIndex + 1, 0).getDate();
        const prevMonthTotalDays = new Date(year, monthIndex, 0).getDate();

        const cells = [];

        // Previous month trailing days
        for (let i = startDayOffset - 1; i >= 0; i--) {
            cells.push({
                day: prevMonthTotalDays - i,
                isCurrentMonth: false,
                date: new Date(year, monthIndex - 1, prevMonthTotalDays - i),
            });
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            cells.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, monthIndex, i),
            });
        }

        // Next month leading days
        const remaining = 42 - cells.length;
        for (let i = 1; i <= remaining; i++) {
            cells.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, monthIndex + 1, i),
            });
        }

        return cells;
    };

    const today = new Date();
    const isToday = (date) =>
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

    const handlePrevYear = () => {
        setCurrentDate(new Date(year - 1, currentDate.getMonth(), 1));
    };

    const handleNextYear = () => {
        setCurrentDate(new Date(year + 1, currentDate.getMonth(), 1));
    };

    const handleGoToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="w-full bg-base-100/40 dark:bg-base-950/15 backdrop-blur-md rounded-3xl border border-base-200/80 dark:border-base-800/40 p-6 shadow-xl animate-fade-in">
            {/* Yearly Calendar Header */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                        <CalendarRange className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-xl text-base-content tracking-tight leading-tight">
                            Anual
                        </h3>
                        <span className="text-xs text-base-content/50 font-semibold">{year}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-ghost btn-sm rounded-xl font-bold text-xs px-3 border border-base-200 dark:border-base-800/60 active:bg-base-200/50 md:hover:bg-base-200/50 text-base-content/80 active:text-secondary md:hover:text-secondary  transition-transform duration-200"
                        onClick={handleGoToday}
                    >
                        Hoy
                    </button>
                    <div className="join border border-base-200 dark:border-base-800/60 rounded-xl overflow-hidden">
                        <button type="button" className="btn btn-ghost btn-sm join-item px-2.5 active:bg-base-200/50 md:hover:bg-base-200/50 text-base-content/75 active:text-secondary md:hover:text-secondary "
                            onClick={handlePrevYear}
                            aria-label="Año anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm join-item px-2.5 active:bg-base-200/50 md:hover:bg-base-200/50 text-base-content/75 active:text-secondary md:hover:text-secondary "
                            onClick={handleNextYear}
                            aria-label="Año siguiente"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MONTH_NAMES.map((monthName, monthIndex) => {
                    const cells = generateMonthCells(monthIndex);
                    const isCurrentMonthOfToday = today.getFullYear() === year && today.getMonth() === monthIndex;

                    return (
                        <button type="button" className="group text-left w-full p-4 bg-base-100/50 dark:bg-base-900/10 rounded-2xl border border-base-200/60 dark:border-base-800/30 hover:border-secondary/40 dark:hover:border-secondary/30 transition-transform duration-300 hover:shadow-md cursor-pointer select-none active:scale-[0.98]"
                            key={monthName}
                            onClick={() => onViewMonth(new Date(year, monthIndex, 1))}
                        >
                            {/* Month title */}
                            <h4 className={`text-sm font-extrabold mb-3  ${isCurrentMonthOfToday
                                ? "text-secondary font-black"
                                : "text-base-content group-hover:text-secondary"
                                }`}>
                                {monthName}
                            </h4>

                            {/* Mini weekdays */}
                            <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
                                {WEEKDAYS.map((day, dIdx) => (
                                    <span className="text-[9px] font-bold text-base-content/30 uppercase" key={`${day}-${dIdx}`}>
                                        {day}
                                    </span>
                                ))}
                            </div>

                            {/* Mini 42 days grid */}
                            <div className="grid grid-cols-7 gap-0.5">
                                {cells.map((cell, cIdx) => {
                                    const isCellToday = isToday(cell.date);

                                    return (
                                        <div key={`${cell.date.getTime()}-${cIdx}`}
                                            className={`aspect-square w-full rounded-md flex items-center justify-center text-[10px] font-semibold ${cell.isCurrentMonth ? "text-base-content" : "text-base-content/20 font-normal"
                                                } ${isCellToday ? "bg-secondary! text-secondary-content! font-bold rounded-md" : ""}`}
                                        >
                                            {cell.day}
                                        </div>
                                    );
                                })}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
