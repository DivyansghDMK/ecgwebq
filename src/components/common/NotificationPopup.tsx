import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationPopupProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function NotificationPopup({ 
  message, 
  type, 
  duration = 4000, 
  onClose 
}: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100 border-green-300';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100 border-red-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100 border-yellow-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 border-blue-300';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black transition-opacity duration-300
          ${isVisible ? 'bg-opacity-50' : 'bg-opacity-0'}
        `}
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
      />
      
      {/* Modal Content */}
      <div
        className={`
          relative z-10 transform transition-all duration-300 ease-in-out
          ${isVisible 
            ? 'scale-100 opacity-100' 
            : 'scale-95 opacity-0'
          }
        `}
      >
        <div
          className={`
            flex flex-col items-center justify-center space-y-3 p-4 rounded-2xl border-2 shadow-2xl
            w-64 h-64 bg-white
            ${getBackgroundColor()}
          `}
        >
          {/* Icon */}
          <div className="flex-shrink-0">
            {getIcon()}
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-base font-semibold">
              {message}
            </p>
          </div>

          {/* OK Button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className={`
              px-4 py-1.5 rounded-md font-medium transition-colors duration-200 text-sm
              ${type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                'bg-blue-500 hover:bg-blue-600 text-white'}
            `}
          >
            OK
          </button>

          {/* Close Button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
