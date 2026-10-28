import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

export type ActionPillVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ActionPillSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ActionPillVariant;
  size?: ActionPillSize;
  className?: string;
  icon?: ReactNode;
}

const variants: Record<ActionPillVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-md hover:bg-brand-700 focus-visible:ring-brand-500',
  secondary: 'bg-brand-50 text-brand-800 hover:bg-brand-100 focus-visible:ring-brand-500',
  danger: 'bg-red-600 text-white shadow-md hover:bg-red-700 focus-visible:ring-red-500',
  outline: 'border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
};

const sizes: Record<ActionPillSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
};

/** Shared pill for action buttons and action links on /clients and /panel. */
export function actionPillClass(
  variant: ActionPillVariant = 'primary',
  size: ActionPillSize = 'md',
  className = ''
): string {
  return [
    'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  ...props
}: ButtonProps) {
  return (
    <button className={actionPillClass(variant, size, className)} {...props}>
      {icon ? <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span> : null}
      {children}
    </button>
  );
}

interface ActionPillLinkProps {
  href: string;
  children: ReactNode;
  variant?: ActionPillVariant;
  size?: ActionPillSize;
  className?: string;
  icon?: ReactNode;
  ariaLabel?: string;
}

/** Same pill as Button, for an action that navigates. */
export function ActionPillLink({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  ariaLabel,
}: ActionPillLinkProps) {
  return (
    <Link href={href} aria-label={ariaLabel} className={actionPillClass(variant, size, className)}>
      {icon ? <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span> : null}
      {children}
    </Link>
  );
}
