import { useContext } from 'react';

import { ComboboxContext, ComboboxContextType } from './ComboboxProvider';

const useComboboxContext = <T>() => {
  const context = useContext(ComboboxContext) as ComboboxContextType<T> | null;

  if (!context) {
    throw new Error(
      'useComboboxContext must be used within a ComboboxProvider',
    );
  }

  return context;
};

export default useComboboxContext;
