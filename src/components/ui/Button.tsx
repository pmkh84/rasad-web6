import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'danger' | 'white';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow focus:ring-blue-500': variant === 'default',
          'bg-transparent border-2 border-gray-300 hover:bg-gray-50 text-gray-700 hover:border-blue-500 focus:ring-blue-500': variant === 'outline',
          'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500': variant === 'ghost',
          'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow focus:ring-red-500': variant === 'danger',
          'bg-white hover:bg-blue-50 text-blue-600 shadow-sm hover:shadow focus:ring-white': variant === 'white',
          'px-3 py-1.5 text-sm rounded-md': size === 'sm',
          'px-4 py-2 text-base rounded-lg': size === 'md',
          'px-6 py-3 text-lg rounded-xl': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};