import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'elevated' | 'outline' | 'tinted';
  interactive?: boolean;
  padded?: boolean | 'sm' | 'md' | 'lg' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  padded = 'md',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs dark:shadow-none',
    flat: 'bg-stone-100/70 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/50',
    elevated: 'bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-md dark:shadow-none',
    outline: 'bg-transparent border border-stone-300 dark:border-stone-700',
    tinted: 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  };

  const resolvedPadding =
    typeof padded === 'boolean'
      ? padded
        ? paddingStyles.md
        : paddingStyles.none
      : paddingStyles[padded];

  return (
    <div
      className={`
        rounded-2xl sm:rounded-3xl transition-all duration-200 overflow-hidden
        ${variantStyles[variant]}
        ${resolvedPadding}
        ${interactive ? 'cursor-pointer hover:border-emerald-700/30 dark:hover:border-emerald-500/40 hover:shadow-md active:scale-[0.99]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-start justify-between gap-3 mb-2.5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3
      className={`text-base font-semibold text-stone-900 dark:text-stone-100 leading-snug tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`text-sm text-stone-700 dark:text-stone-300 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`mt-3.5 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2 text-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
