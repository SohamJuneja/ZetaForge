import './Button.css';

import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  variant?: 'thin' | 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({
  children,
  icon,
  type = 'button',
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ButtonProps) => {
  const baseClasses = clsx(
    'button',
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-in-out',
    {
      'button-variant-thin': variant === 'thin',
      'button-variant-default': variant === 'default',
      'px-6 py-3 text-base': size === 'md',
      'px-4 py-2 text-sm': size === 'sm',
      'px-8 py-4 text-lg': size === 'lg',
    },
    className
  );

  return (
    <button
      type={type}
      className={baseClasses}
      {...props}
    >
      <div className="button-content">
        {icon && <span className="button-icon">{icon}</span>}
        {children}
      </div>
    </button>
  );
};
