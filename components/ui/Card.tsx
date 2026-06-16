import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, className = '', noPadding = false, ...props }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${noPadding ? '' : 'p-5'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
