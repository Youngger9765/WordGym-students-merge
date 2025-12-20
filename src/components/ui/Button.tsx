import React from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  className = '',
  disabled = false,
  ...rest
}) => {
  const base = "px-4 py-2 rounded-full font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: Record<ButtonVariant, string> = {
    primary: disabled ? "bg-indigo-600 text-white focus:ring-indigo-500" : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    ghost: disabled ? "bg-white/80 text-gray-700 border border-gray-200 focus:ring-gray-300" : "bg-white/80 text-gray-700 border border-gray-200 hover:bg-white focus:ring-gray-300",
    danger: disabled ? "bg-rose-600 text-white focus:ring-rose-500" : "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500",
    success: disabled ? "bg-green-600 text-white focus:ring-green-500" : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
  };
  const variantClass = variants[variant] || variants.primary;
  const disabledClass = disabled ? "opacity-60 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${variantClass} ${disabledClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
