import { ipcMain } from 'electron';
import updaterService from '../services/updater';
import logger from '../services/logger';

export function registerUpdaterHandlers() {
  ipcMain.handle('updater:check', async () => {
    try {
      await updaterService.checkForUpdates();
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to check for updates:', errorMessage);
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('updater:restart', async () => {
    try {
      updaterService.quitAndInstall();
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to restart and install update:', errorMessage);
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('updater:get-status', async () => {
    try {
      const status = updaterService.getStatus();
      return { success: true, data: status };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get update status:', errorMessage);
      return { success: false, error: errorMessage };
    }
  });
}
