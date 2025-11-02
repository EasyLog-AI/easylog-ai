'use client';

import Fuse, { IFuseOptions } from 'fuse.js';
import { createContext, useEffect, useMemo, useState } from 'react';

import useDebounce from '../../hooks/useDebounce';

export interface ComboboxContextType<T, IDField extends keyof T = keyof T> {
  items: T[] | undefined;

  activeItem: T | null;

  open: boolean;
  setOpen: (open: boolean) => void;

  value: T[IDField] | null;
  setValue: (value: T[IDField] | null) => void;

  search: string;
  setSearch: (search: string) => void;

  results: T[];

  idField: IDField;
}

export const ComboboxContext =
  createContext<ComboboxContextType<unknown> | null>(null);

export interface ComboboxProviderProps<T, IDField extends keyof T = keyof T> {
  items?: T[];
  defaultValue?: T[IDField] | null;
  idField: IDField;
  value?: T[IDField] | null;
  onValueChange?: (value: T[IDField] | null) => void;
  onSearch?: (search: string) => Promise<T[]> | T[];
  fuseOptions?: IFuseOptions<T>;
  debounceMs?: number;
  children?:
    | React.ReactNode
    | ((context: ComboboxContextType<T, IDField>) => React.ReactNode);
}

const ComboboxProvider = <T, IDField extends keyof T = keyof T>({
  items = [],
  defaultValue,
  value: _value,
  onValueChange,
  idField,
  onSearch,
  fuseOptions,
  debounceMs = 300,
  children,
}: ComboboxProviderProps<T, IDField>) => {
  if (onSearch && fuseOptions) {
    throw new Error('Cannot use onSearch and fuseOptions together');
  }

  const [results, setResults] = useState<T[]>(items);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [__value, _setValue] = useState<T[IDField] | null | undefined>(
    defaultValue,
  );

  const value = _value ?? __value;

  // Create Fuse instance for default search
  const fuse = useMemo(() => {
    if (!fuseOptions || items.length === 0) return null;
    return new Fuse(items as T[], fuseOptions);
  }, [items, fuseOptions]);

  // Debounce search input
  const [debouncedSearch] = useDebounce(search, debounceMs);

  // Handle search with custom handler or Fuse fallback
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch) {
        setResults(items);
        return;
      }

      // Custom search handler
      if (onSearch) {
        const searchResults = await onSearch(debouncedSearch);
        setResults(searchResults);
        return;
      }

      // Fuse search
      if (fuse) {
        const fuseResults = fuse.search(debouncedSearch);
        setResults(fuseResults.map((result) => result.item));
        return;
      }

      // No search configured, just filter items by string matching
      if (items.length > 0) {
        const filtered = items.filter((item) =>
          Object.values(item as Record<string, unknown>).some((val) =>
            String(val).toLowerCase().includes(debouncedSearch.toLowerCase()),
          ),
        );
        setResults(filtered);
      }
    };

    void performSearch();
  }, [debouncedSearch, items, onSearch, fuse]);

  const activeItem = value
    ? (items?.find((item) => item[idField] === value) ?? null)
    : null;

  const setValue = (newValue: T[IDField] | null) => {
    _setValue(newValue);
    onValueChange?.(newValue);
  };

  const contextValue: ComboboxContextType<T, IDField> = {
    items,
    activeItem,
    open,
    setOpen,
    value: value ?? null,
    setValue,
    search,
    setSearch,
    results,
    idField,
  };

  return (
    <ComboboxContext.Provider
      value={contextValue as unknown as ComboboxContextType<unknown>}
    >
      {typeof children === 'function' ? children(contextValue) : children}
    </ComboboxContext.Provider>
  );
};

export default ComboboxProvider;
