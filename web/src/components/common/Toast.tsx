import React, { useEffect } from 'react';
import { ToastType } from '../../types';

interface ToastProps {
  toast: ToastType;
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColors = {
    success: 'border-green-500 bg-green-500/10',
    error: 'border-red-500 bg-red-500/10',
    info: 'border-blue-500 bg-blue-500/10',
    warn: 'border-yellow-500 bg-yellow-500/10',
  };

  const icons = {
    success: 'fa-check-circle text-green-400',
    error: 'fa-exclamation-circle text-red-400',
    info: 'fa-info-circle text-blue-400',
    warn: 'fa-exclamation-triangle text-yellow-400',
  };

  return (
    <div className={`toast-notification glass-morphism rounded-xl p-4 mb-3 border-l-4 ${bgColors[toast.type]} flex items-center gap-3 min-w-[280px]`}>
      <i className={`fas ${icons[toast.type]} text-xl`}></i>
      <span className="text-sm text-white">{toast.message}</span>
    </div>
  );
};

export default Toast;