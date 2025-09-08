import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import GearIcon from './components/GearIcon/GearIcon';
import PinDialog from './components/PinDialog/PinDialog';
import SettingsModal from './components/SettingsModal/SettingsModal';
import Toast, { useToast } from './components/Toast/Toast';
import LogViewer from './components/LogViewer/LogViewer';
import StatusBar from './components/StatusBar/StatusBar';

import './App.css';

function sendPrintEvent(
  copies: number,
  setResponse: (response: string) => void,
) {
  console.log('print event', copies);
  window.electron.ipcRenderer.sendMessage('ipc-example', copies);
  // get the response from the main process
  /*  window.electron.ipcRenderer.once('ipc-example', (arg) => {
    setResponse(arg);
    console.log('teeeest', arg);
  }); */
}

function Button({
  copies,
  setResponse,
}: {
  copies: number;
  setResponse: (response: string) => void;
}) {
  return (
    <button
      type="button"
      className="number-item"
      onClick={() => sendPrintEvent(copies, setResponse)}
    >
      {copies}
    </button>
  );
}

const printCount = Array.from({ length: 12 }, (_, i) => i + 1);

function isPrime(num: number): boolean {
  if (num <= 1) return false; // 1 is not a prime number
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function generatePrimes(count: number): number[] {
  const primes: number[] = [];
  let number = 2; // Start from the first prime number

  while (primes.length < count) {
    if (isPrime(number)) {
      primes.push(number);
    }
    number++;
  }

  return primes;
}

const first12Primes = generatePrimes(12);

function Hello() {
  const [response, setResponse] = React.useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const { toasts, removeToast, success, error, info } = useToast();

  useEffect(() => {
    // Listen for settings open request from menu
    const handleOpenSettings = () => {
      setShowPinDialog(true);
    };

    // Listen for print responses
    const handlePrintResponse = (message: string) => {
      if (message.toLowerCase().includes('error')) {
        error(message);
      } else {
        success(message);
      }
      setResponse(message);
    };

    window.electron.ipcRenderer.on('open-settings', handleOpenSettings);
    window.electron.ipcRenderer.on('ipc-example', handlePrintResponse);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('open-settings');
      window.electron.ipcRenderer.removeAllListeners('ipc-example');
    };
  }, []);

  const handleGearClick = () => {
    setShowPinDialog(true);
  };

  const handlePinSuccess = () => {
    setShowPinDialog(false);
    setShowSettings(true);
  };

  const handlePinClose = () => {
    setShowPinDialog(false);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  const handleOpenLogs = () => {
    setShowLogs(true);
  };

  const handleCloseLogs = () => {
    setShowLogs(false);
  };

  return (
    <div className="container">
      <div className="left-container">{/* <h3>{response}</h3> */}</div>
      <div className="number-container">
        {first12Primes.map((i) => (
          <Button key={i} copies={i} setResponse={setResponse} />
        ))}
      </div>
      
      <GearIcon onClick={handleGearClick} />
      
      <StatusBar onOpenLogs={handleOpenLogs} />
      
      <Toast messages={toasts} onRemove={removeToast} />
      
      <PinDialog
        isOpen={showPinDialog}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={handleSettingsClose}
      />
      
      <LogViewer
        isOpen={showLogs}
        onClose={handleCloseLogs}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
