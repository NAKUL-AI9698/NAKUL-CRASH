import React from 'react';

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'blue' | 'pink' | 'green';
  fullWidth?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  variant = 'blue', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const colorClasses = {
    blue: 'border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black shadow-[0_0_10px_rgba(0,243,255,0.5)] hover:shadow-[0_0_20px_rgba(0,243,255,0.8)]',
    pink: 'border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-black shadow-[0_0_10px_rgba(255,0,255,0.5)] hover:shadow-[0_0_20px_rgba(255,0,255,0.8)]',
    green: 'border-neon-green text-neon-green hover:bg-neon-green hover:text-black shadow-[0_0_10px_rgba(0,255,0,0.5)] hover:shadow-[0_0_20px_rgba(0,255,0,0.8)]',
  };

  return (
    <button
      className={`
        uppercase font-mono font-bold tracking-widest py-3 px-6 
        border-2 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95
        ${colorClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};