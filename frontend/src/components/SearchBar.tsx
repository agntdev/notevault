import { useId } from "react";

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

/**
 * Controlled search input. Debouncing happens in the parent via
 * `useDebouncedValue` — keeping the visual input in sync with every
 * keystroke is the responsiveness users expect.
 */
export function SearchBar({ value, onChange, placeholder = "Search notes by title…" }: SearchBarProps) {
  const id = useId();
  return (
    <div className="nv-search">
      <label htmlFor={id} className="nv-sr-only">
        Search notes
      </label>
      <input
        id={id}
        type="search"
        role="searchbox"
        className="nv-input nv-search-input"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="nv-search-clear"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
