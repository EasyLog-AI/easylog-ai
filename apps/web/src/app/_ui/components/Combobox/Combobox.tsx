import ComboboxProvider, {
  ComboboxContextType,
  ComboboxProviderProps,
} from './ComboboxProvider';
import Popover from '../Popover/Popover';

export interface ComboboxProps<T, IDField extends keyof T = keyof T>
  extends Omit<ComboboxProviderProps<T, IDField>, 'children'> {
  children: (context: ComboboxContextType<T, IDField>) => React.ReactNode;
}

const Combobox = <T, IDField extends keyof T = keyof T>({
  items,
  defaultValue,
  idField,
  value,
  onValueChange,
  onSearch,
  fuseOptions,
  debounceMs,
  children,
}: ComboboxProps<T, IDField>) => {
  return (
    <ComboboxProvider
      items={items}
      defaultValue={defaultValue}
      idField={idField}
      value={value}
      onValueChange={onValueChange}
      onSearch={onSearch}
      fuseOptions={fuseOptions}
      debounceMs={debounceMs}
    >
      {(context) => (
        <Popover open={context.open} onOpenChange={context.setOpen}>
          {children(context)}
        </Popover>
      )}
    </ComboboxProvider>
  );
};

export default Combobox;
