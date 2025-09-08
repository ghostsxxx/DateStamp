import settings from 'electron-settings';
import path from 'path';
import { app } from 'electron';
import logger from './logger';

export interface AppSettings {
  printer: {
    name: string;
    isManualEntry: boolean;
  };
  security: {
    pin: string;
  };
  label: {
    filePath: string;
    autoUpdateDate: boolean;
  };
  ui: {
    showStatusBar: boolean;
  };
}

class SettingsService {
  private static instance: SettingsService;
  private readonly DEFAULT_PIN = '1234';
  private readonly DEFAULT_SETTINGS: AppSettings = {
    printer: {
      name: 'Zebra_Technologies_ZTC_GK420d',
      isManualEntry: false,
    },
    security: {
      pin: this.DEFAULT_PIN,
    },
    label: {
      filePath: path.join(app.getPath('documents'), 'label.zpl'),
      autoUpdateDate: true,
    },
    ui: {
      showStatusBar: true,
    },
  };

  private constructor() {
    this.initializeSettings();
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private async initializeSettings(): Promise<void> {
    const existingSettings = await this.getAll();
    if (!existingSettings || Object.keys(existingSettings).length === 0) {
      await this.resetToDefaults();
    }
  }

  public async getAll(): Promise<AppSettings> {
    try {
      const allSettings = await settings.get() as AppSettings;
      return { ...this.DEFAULT_SETTINGS, ...allSettings };
    } catch (error) {
      console.error('Error reading settings:', error);
      return this.DEFAULT_SETTINGS;
    }
  }

  public async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    try {
      const value = await settings.get(key) as AppSettings[K];
      return value ?? this.DEFAULT_SETTINGS[key];
    } catch (error) {
      console.error(`Error reading setting ${key}:`, error);
      return this.DEFAULT_SETTINGS[key];
    }
  }

  public async set<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ): Promise<void> {
    try {
      const oldValue = await this.get(key);
      await settings.set(key, value);
      logger.logSettingsChange(key as string, oldValue, value);
    } catch (error) {
      logger.error(`Error setting ${key}:`, error);
      throw error;
    }
  }

  public async update(updates: Partial<AppSettings>): Promise<void> {
    try {
      const current = await this.getAll();
      const merged = this.deepMerge(current, updates);
      await settings.set(merged);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  public async resetToDefaults(): Promise<void> {
    try {
      await settings.set(this.DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  public async validatePin(pin: string): Promise<boolean> {
    try {
      const security = await this.get('security');
      return security.pin === pin;
    } catch (error) {
      console.error('Error validating PIN:', error);
      return false;
    }
  }

  public async setPrinter(printerName: string, isManualEntry: boolean = false): Promise<void> {
    await this.set('printer', {
      name: printerName,
      isManualEntry,
    });
  }

  public async getPrinter(): Promise<string> {
    const printer = await this.get('printer');
    return printer.name;
  }

  public async getLabelPath(): Promise<string> {
    const label = await this.get('label');
    return label.filePath;
  }

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}

const settingsService = SettingsService.getInstance();
export default settingsService;
export { AppSettings };