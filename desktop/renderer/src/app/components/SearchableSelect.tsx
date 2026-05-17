import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
};

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder,
  searchPlaceholder = "Cerca...",
  emptyLabel = "Nessun risultato",
  disabled = false,
  className = "",
  allowClear = true,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return options;
    }

    return options.filter((option) =>
      `${option.label} ${option.searchText || ""}`.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setSearchTerm("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`w-full px-4 py-2 border rounded-md bg-white text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-slate-500 ${
          disabled
            ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
            : "border-gray-300 hover:border-slate-500"
        } ${className}`}
      >
        <span className={selectedOption ? "text-gray-950 truncate" : "text-gray-500 truncate"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-300 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder={searchPlaceholder}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {allowClear && value && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-slate-100"
              >
                {placeholder}
              </button>
            )}

            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between gap-3 ${
                  option.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-900 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check className="w-4 h-4 text-slate-900 shrink-0" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-gray-500">{emptyLabel}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
