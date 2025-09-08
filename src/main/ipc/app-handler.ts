import { ipcMain, app } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

export function registerAppHandlers() {
  ipcMain.handle('app:get-version', async () => {
    try {
      return { success: true, data: app.getVersion() };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });
}