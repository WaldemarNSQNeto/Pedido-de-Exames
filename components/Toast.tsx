import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setVisible(true);

    // Set timer to fade out and then call onClose
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out transition
    }, 3000); // 3 seconds visible

    return () => {
      clearTimeout(timer);
    };
  }, [message, type, onClose]);

  const baseClasses = "fixed top-5 right-5 z-50 p-4 rounded-lg shadow-2xl text-white transition-opacity duration-300 ease-in-out";
  const typeClasses = {
    success: 'bg-green-600',
    error: 'bg-red-600',
  };
  const visibilityClasses = visible ? 'opacity-100' : 'opacity-0';

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${visibilityClasses}`} role="alert">
      {message}
    </div>
  );
};

export default Toast;
