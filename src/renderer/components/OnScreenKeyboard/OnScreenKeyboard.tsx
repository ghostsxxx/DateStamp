import React, { useState } from 'react';
import './OnScreenKeyboard.css';

interface OnScreenKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onDone?: () => void;
  placeholder?: string;
}

const OnScreenKeyboard: React.FC<OnScreenKeyboardProps> = ({
  value,
  onChange,
  onDone,
  placeholder = 'Enter text...'
}) => {
  const [isShift, setIsShift] = useState(false);

  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '_'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'backspace'],
    ['space', 'clear', 'done']
  ];

  const handleKeyPress = (key: string) => {
    switch (key) {
      case 'backspace':
        onChange(value.slice(0, -1));
        break;
      case 'space':
        onChange(value + ' ');
        break;
      case 'clear':
        onChange('');
        break;
      case 'shift':
        setIsShift(!isShift);
        break;
      case 'done':
        if (onDone) onDone();
        break;
      default:
        const char = isShift ? key.toUpperCase() : key;
        onChange(value + char);
        if (isShift) setIsShift(false);
        break;
    }
  };

  const getKeyClass = (key: string) => {
    let className = 'keyboard-key';
    if (key === 'space') className += ' key-space';
    if (key === 'backspace') className += ' key-backspace';
    if (key === 'shift') className += ` key-shift ${isShift ? 'active' : ''}`;
    if (key === 'clear') className += ' key-clear';
    if (key === 'done') className += ' key-done';
    return className;
  };

  const getKeyLabel = (key: string) => {
    switch (key) {
      case 'backspace': return '⌫';
      case 'shift': return '⇧';
      case 'space': return 'Space';
      case 'clear': return 'Clear';
      case 'done': return 'Done';
      default: return isShift ? key.toUpperCase() : key;
    }
  };

  return (
    <div className="onscreen-keyboard">
      <input
        type="text"
        className="keyboard-input"
        value={value}
        placeholder={placeholder}
        readOnly
      />
      <div className="keyboard-rows">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map((key) => (
              <button
                key={key}
                className={getKeyClass(key)}
                onClick={() => handleKeyPress(key)}
                type="button"
              >
                {getKeyLabel(key)}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnScreenKeyboard;