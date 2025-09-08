import React, { useState, useEffect } from 'react';
import './PinDialog.css';

interface PinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin?: string;
}

const PinDialog: React.FC<PinDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  correctPin = '1234'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (pin.length === 4) {
      validatePin();
    }
  }, [pin]);

  const validatePin = async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke('settings:validatePin', pin);
      
      if (response.data?.isValid) {
        setTimeout(() => {
          onSuccess();
          setPin('');
        }, 200);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 1000);
      }
    } catch (err) {
      console.error('Error validating PIN:', err);
      setError(true);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 1000);
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num);
      setError(false);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const handleCancel = () => {
    setPin('');
    setError(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pin-dialog-overlay">
      <div className="pin-dialog">
        <div className="pin-dialog-header">
          <h2>Enter PIN</h2>
          <button 
            className="pin-dialog-close"
            onClick={handleCancel}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className="pin-display">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`pin-dot ${pin.length > index ? 'filled' : ''} ${error ? 'error' : ''}`}
            />
          ))}
        </div>

        {error && <div className="pin-error">Incorrect PIN</div>}

        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              className="pin-key"
              onClick={() => handleNumberClick(num.toString())}
              type="button"
              disabled={pin.length >= 4}
            >
              {num}
            </button>
          ))}
          <button
            className="pin-key pin-key-clear"
            onClick={handleClear}
            type="button"
          >
            Clear
          </button>
          <button
            className="pin-key"
            onClick={() => handleNumberClick('0')}
            type="button"
            disabled={pin.length >= 4}
          >
            0
          </button>
          <button
            className="pin-key pin-key-cancel"
            onClick={handleCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinDialog;