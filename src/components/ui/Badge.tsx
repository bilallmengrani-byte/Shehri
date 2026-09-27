import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { ReportStatus } from '../../types';

export type BadgeVariant =
  | 'open'
  | 'in-progress'
  | 'verified'
  | 'resolved'
  | 'amber'
  | 'neutral'
  | 'primary';

export interface BadgeProps {
  status?: ReportStatus | string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  showDot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  variant,
  size = 'md',
  icon,
  showDot = false,
  className = '',
  children,
}) => {
  // Infer variant from status if not explicitly given
  let resolvedVariant: BadgeVariant = variant || 'neutral';

  if (!variant && status) {
    const s = status.toLowerCase();
    if (s.includes('open')) resolvedVariant = 'open';
    else if (s.includes('progress')) resolvedVariant = 'in-progress';
    else if (s.includes('verified')) resolvedVariant = 'verified';
    else if (s.includes('resolved')) resolvedVariant = 'resolved';
  }

  const variantStyles: Record<BadgeVariant, { bg: string; dot: string; defaultIcon?: React.ReactNode }> = {
    open: {
      bg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
      dot: 'bg-rose-500',
      defaultIcon: <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
    },
    'in-progress': {
      bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
      dot: 'bg-amber-500',
      defaultIcon: <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    },
    verified: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
      dot: 'bg-emerald-600 dark:bg-emerald-400',
      defaultIcon: <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />,
    },
    resolved: {
      bg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60',
      dot: 'bg-teal-600 dark:bg-teal-400',
      defaultIcon: <CheckCircle2 className="w-3 h-3 text-teal-700 dark:text-teal-400" />,
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300/80 dark:border-amber-700/60 font-semibold',
      dot: 'bg-amber-500',
      defaultIcon: <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />,
    },
    primary: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/60 text-[#0F5132] dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-medium',
      dot: 'bg-[#0F5132] dark:bg-emerald-400',
    },
    neutral: {
      bg: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
      dot: 'bg-stone-400 dark:bg-stone-500',
    },
  };

  const current = variantStyles[resolvedVariant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full gap-1',
    md: 'text-xs px-2.5 py-1 rounded-full gap-1.5 font-medium',
  };

  const displayText = children || status;

  return (
    <span
      className={`
        inline-flex items-center border font-medium transition-colors select-none
        ${sizeStyles[size]}
        ${current.bg}
        ${className}
      `}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      )}
      {icon ? (
        <span className="shrink-0">{icon}</span>
      ) : (
        current.defaultIcon && <span className="shrink-0">{current.defaultIcon}</span>
      )}
      <span>{displayText}</span>
    </span>
  );
};
