"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatDatePtBr(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("pt-BR");
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return date >= start && date <= end;
}

export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Selecione uma data",
  minDate,
  maxDate,
  disabled = false,
  error,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    calculatePosition();
    setViewDate(value || new Date());
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelectDate = (date: Date) => {
    onChange(date);
    handleClose();
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        calendarRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !calendarRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isSelected = value && isSameDay(date, value);
      const isToday = isSameDay(date, today);
      const isDisabled =
        (minDate && date < minDate) || (maxDate && date > maxDate);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleSelectDate(date)}
          disabled={isDisabled}
          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
            isSelected
              ? "bg-blue-600 text-white"
              : isToday
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : isDisabled
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className={`flex items-center gap-2 w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
          disabled
            ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
            : "bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
        } ${
          error
            ? "border-red-500"
            : "border-gray-300 dark:border-gray-600"
        }`}
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span
          className={`flex-1 text-sm ${
            value ? "text-gray-900 dark:text-gray-100" : "text-gray-400"
          }`}
        >
          {value ? formatDatePtBr(value) : placeholder}
        </span>
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={calendarRef}
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
            style={{ top: coords.top, left: coords.left }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {MONTHS_PT[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_PT.map((day) => (
                <div
                  key={day}
                  className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

            {/* Today button */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handleSelectDate(new Date())}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Hoje
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (range: { start: Date | null; end: Date | null }) => void;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  label,
  minDate,
  maxDate,
  disabled = false,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(startDate || new Date());
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState<Date | null>(startDate);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    calculatePosition();
    setViewDate(startDate || new Date());
    setTempStart(startDate);
    setSelecting("start");
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSelectDate = (date: Date) => {
    if (selecting === "start") {
      setTempStart(date);
      setSelecting("end");
    } else {
      if (tempStart && date < tempStart) {
        onChange({ start: date, end: tempStart });
      } else {
        onChange({ start: tempStart, end: date });
      }
      handleClose();
    }
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        calendarRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !calendarRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isStart = tempStart && isSameDay(date, tempStart);
      const isEnd = endDate && isSameDay(date, endDate);
      const inRange = isDateInRange(date, tempStart || startDate, endDate);
      const isDisabled =
        (minDate && date < minDate) || (maxDate && date > maxDate);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !isDisabled && handleSelectDate(date)}
          disabled={isDisabled}
          className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
            isStart || isEnd
              ? "bg-blue-600 text-white"
              : inRange
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : isDisabled
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const displayValue =
    startDate && endDate
      ? `${formatDatePtBr(startDate)} - ${formatDatePtBr(endDate)}`
      : startDate
        ? `${formatDatePtBr(startDate)} - ...`
        : "Selecione um período";

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className={`flex items-center gap-2 w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
          disabled
            ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
            : "bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
        } border-gray-300 dark:border-gray-600`}
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span
          className={`flex-1 text-sm ${
            startDate ? "text-gray-900 dark:text-gray-100" : "text-gray-400"
          }`}
        >
          {displayValue}
        </span>
      </div>

      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={calendarRef}
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
            style={{ top: coords.top, left: coords.left }}
          >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {selecting === "start" ? "Selecione a data inicial" : "Selecione a data final"}
            </div>

            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {MONTHS_PT[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_PT.map((day) => (
                <div
                  key={day}
                  className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default DatePicker;
