import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'cyan' | 'emerald' | 'amber' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) => {
  let baseStyle = 'inline-flex items-center justify-center font-mono uppercase font-bold border border-line select-none cursor-pointer';

  if (size === 'sm') baseStyle += ' px-2.5 py-1 text-[11px] h-7';
  else if (size === 'md') baseStyle += ' px-3.5 py-1.5 text-xs h-8';
  else if (size === 'lg') baseStyle += ' px-4.5 py-2 text-sm h-10';

  let variantStyle = '';
  if (variant === 'primary') {
    variantStyle = 'bg-olive text-paper hover:bg-olive-dark active:bg-[#2A2E1F]';
  } else if (variant === 'secondary') {
    variantStyle = 'bg-surface text-ink hover:bg-surface-alt active:bg-sand';
  } else if (variant === 'destructive') {
    variantStyle = 'bg-red text-white hover:opacity-90 active:bg-[#681E17]';
  } else if (variant === 'outline') {
    variantStyle = 'bg-transparent text-ink border-line hover:bg-surface-alt';
  } else if (variant === 'cyan') {
    variantStyle = 'bg-cyan text-[#0E110D] hover:opacity-90 active:opacity-80 font-bold';
  } else if (variant === 'emerald') {
    variantStyle = 'bg-emerald text-white hover:opacity-90 active:opacity-80 font-bold';
  } else if (variant === 'amber') {
    variantStyle = 'bg-amber text-white hover:opacity-90 active:opacity-80 font-bold';
  } else if (variant === 'purple') {
    variantStyle = 'bg-purple text-white hover:opacity-90 active:opacity-80 font-bold';
  }

  const disabledStyle = disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '';

  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98, y: 0 }}
      transition={{ duration: 0.08 }}
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
