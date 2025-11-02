import useComboboxContext from './useComboboxContext';
import CommandItem, { CommandItemProps } from '../Command/CommandItem';

export interface ComboboxItemProps extends Omit<CommandItemProps, 'onSelect'> {
  onSelect?: (value: string) => void;
}

const ComboboxItem = ({ value, onSelect, ...props }: ComboboxItemProps) => {
  const { value: currentValue, setValue, setOpen } = useComboboxContext();

  const handleSelectChange = (_stringValue: string) => {
    const typedValue = value as never;
    const newValue = currentValue === typedValue ? null : typedValue;
    onSelect?.(String(value));
    setValue(newValue);
    setOpen(false);
  };

  return <CommandItem {...props} value={value} onSelect={handleSelectChange} />;
};

export default ComboboxItem;
