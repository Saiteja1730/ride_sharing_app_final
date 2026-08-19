import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={clsx(
              'w-full py-3 rounded-lg bg-white border text-slate-900 placeholder-slate-400 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-900/20 focus:border-brand-900',
              icon ? 'pl-10 pr-4' : 'px-4',
              rightIcon ? 'pr-10' : '',
              error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
