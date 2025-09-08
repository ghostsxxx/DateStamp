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

interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloadProgress?: number;
  downloaded: boolean;
  error?: string;
  updateInfo?: {
    version: string;
    releaseDate: string;
    releaseName?: string;
    releaseNotes?: string;
  };
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [_settings, setSettings] = useState<Settings | null>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualPrinterName, setManualPrinterName] = useState('');
  const [labelPath, setLabelPath] = useState('');
  const [autoUpdateDate, setAutoUpdateDate] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState<'printer' | 'path' | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
  });
  const [currentVersion, setCurrentVersion] = useState<string>('Unknown');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadPrinters();
      loadUpdateStatus();
      loadAppVersion();
    }
  }, [isOpen]);

  useEffect(() => {
    // Listen for update status changes
    const removeListener = window.electron.ipcRenderer.on(
      'update-status',
      (status: unknown) => {
        setUpdateStatus(status as UpdateStatus);
      },
    );

    return () => {
      removeListener();
    };
  }, []);

  const loadSettings = async () => {
    try {
      const response = await window.electron.ipcRenderer.invoke('settings:get');
      if (response.success && response.data) {
        setSettings(response.data);
        setSelectedPrinter(response.data.printer.name);
        setIsManualEntry(response.data.printer.isManualEntry);
        setManualPrinterName(
          response.data.printer.isManualEntry ? response.data.printer.name : '',
        );
        setLabelPath(response.data.label.filePath);
        setAutoUpdateDate(response.data.label.autoUpdateDate);
      }
    } catch (err) {
      // Error('Error loading settings:', err);
      setError('Failed to load settings');
    }
  };

  const loadPrinters = async () => {
    try {
      // Log('Loading printers...');
      const response =
        await window.electron.ipcRenderer.invoke('printers:list');
      // Log('Printer response:', response);
      if (response.success && response.data) {
        // Log('Setting printers:', response.data);
        setPrinters(response.data);
      } else {
        // Error('Failed to load printers:', response);
        setError('Failed to load printer list');
      }
    } catch (err) {
      // Error('Error loading printers:', err);
      setError('Error loading printer list');
    }
  };

  const loadUpdateStatus = async () => {
    try {
      const response =
        await window.electron.ipcRenderer.invoke('updater:get-status');
      if (response.success && response.data) {
        setUpdateStatus(response.data);
      }
    } catch (err) {
      // Error('Error loading update status:', err);
    }
  };

  const loadAppVersion = async () => {
    try {
      const response =
        await window.electron.ipcRenderer.invoke('app:get-version');
      if (response.success && response.data) {
        setCurrentVersion(response.data);
      }
    } catch (err) {
      // Error('Error loading app version:', err);
    }
  };

  const handleCheckUpdate = async () => {
    setUpdateStatus((prev) => ({ ...prev, checking: true, error: undefined }));
    try {
      const response =
        await window.electron.ipcRenderer.invoke('updater:check');
      if (!response.success) {
        setUpdateStatus((prev) => ({
          ...prev,
          checking: false,
          error: response.error,
        }));
      }
    } catch (err) {
      // Error('Error checking for updates:', err);
      setUpdateStatus((prev) => ({
        ...prev,
        checking: false,
        error: 'Failed to check for updates',
      }));
    }
  };

  const handleRestartUpdate = async () => {
    try {
      await window.electron.ipcRenderer.invoke('updater:restart');
    } catch (err) {
      // Error('Error restarting for update:', err);
      setError('Failed to restart for update');
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
      const response = await window.electron.ipcRenderer.invoke(
        'printer:test',
        printerToTest,
      );
      if (response.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.error || 'Test print failed');
      }
    } catch (err) {
      // Error('Error testing printer:', err);
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
          isManualEntry,
        },
        label: {
          filePath: labelPath,
          autoUpdateDate,
        },
      };

      const response = await window.electron.ipcRenderer.invoke(
        'settings:update',
        updates,
      );
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
      // Error('Error saving settings:', err);
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
          {success && (
            <div className="settings-success">Settings saved successfully!</div>
          )}

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
                    style={{
                      marginLeft: '10px',
                      padding: '5px 10px',
                      fontSize: '14px',
                    }}
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
                    <option value="" disabled>
                      Loading printers...
                    </option>
                  )}
                  {printers.map((printer) => (
                    <option key={printer.name} value={printer.name}>
                      {printer.name} {printer.isDefault ? '(Default)' : ''} -{' '}
                      {printer.status}
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
              disabled={
                loading ||
                (!isManualEntry && !selectedPrinter) ||
                (isManualEntry && !manualPrinterName)
              }
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

          <div className="settings-section">
            <h3>Application Updates</h3>

            <div className="settings-field">
              <label>Current Version: {currentVersion}</label>
            </div>

            {updateStatus.updateInfo && (
              <div className="settings-field">
                <label>
                  Available Version: {updateStatus.updateInfo.version}
                </label>
              </div>
            )}

            {updateStatus.downloading && (
              <div className="settings-field">
                <label>
                  Download Progress:{' '}
                  {Math.round(updateStatus.downloadProgress || 0)}%
                </label>
                <div className="update-progress-bar">
                  <div
                    className="update-progress-fill"
                    style={{ width: `${updateStatus.downloadProgress || 0}%` }}
                  />
                </div>
              </div>
            )}

            {updateStatus.error && (
              <div className="settings-error">{updateStatus.error}</div>
            )}

            <div className="settings-field update-buttons">
              {!updateStatus.downloaded ? (
                <button
                  className="settings-button settings-button-update"
                  onClick={handleCheckUpdate}
                  disabled={updateStatus.checking || updateStatus.downloading}
                  type="button"
                >
                  {updateStatus.checking
                    ? 'Checking...'
                    : updateStatus.downloading
                    ? `Downloading... ${Math.round(
                        updateStatus.downloadProgress || 0,
                      )}%`
                    : updateStatus.available
                    ? 'Update Available'
                    : 'Check for Updates'}
                </button>
              ) : (
                <button
                  className="settings-button settings-button-restart"
                  onClick={handleRestartUpdate}
                  type="button"
                >
                  Restart and Update
                </button>
              )}
            </div>

            {updateStatus.downloaded && (
              <div className="settings-info">
                Version {updateStatus.updateInfo?.version} is ready to install.
                Click "Restart and Update" to apply the update.
              </div>
            )}
          </div>

          {showKeyboard && (
            <div className="keyboard-container">
              <OnScreenKeyboard
                value={
                  showKeyboard === 'printer' ? manualPrinterName : labelPath
                }
                onChange={(value) => {
                  if (showKeyboard === 'printer') {
                    setManualPrinterName(value);
                  } else {
                    setLabelPath(value);
                  }
                }}
                onDone={() => setShowKeyboard(null)}
                placeholder={
                  showKeyboard === 'printer'
                    ? 'Enter printer name'
                    : 'Enter file path'
                }
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

        <LogViewer isOpen={showLogs} onClose={() => setShowLogs(false)} />
      </div>
    </div>
  );
};

export default SettingsModal;
