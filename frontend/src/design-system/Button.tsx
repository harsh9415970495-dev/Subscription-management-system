import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
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

  if (size === 'sm') baseStyle += ' px-2 py-1 text-[11px] h-7';
  else if (size === 'md') baseStyle += ' px-3 py-1.5 text-xs h-8';
  else if (size === 'lg') baseStyle += ' px-4 py-2 text-sm h-10';

  let variantStyle = '';
  if (variant === 'primary') {
    variantStyle = 'bg-olive text-[#EDECE5] hover:bg-olive-dark active:bg-[#2A2E1F]';
  } else if (variant === 'secondary') {
    variantStyle = 'bg-surface text-ink hover:bg-surface-alt active:bg-[#C2BFB2]';
  } else if (variant === 'destructive') {
    variantStyle = 'bg-red text-white hover:opacity-90 active:bg-[#681E17]';
  } else if (variant === 'outline') {
    variantStyle = 'bg-transparent text-ink border-line hover:bg-surface-alt';
  }

  const disabledStyle = disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${disabledStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
