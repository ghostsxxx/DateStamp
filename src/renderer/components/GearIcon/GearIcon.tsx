import React from 'react';
import './GearIcon.css';

interface GearIconProps {
  onClick: () => void;
}

const GearIcon: React.FC<GearIconProps> = ({ onClick }) => {
  return (
    <button 
      className="gear-icon-button" 
      onClick={onClick}
      aria-label="Settings"
      type="button"
    >
      <svg 
        className="gear-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default GearIcon;