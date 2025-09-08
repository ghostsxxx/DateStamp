import React, { useState, useEffect } from 'react';
import OnScreenKeyboard from '../OnScreenKeyboard/OnScreenKeyboard';
import LogViewer from '../LogViewer/LogViewer';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Printer {
  name: string;
  status: string;
  isDefault: boolean;
}

interface Settings {
  printer: {
    name: string;
    isManualEntry: boolean;
  };
  label: {
    filePath: string;
    autoUpdateDate: boolean;
  };
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualPrinterName, setManualPrinterName] = useState('');
  const [labelPath, setLabelPath] = useState('');
  const [autoUpdateDate, setAutoUpdateDate] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState<'printer' | 'path' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadPrinters();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke('settings:get');
      if (response.success && response.data) {
        setSettings(response.data);
        setSelectedPrinter(response.data.printer.name);
        setIsManualEntry(response.data.printer.isManualEntry);
        setManualPrinterName(response.data.printer.isManualEntry ? response.data.printer.name : '');
        setLabelPath(response.data.label.filePath);
        setAutoUpdateDate(response.data.label.autoUpdateDate);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    }
  };

  const loadPrinters = async () => {
    try {
      console.log('Loading printers...');
      const response = await window.electron.ipcRenderer.invoke('printers:list');
      console.log('Printer response:', response);
      if (response.success && response.data) {
        console.log('Setting printers:', response.data);
        setPrinters(response.data);
      } else {
        console.error('Failed to load printers:', response);
        setError('Failed to load printer list');
      }
    } catch (err) {
      console.error('Error loading printers:', err);
      setError('Error loading printer list');
    }
  };

  const handleTestPrint = async () => {
    const printerToTest = isManualEntry ? manualPrinterName : selectedPrinter;
    if (!printerToTest) {
      setError('Please select or enter a printer');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await window.electron.ipcRenderer.invoke('printer:test', printerToTest);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.error || 'Test print failed');
      }
    } catch (err) {
      console.error('Error testing printer:', err);
      setError('Test print failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      const updates = {
        printer: {
          name: isManualEntry ? manualPrinterName : selectedPrinter,
          isManualEntry
        },
        label: {
          filePath: labelPath,
          autoUpdateDate
        }
      };

      const response = await window.electron.ipcRenderer.invoke('settings:update', updates);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError(response.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowKeyboard(null);
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button 
            className="settings-close"
            onClick={handleCancel}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="settings-content">
          {error && <div className="settings-error">{error}</div>}
          {success && <div className="settings-success">Settings saved successfully!</div>}

          <div className="settings-section">
            <h3>Printer Configuration</h3>
            
            <div className="settings-field">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={isManualEntry}
                  onChange={(e) => {
                    setIsManualEntry(e.target.checked);
                    setShowKeyboard(null);
                  }}
                />
                <span>Manual printer entry</span>
              </label>
            </div>

            {!isManualEntry ? (
              <div className="settings-field">
                <label>
                  Select Printer:
                  <button
                    className="settings-button-inline"
                    onClick={loadPrinters}
                    type="button"
                    style={{ marginLeft: '10px', padding: '5px 10px', fontSize: '14px' }}
                  >
                    Refresh List
                  </button>
                </label>
                <select
                  className="settings-select"
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                >
                  <option value="">-- Select Printer --</option>
                  {printers.length === 0 && (
                    <option value="" disabled>Loading printers...</option>
                  )}
                  {printers.map((printer) => (
                    <option key={printer.name} value={printer.name}>
                      {printer.name} {printer.isDefault ? '(Default)' : ''} - {printer.status}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="settings-field">
                <label>Printer Name:</label>
                <div className="input-with-keyboard">
                  <input
                    type="text"
                    className="settings-input"
                    value={manualPrinterName}
                    placeholder="Enter printer name"
                    onFocus={() => setShowKeyboard('printer')}
                    readOnly
                  />
                </div>
              </div>
            )}

            <button
              className="settings-button settings-button-test"
              onClick={handleTestPrint}
              disabled={loading || (!isManualEntry && !selectedPrinter) || (isManualEntry && !manualPrinterName)}
              type="button"
            >
              Test Print
            </button>
          </div>

          <div className="settings-section">
            <h3>Label Configuration</h3>
            
            <div className="settings-field">
              <label>Label File Path:</label>
              <div className="input-with-keyboard">
                <input
                  type="text"
                  className="settings-input"
                  value={labelPath}
                  placeholder="Path to label.zpl file"
                  onFocus={() => setShowKeyboard('path')}
                  readOnly
                />
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={autoUpdateDate}
                  onChange={(e) => setAutoUpdateDate(e.target.checked)}
                />
                <span>Auto-update date in label</span>
              </label>
            </div>
          </div>

          {showKeyboard && (
            <div className="keyboard-container">
              <OnScreenKeyboard
                value={showKeyboard === 'printer' ? manualPrinterName : labelPath}
                onChange={(value) => {
                  if (showKeyboard === 'printer') {
                    setManualPrinterName(value);
                  } else {
                    setLabelPath(value);
                  }
                }}
                onDone={() => setShowKeyboard(null)}
                placeholder={showKeyboard === 'printer' ? 'Enter printer name' : 'Enter file path'}
              />
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button
            className="settings-button settings-button-logs"
            onClick={() => setShowLogs(true)}
            type="button"
          >
            View Logs
          </button>
          <div className="settings-footer-actions">
            <button
              className="settings-button settings-button-cancel"
              onClick={handleCancel}
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              className="settings-button settings-button-save"
              onClick={handleSave}
              disabled={loading}
              type="button"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        
        <LogViewer
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
        />
      </div>
    </div>
  );
};

export default SettingsModal;