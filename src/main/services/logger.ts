import log from 'electron-log';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: any;
}

class LoggerService {
  private static instance: LoggerService;

  private readonly maxLogAge = 7; // days

  private readonly maxLogSize = 10 * 1024 * 1024; // 10MB

  private constructor() {
    this.configureLogger();
    this.setupLogRotation();
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private configureLogger(): void {
    // Configure log file location
    const logPath = path.join(app.getPath('userData'), 'logs');

    // Set log file
    log.transports.file.resolvePathFn = () => path.join(logPath, 'app.log');
    log.transports.file.level = 'info';
    log.transports.file.maxSize = this.maxLogSize;

    // Configure console output
    log.transports.console.level =
      process.env.NODE_ENV === 'development' ? 'debug' : 'info';

    // Custom format
    log.transports.file.format =
      '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
    log.transports.console.format = '[{h}:{i}:{s}] [{level}] {text}';

    // Enable catching errors
    log.catchErrors({
      showDialog: false,
      onError: (error) => {
        this.error('Unhandled error caught', {
          error: error.message,
          stack: error.stack,
        });
      },
    });
  }

  private setupLogRotation(): void {
    // Set up daily rotation
    const checkRotation = () => {
      try {
        const logPath = log.transports.file.getFile()?.path;
        if (!logPath) return;

        const logDir = path.dirname(logPath);
        const files = fs
          .readdirSync(logDir)
          .filter((file) => file.endsWith('.log'))
          .map((file) => ({
            name: file,
            path: path.join(logDir, file),
            stats: fs.statSync(path.join(logDir, file)),
          }))
          .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

        // Archive old log if current is too large
        if (files.length > 0 && files[0].stats.size > this.maxLogSize) {
          const timestamp = new Date().toISOString().split('T')[0];
          const archivePath = path.join(logDir, `app-${timestamp}.log`);
          fs.renameSync(files[0].path, archivePath);
          this.info('Log file rotated', {
            oldPath: files[0].path,
            newPath: archivePath,
          });
        }

        // Remove logs older than maxLogAge days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.maxLogAge);

        files.forEach((file) => {
          if (file.stats.mtime < cutoffDate) {
            fs.unlinkSync(file.path);
            this.info('Old log file removed', { file: file.name });
          }
        });
      } catch (error) {
        // Error('Error during log rotation:', error);
      }
    };

    // Check rotation on startup
    checkRotation();

    // Check daily
    setInterval(checkRotation, 24 * 60 * 60 * 1000);
  }

  // Public logging methods
  public info(message: string, context?: any): void {
    if (context) {
      log.info(message, context);
    } else {
      log.info(message);
    }
  }

  public warn(message: string, context?: any): void {
    if (context) {
      log.warn(message, context);
    } else {
      log.warn(message);
    }
  }

  public error(message: string, context?: any): void {
    if (context) {
      log.error(message, context);
    } else {
      log.error(message);
    }
  }

  public debug(message: string, context?: any): void {
    if (context) {
      log.debug(message, context);
    } else {
      log.debug(message);
    }
  }

  // Log management methods
  public async getLogs(
    limit: number = 1000,
    level?: string,
  ): Promise<LogEntry[]> {
    try {
      const logFile = log.transports.file.getFile();
      if (!logFile || !logFile.path) {
        return [];
      }

      const content = fs.readFileSync(logFile.path, 'utf8');
      const lines = content.split('\n').filter((line) => line.trim());

      const logs: LogEntry[] = [];
      const levelFilter = level?.toUpperCase();

      for (const line of lines.slice(-limit)) {
        const match = line.match(/\[([\d-\s:.]+)\]\s*\[(\w+)\]\s*(.+)/);
        if (match) {
          const [, timestamp, logLevel, message] = match;
          if (!levelFilter || logLevel === levelFilter) {
            logs.push({
              timestamp,
              level: logLevel,
              message: message.trim(),
            });
          }
        }
      }

      return logs.reverse(); // Most recent first
    } catch (error) {
      this.error('Error reading logs', error);
      return [];
    }
  }

  public async clearLogs(): Promise<boolean> {
    try {
      const logFile = log.transports.file.getFile();
      if (logFile && logFile.path) {
        fs.writeFileSync(logFile.path, '');
        this.info('Logs cleared');
        return true;
      }
      return false;
    } catch (error) {
      this.error('Error clearing logs', error);
      return false;
    }
  }

  public async exportLogs(targetPath: string): Promise<boolean> {
    try {
      const logFile = log.transports.file.getFile();
      if (!logFile || !logFile.path) {
        return false;
      }

      const content = fs.readFileSync(logFile.path, 'utf8');
      fs.writeFileSync(targetPath, content);
      this.info('Logs exported', { targetPath });
      return true;
    } catch (error) {
      this.error('Error exporting logs', error);
      return false;
    }
  }

  public getLogPath(): string {
    const logFile = log.transports.file.getFile();
    return logFile?.path || '';
  }

  public getLogSize(): number {
    try {
      const logPath = this.getLogPath();
      if (logPath && fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        return stats.size;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // System info logging
  public logSystemInfo(): void {
    this.info('Application started', {
      version: app.getVersion(),
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV,
    });
  }

  // Print operation logging
  public logPrintOperation(
    printer: string,
    copies: number,
    success: boolean,
    error?: string,
  ): void {
    const logData = {
      printer,
      copies,
      success,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      this.error('Print operation failed', { ...logData, error });
    } else {
      this.info('Print operation completed', logData);
    }
  }

  // Settings change logging
  public logSettingsChange(
    setting: string,
    oldValue: any,
    newValue: any,
  ): void {
    this.info('Settings changed', {
      setting,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    });
  }
}

export default LoggerService.getInstance();
