import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'accent' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  isLoading = false,
  loading = false,
  disabled,
  className = '',
  ...props
}) => {
  const isBusy = isLoading || loading;
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5132] dark:focus-visible:ring-emerald-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5 min-h-[36px]',
    md: 'text-sm px-4 py-2.5 rounded-2xl gap-2 min-h-[44px]',
    lg: 'text-base px-5 py-3 rounded-2xl gap-2.5 min-h-[50px] font-semibold',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#0F5132] dark:bg-emerald-600 text-white shadow-sm hover:bg-[#0A3B24] dark:hover:bg-emerald-500 active:bg-[#082C1B] border border-[#0F5132]/20 dark:border-emerald-500/30',
    secondary:
      'bg-emerald-50 dark:bg-emerald-950/60 text-[#0F5132] dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60',
    ghost:
      'text-stone-700 dark:text-stone-300 hover:bg-stone-100/90 dark:hover:bg-stone-800/80 border border-transparent',
    outline:
      'border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 shadow-2xs',
    accent:
      'bg-amber-500 dark:bg-amber-500 text-stone-950 dark:text-stone-950 font-bold hover:bg-amber-600 dark:hover:bg-amber-400 active:bg-amber-700 shadow-sm border border-amber-600/30',
    danger:
      'bg-rose-600 dark:bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm border border-rose-700/30',
  };

  return (
    <button
      disabled={disabled || isBusy}
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {isBusy ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
