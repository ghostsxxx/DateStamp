import React, { useState, useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ messages, onRemove }) => {
  return (
    <div className="toast-container">
      {messages.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div 
      className={`toast toast-${toast.type} ${isLeaving ? 'toast-leaving' : ''}`}
      onClick={handleRemove}
    >
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation();
          handleRemove();
        }}
        type="button"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastType, message: string, duration?: number) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = {
      id,
      type,
      message,
      duration
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message: string, duration?: number) => {
    showToast('success', message, duration);
  };

  const error = (message: string, duration?: number) => {
    showToast('error', message, duration || 7000); // Errors stay longer
  };

  const info = (message: string, duration?: number) => {
    showToast('info', message, duration);
  };

  const warning = (message: string, duration?: number) => {
    showToast('warning', message, duration);
  };

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning
  };
};

export default Toast;