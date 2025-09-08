import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import logger from './logger';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseName?: string;
  releaseNotes?: string;
}

export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloadProgress?: number;
  downloaded: boolean;
  error?: string;
  updateInfo?: UpdateInfo;
}

class UpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private status: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
  };

  initialize(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;

    autoUpdater.logger = logger;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    this.setupEventHandlers();
    this.startPeriodicChecks();

    this.checkForUpdates();
  }

  private setupEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      logger.info('Checking for updates...');
      this.status = { ...this.status, checking: true, error: undefined };
      this.sendStatusUpdate();
    });

    autoUpdater.on('update-available', (info) => {
      logger.info('Update available:', info);
      this.status = {
        ...this.status,
        checking: false,
        available: true,
        updateInfo: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseName: info.releaseName,
          releaseNotes: info.releaseNotes,
        },
      };
      this.sendStatusUpdate();
      this.sendToastNotification('info', `New version ${info.version} is available and will be downloaded.`);
    });

    autoUpdater.on('update-not-available', () => {
      logger.info('Update not available');
      this.status = { ...this.status, checking: false, available: false };
      this.sendStatusUpdate();
    });

    autoUpdater.on('error', (err) => {
      logger.error('Update error:', err);
      this.status = {
        ...this.status,
        checking: false,
        downloading: false,
        error: err.message,
      };
      this.sendStatusUpdate();
    });

    autoUpdater.on('download-progress', (progressObj) => {
      logger.debug('Download progress:', progressObj.percent);
      this.status = {
        ...this.status,
        downloading: true,
        downloadProgress: progressObj.percent,
      };
      this.sendStatusUpdate();
    });

    autoUpdater.on('update-downloaded', (info) => {
      logger.info('Update downloaded:', info);
      this.status = {
        ...this.status,
        downloading: false,
        downloaded: true,
        updateInfo: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseName: info.releaseName,
          releaseNotes: info.releaseNotes,
        },
      };
      this.sendStatusUpdate();
      this.sendToastNotification('success', `Version ${info.version} downloaded. Restart to apply update.`);
    });
  }

  private startPeriodicChecks() {
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, 60 * 60 * 1000);
  }

  private sendStatusUpdate() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', this.status);
    }
  }

  private sendToastNotification(type: 'success' | 'error' | 'info' | 'warning', message: string) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('show-toast', { type, message });
    }
  }

  public async checkForUpdates(): Promise<void> {
    try {
      if (!this.status.downloading && !this.status.downloaded) {
        await autoUpdater.checkForUpdatesAndNotify();
      }
    } catch (error) {
      logger.error('Failed to check for updates:', error);
      this.status = {
        ...this.status,
        checking: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.sendStatusUpdate();
    }
  }

  public quitAndInstall(): void {
    if (this.status.downloaded) {
      autoUpdater.quitAndInstall();
    }
  }

  public getStatus(): UpdateStatus {
    return this.status;
  }

  public cleanup() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}

const updaterService = new UpdaterService();

export default updaterService;