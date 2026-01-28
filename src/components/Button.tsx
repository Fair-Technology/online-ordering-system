import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  className,
}) => {
  const base = 'px-4 py-2 rounded-md font-semibold transition-colors';
  const styles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
    outline:
      'border border-secondary-500 text-secondary-500 hover:bg-secondary-500 hover:text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className || ''}`}
    >
      {children}
    </button>
  );
};

export default Button;
