"use client";

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

type SelectProps<T extends string> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
};

export function Select<T extends string>({ label, value, options, onChange, className }: SelectProps<T>) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.05em] text-onco-muted-light">
        {label}
      </span>
      <span className="relative block">
        <select
          className="onco-input min-h-[54px] cursor-pointer appearance-none pr-11 leading-5"
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-onco-ink" aria-hidden="true">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
            <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </span>
      </span>
    </label>
  );
}
