import React, { useState, useEffect } from 'react';
import './StatusBar.css';

interface StatusBarProps {
  onOpenLogs: () => void;
}

interface PrintStatus {
  lastPrint?: {
    time: string;
    copies: number;
    success: boolean;
  };
  currentPrinter: string;
  printerStatus: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ onOpenLogs }) => {
  const [status, setStatus] = useState<PrintStatus>({
    currentPrinter: 'Loading...',
    printerStatus: 'unknown'
  });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadPrinterInfo();
    
    // Listen for print events
    const handlePrintComplete = (message: string) => {
      const success = !message.toLowerCase().includes('error');
      const copies = parseInt(message.match(/\d+/)?.[0] || '1');
      
      setStatus(prev => ({
        ...prev,
        lastPrint: {
          time: new Date().toLocaleTimeString(),
          copies,
          success
        }
      }));
    };

    window.electron.ipcRenderer.on('ipc-example', handlePrintComplete);

    return () => {
      window.electron.ipcRenderer.removeAllListeners('ipc-example');
    };
  }, []);

  const loadPrinterInfo = async () => {
    try {
      const settingsResponse = await window.electron.ipcRenderer.invoke('settings:get');
      if (settingsResponse.success && settingsResponse.data) {
        const printerName = settingsResponse.data.printer.name;
        
        // Get printer status
        const statusResponse = await window.electron.ipcRenderer.invoke(
          'printer:status',
          printerName
        );
        
        setStatus(prev => ({
          ...prev,
          currentPrinter: printerName,
          printerStatus: statusResponse.success ? statusResponse.data.status : 'error'
        }));
      }
    } catch (error) {
      console.error('Error loading printer info:', error);
    }
  };

  const getPrinterStatusIcon = () => {
    switch (status.printerStatus) {
      case 'idle':
        return '🟢';
      case 'printing':
        return '🟡';
      case 'error':
      case 'disabled':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getPrintStatusIcon = () => {
    if (!status.lastPrint) return null;
    return status.lastPrint.success ? '✓' : '✗';
  };

  const getPrintStatusClass = () => {
    if (!status.lastPrint) return '';
    return status.lastPrint.success ? 'status-success' : 'status-error';
  };

  const formatPrinterName = (name: string) => {
    if (name.length > 20 && !expanded) {
      return name.substring(0, 17) + '...';
    }
    return name;
  };

  return (
    <div 
      className={`status-bar ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="status-bar-content">
        <div className="status-section status-printer">
          <span className="status-label">Printer:</span>
          <span className="status-value">
            {getPrinterStatusIcon()} {formatPrinterName(status.currentPrinter)}
          </span>
          {expanded && (
            <span className="status-detail">Status: {status.printerStatus}</span>
          )}
        </div>

        {status.lastPrint && (
          <div className={`status-section status-last-print ${getPrintStatusClass()}`}>
            <span className="status-label">Last Print:</span>
            <span className="status-value">
              {getPrintStatusIcon()} {status.lastPrint.time}
            </span>
            {expanded && (
              <span className="status-detail">
                {status.lastPrint.copies} label(s) - {status.lastPrint.success ? 'Success' : 'Failed'}
              </span>
            )}
          </div>
        )}

        <div className="status-section status-actions">
          <button
            className="status-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLogs();
            }}
            type="button"
            title="View Logs"
          >
            📋 Logs
          </button>
        </div>
      </div>

      {expanded && (
        <div className="status-bar-expanded">
          <button
            className="status-btn-small"
            onClick={(e) => {
              e.stopPropagation();
              loadPrinterInfo();
            }}
            type="button"
          >
            Refresh Status
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusBar;