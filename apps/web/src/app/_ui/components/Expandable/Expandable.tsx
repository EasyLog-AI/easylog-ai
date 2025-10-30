'use client';

import { createContext, useEffect, useRef, useState } from 'react';
import { VariantProps, tv } from 'tailwind-variants';

export const expandableStyles = tv({
  base: 'group flex flex-col items-start'
});

export interface ExpandableProps extends VariantProps<typeof expandableStyles> {
  className?: string;
  maxHeight?: number;
}

interface ExpandableContextType {
  isExpanded: boolean;
  isExpandable: boolean;
  toggleExpanded: () => void;
  totalContentRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export const ExpandableContext = createContext<
  ExpandableContextType | undefined
>(undefined);

const Expandable = ({
  children,
  className
}: React.PropsWithChildren<ExpandableProps>) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const totalContentRef = useRef<HTMLDivElement>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);

  useEffect(() => {
    const checkExpandable = () => {
      if (!totalContentRef.current) return;
      if (!contentRef.current) return;

      const shouldShowExpandButton =
        totalContentRef.current.clientHeight >= contentRef.current.clientHeight;

      setIsExpandable(shouldShowExpandButton);
    };

    checkExpandable();

    if (!totalContentRef.current) return;

    const observer = new MutationObserver(checkExpandable);
    const resizeObserver = new ResizeObserver(checkExpandable);

    observer.observe(totalContentRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    });

    resizeObserver.observe(totalContentRef.current);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [children]);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <ExpandableContext.Provider
      value={{
        isExpanded,
        isExpandable,
        toggleExpanded,
        totalContentRef,
        contentRef
      }}
    >
      <div
        className={expandableStyles({ className })}
        data-expandable={isExpandable}
        data-expanded={isExpanded}
      >
        {children}
      </div>
    </ExpandableContext.Provider>
  );
};

export default Expandable;
