import { ipcMain, IpcMainInvokeEvent, dialog, app } from 'electron';
import loggerService, { LogEntry } from '../services/logger';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import path from 'path';

export interface LoggerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class LoggerHandler {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    ipcMain.handle(
      IPC_CHANNELS.LOGGER.GET_LOGS,
      this.handleGetLogs.bind(this)
    );

    ipcMain.handle(
      IPC_CHANNELS.LOGGER.CLEAR_LOGS,
      this.handleClearLogs.bind(this)
    );

    ipcMain.handle(
      IPC_CHANNELS.LOGGER.EXPORT_LOGS,
      this.handleExportLogs.bind(this)
    );

    ipcMain.handle(
      IPC_CHANNELS.LOGGER.LOG_PATH,
      this.handleGetLogPath.bind(this)
    );
  }

  private async handleGetLogs(
    event: IpcMainInvokeEvent,
    limit?: number,
    level?: string
  ): Promise<LoggerResponse> {
    try {
      const logs = await loggerService.getLogs(limit, level);
      const logSize = loggerService.getLogSize();
      
      return {
        success: true,
        data: {
          logs,
          size: logSize,
          sizeFormatted: this.formatBytes(logSize)
        }
      };
    } catch (error: any) {
      loggerService.error('Error getting logs', error);
      return {
        success: false,
        error: error.message || 'Failed to get logs'
      };
    }
  }

  private async handleClearLogs(
    event: IpcMainInvokeEvent
  ): Promise<LoggerResponse> {
    try {
      const result = await loggerService.clearLogs();
      
      if (result) {
        return {
          success: true,
          data: { message: 'Logs cleared successfully' }
        };
      } else {
        return {
          success: false,
          error: 'Failed to clear logs'
        };
      }
    } catch (error: any) {
      loggerService.error('Error clearing logs', error);
      return {
        success: false,
        error: error.message || 'Failed to clear logs'
      };
    }
  }

  private async handleExportLogs(
    event: IpcMainInvokeEvent
  ): Promise<LoggerResponse> {
    try {
      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Logs',
        defaultPath: path.join(
          app.getPath('desktop'),
          `touch-etiketten-logs-${new Date().toISOString().split('T')[0]}.log`
        ),
        filters: [
          { name: 'Log Files', extensions: ['log', 'txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return {
          success: false,
          error: 'Export cancelled'
        };
      }

      const exported = await loggerService.exportLogs(result.filePath);
      
      if (exported) {
        return {
          success: true,
          data: { 
            message: 'Logs exported successfully',
            path: result.filePath
          }
        };
      } else {
        return {
          success: false,
          error: 'Failed to export logs'
        };
      }
    } catch (error: any) {
      loggerService.error('Error exporting logs', error);
      return {
        success: false,
        error: error.message || 'Failed to export logs'
      };
    }
  }

  private async handleGetLogPath(
    event: IpcMainInvokeEvent
  ): Promise<LoggerResponse> {
    try {
      const logPath = loggerService.getLogPath();
      const logSize = loggerService.getLogSize();
      
      return {
        success: true,
        data: {
          path: logPath,
          size: logSize,
          sizeFormatted: this.formatBytes(logSize)
        }
      };
    } catch (error: any) {
      loggerService.error('Error getting log path', error);
      return {
        success: false,
        error: error.message || 'Failed to get log path'
      };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public cleanup(): void {
    ipcMain.removeHandler(IPC_CHANNELS.LOGGER.GET_LOGS);
    ipcMain.removeHandler(IPC_CHANNELS.LOGGER.CLEAR_LOGS);
    ipcMain.removeHandler(IPC_CHANNELS.LOGGER.EXPORT_LOGS);
    ipcMain.removeHandler(IPC_CHANNELS.LOGGER.LOG_PATH);
  }
}

export default LoggerHandler;