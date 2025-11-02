import { IconCheck } from '@tabler/icons-react';

import useComboboxContext from './useComboboxContext';
import ContentWrapper, {
  ContentWrapperProps,
} from '../ContentWrapper/ContentWrapper';

export interface ComboboxItemContentProps extends ContentWrapperProps {
  value: string;
}

const ComboBoxItemContent = ({
  children,
  value,
  iconRight,
  ...props
}: React.PropsWithChildren<ComboboxItemContentProps>) => {
  const { activeItem, idField } = useComboboxContext();

  return (
    <ContentWrapper
      {...props}
      align="start"
      iconRight={value === activeItem?.[idField] ? IconCheck : iconRight}
    >
      {children}
    </ContentWrapper>
  );
};

export default ComboBoxItemContent;
