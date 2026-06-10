// ============================================================
// Button — 统一按钮组件
// 规则：禁止在 feature 中使用原生 <button>，统一用此组件
// ============================================================

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  children: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:  'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secondary:'border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white',
  ghost:    'text-gray-600 hover:bg-gray-100',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded',
  md: 'px-4 py-2 text-sm rounded-md',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
