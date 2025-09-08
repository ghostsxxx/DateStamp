import React, { useState, useEffect, useRef } from 'react';
import './LogViewer.css';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [logSize, setLogSize] = useState('0 Bytes');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const logContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (autoRefresh && isOpen) {
      intervalRef.current = setInterval(loadLogs, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, isOpen]);

  useEffect(() => {
    filterLogs();
  }, [logs, filter, searchTerm]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await window.electron.ipcRenderer.invoke(
        'logger:getLogs',
        1000,
        filter === 'all' ? undefined : filter.toUpperCase(),
      );

      if (response.success && response.data) {
        setLogs(response.data.logs);
        setLogSize(response.data.sizeFormatted);
      }
    } catch (error) {
      // Error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (filter !== 'all') {
      filtered = filtered.filter(
        (log) => log.level.toLowerCase() === filter.toLowerCase(),
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((log) =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredLogs(filtered);
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      try {
        const response =
          await window.electron.ipcRenderer.invoke('logger:clearLogs');
        if (response.success) {
          setLogs([]);
          setFilteredLogs([]);
          setLogSize('0 Bytes');
        }
      } catch (error) {
        // Error('Error clearing logs:', error);
      }
    }
  };

  const handleExportLogs = async () => {
    try {
      const response =
        await window.electron.ipcRenderer.invoke('logger:exportLogs');
      if (response.success) {
        alert(`Logs exported to: ${response.data.path}`);
      }
    } catch (error) {
      // Error('Error exporting logs:', error);
    }
  };

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  const scrollToTop = () => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  };

  const getLevelClass = (level: string) => {
    return `log-level log-level-${level.toLowerCase()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="log-viewer-overlay">
      <div className="log-viewer">
        <div className="log-viewer-header">
          <h2>System Logs</h2>
          <button
            className="log-viewer-close"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="log-viewer-controls">
          <div className="log-viewer-filters">
            <button
              className={`log-filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              type="button"
            >
              All
            </button>
            <button
              className={`log-filter-btn ${filter === 'info' ? 'active' : ''}`}
              onClick={() => setFilter('info')}
              type="button"
            >
              Info
            </button>
            <button
              className={`log-filter-btn ${filter === 'warn' ? 'active' : ''}`}
              onClick={() => setFilter('warn')}
              type="button"
            >
              Warn
            </button>
            <button
              className={`log-filter-btn ${filter === 'error' ? 'active' : ''}`}
              onClick={() => setFilter('error')}
              type="button"
            >
              Error
            </button>
          </div>

          <div className="log-viewer-search">
            <input
              type="text"
              className="log-search-input"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="log-viewer-actions">
            <label className="log-auto-refresh">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span>Auto-refresh</span>
            </label>
            <button
              className="log-action-btn"
              onClick={loadLogs}
              disabled={loading}
              type="button"
            >
              Refresh
            </button>
            <button
              className="log-action-btn"
              onClick={handleExportLogs}
              type="button"
            >
              Export
            </button>
            <button
              className="log-action-btn log-action-clear"
              onClick={handleClearLogs}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="log-viewer-info">
          <span>{filteredLogs.length} logs</span>
          <span>Size: {logSize}</span>
        </div>

        <div className="log-viewer-content" ref={logContainerRef}>
          {loading && <div className="log-loading">Loading logs...</div>}
          {!loading && filteredLogs.length === 0 && (
            <div className="log-empty">No logs to display</div>
          )}
          {!loading &&
            filteredLogs.map((log, index) => (
              <div key={index} className="log-entry">
                <span className="log-timestamp">{log.timestamp}</span>
                <span className={getLevelClass(log.level)}>{log.level}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
        </div>

        <div className="log-viewer-footer">
          <button
            className="log-scroll-btn"
            onClick={scrollToTop}
            type="button"
          >
            ↑ Top
          </button>
          <button
            className="log-scroll-btn"
            onClick={scrollToBottom}
            type="button"
          >
            ↓ Bottom
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
