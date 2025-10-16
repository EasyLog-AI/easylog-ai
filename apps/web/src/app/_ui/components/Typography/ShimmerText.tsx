'use client';

import { VariantProps, tv } from 'tailwind-variants';

export const shimmerTextStyles = tv({
  slots: {
    base: 'relative inline-block',
    content: 'relative',
    shimmer:
      'absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent'
  }
});

export interface ShimmerTextProps
  extends VariantProps<typeof shimmerTextStyles> {
  className?: string;
}

const ShimmerText = ({
  children,
  className
}: React.PropsWithChildren<ShimmerTextProps>) => {
  const styles = shimmerTextStyles();

  return (
    <div className={styles.base({ className })}>
      <div className={styles.content()}>
        {children}
        <div
          className={styles.shimmer()}
          style={{
            backgroundSize: '200% 100%'
          }}
        />
      </div>
    </div>
  );
};

export default ShimmerText;
