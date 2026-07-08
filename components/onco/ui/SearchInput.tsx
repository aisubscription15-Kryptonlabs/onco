"use client";

type SearchInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({ label, value, onChange, placeholder }: SearchInputProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        className="onco-input"
        value={value}
        placeholder={placeholder || "Search"}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

