import { ipcMain, IpcMainInvokeEvent } from 'electron';
import settingsService, { AppSettings } from '../services/settings';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

export interface SettingsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class SettingsHandler {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    ipcMain.handle(
      IPC_CHANNELS.SETTINGS.GET,
      this.handleGetSettings.bind(this)
    );

    ipcMain.handle(
      IPC_CHANNELS.SETTINGS.UPDATE,
      this.handleUpdateSettings.bind(this)
    );

    ipcMain.handle(
      IPC_CHANNELS.SETTINGS.VALIDATE_PIN,
      this.handleValidatePin.bind(this)
    );

    ipcMain.handle(
      IPC_CHANNELS.SETTINGS.RESET,
      this.handleResetSettings.bind(this)
    );
  }

  private async handleGetSettings(
    event: IpcMainInvokeEvent
  ): Promise<SettingsResponse> {
    try {
      const settings = await settingsService.getAll();
      return {
        success: true,
        data: settings,
      };
    } catch (error: any) {
      console.error('Error getting settings:', error);
      return {
        success: false,
        error: error.message || 'Failed to get settings',
      };
    }
  }

  private async handleUpdateSettings(
    event: IpcMainInvokeEvent,
    updates: Partial<AppSettings>
  ): Promise<SettingsResponse> {
    try {
      await settingsService.update(updates);
      return {
        success: true,
        data: await settingsService.getAll(),
      };
    } catch (error: any) {
      console.error('Error updating settings:', error);
      return {
        success: false,
        error: error.message || 'Failed to update settings',
      };
    }
  }

  private async handleValidatePin(
    event: IpcMainInvokeEvent,
    pin: string
  ): Promise<SettingsResponse> {
    try {
      const isValid = await settingsService.validatePin(pin);
      return {
        success: true,
        data: { isValid },
      };
    } catch (error: any) {
      console.error('Error validating PIN:', error);
      return {
        success: false,
        error: error.message || 'Failed to validate PIN',
      };
    }
  }

  private async handleResetSettings(
    event: IpcMainInvokeEvent
  ): Promise<SettingsResponse> {
    try {
      await settingsService.resetToDefaults();
      return {
        success: true,
        data: await settingsService.getAll(),
      };
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset settings',
      };
    }
  }

  public cleanup(): void {
    ipcMain.removeHandler(IPC_CHANNELS.SETTINGS.GET);
    ipcMain.removeHandler(IPC_CHANNELS.SETTINGS.UPDATE);
    ipcMain.removeHandler(IPC_CHANNELS.SETTINGS.VALIDATE_PIN);
    ipcMain.removeHandler(IPC_CHANNELS.SETTINGS.RESET);
  }
}

export default SettingsHandler;