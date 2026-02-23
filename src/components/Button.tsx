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
    primary:
      'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-secondary)]',
    secondary:
      'bg-[var(--brand-secondary)] text-white hover:bg-[var(--brand-tertiary)]',
    outline:
      'border border-[var(--brand-secondary)] text-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)] hover:text-white',
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
