import { ipcMain, IpcMainInvokeEvent, IpcMainEvent } from 'electron';
import printerService from '../services/printer';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

export interface PrinterResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class PrinterHandler {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    ipcMain.handle(
      IPC_CHANNELS.PRINTER.LIST,
      this.handleListPrinters.bind(this),
    );

    ipcMain.handle(IPC_CHANNELS.PRINTER.TEST, this.handleTestPrint.bind(this));

    ipcMain.handle(
      IPC_CHANNELS.PRINTER.STATUS,
      this.handleGetPrinterStatus.bind(this),
    );

    ipcMain.handle(
      IPC_CHANNELS.PRINTER.QUEUE,
      this.handleGetPrintQueue.bind(this),
    );

    ipcMain.handle(
      IPC_CHANNELS.PRINTER.CANCEL_JOBS,
      this.handleCancelJobs.bind(this),
    );

    // Keep legacy handler for backward compatibility
    ipcMain.on(IPC_CHANNELS.LEGACY.PRINT, this.handleLegacyPrint.bind(this));

    // New promise-based print handler
    ipcMain.handle(IPC_CHANNELS.PRINTER.PRINT, this.handlePrint.bind(this));
  }

  private async handleListPrinters(
    _event: IpcMainInvokeEvent,
  ): Promise<PrinterResponse> {
    try {
      const printers = await printerService.listPrinters();
      return {
        success: true,
        data: printers,
      };
    } catch (error: any) {
      // Error('Error listing printers:', error);
      return {
        success: false,
        error: error.message || 'Failed to list printers',
      };
    }
  }

  private async handlePrint(
    _event: IpcMainInvokeEvent,
    copies: number,
  ): Promise<PrinterResponse> {
    try {
      const result = await printerService.printLabel(copies);
      return {
        success: result.success,
        data: result,
        error: result.error,
      };
    } catch (error: any) {
      // Error('Error printing:', error);
      return {
        success: false,
        error: error.message || 'Failed to print',
      };
    }
  }

  private async handleLegacyPrint(
    event: IpcMainEvent,
    copies: number,
  ): Promise<void> {
    try {
      // Print request for copies
      const result = await printerService.printLabel(copies);

      if (result.success) {
        // Log: result.message
        event.reply(IPC_CHANNELS.LEGACY.PRINT, result.message);
      } else {
        // Error: Print failed
        event.reply(IPC_CHANNELS.LEGACY.PRINT, `Error: ${result.message}`);
      }
    } catch (error: any) {
      // Error in legacy print handler
      event.reply(IPC_CHANNELS.LEGACY.PRINT, `Error: ${error.message}`);
    }
  }

  private async handleTestPrint(
    _event: IpcMainInvokeEvent,
    printerName: string,
  ): Promise<PrinterResponse> {
    try {
      const result = await printerService.testPrint(printerName);
      return {
        success: result.success,
        data: result,
        error: result.error,
      };
    } catch (error: any) {
      // Error('Error in test print:', error);
      return {
        success: false,
        error: error.message || 'Test print failed',
      };
    }
  }

  private async handleGetPrinterStatus(
    _event: IpcMainInvokeEvent,
    printerName: string,
  ): Promise<PrinterResponse> {
    try {
      const status = await printerService.getPrinterStatus(printerName);
      return {
        success: true,
        data: { status },
      };
    } catch (error: any) {
      // Error('Error getting printer status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get printer status',
      };
    }
  }

  private async handleGetPrintQueue(
    _event: IpcMainInvokeEvent,
    printerName?: string,
  ): Promise<PrinterResponse> {
    try {
      const queueSize = await printerService.checkPrintQueue(printerName);
      return {
        success: true,
        data: { queueSize },
      };
    } catch (error: any) {
      // Error('Error checking print queue:', error);
      return {
        success: false,
        error: error.message || 'Failed to check print queue',
      };
    }
  }

  private async handleCancelJobs(
    _event: IpcMainInvokeEvent,
    printerName?: string,
  ): Promise<PrinterResponse> {
    try {
      const result = await printerService.cancelAllJobs(printerName);
      return {
        success: result,
        data: { cancelled: result },
      };
    } catch (error: any) {
      // Error('Error canceling print jobs:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel print jobs',
      };
    }
  }

  public cleanup(): void {
    ipcMain.removeHandler(IPC_CHANNELS.PRINTER.LIST);
    ipcMain.removeHandler(IPC_CHANNELS.PRINTER.PRINT);
    ipcMain.removeHandler(IPC_CHANNELS.PRINTER.TEST);
    ipcMain.removeHandler(IPC_CHANNELS.PRINTER.STATUS);
    ipcMain.removeHandler(IPC_CHANNELS.PRINTER.QUEUE);
    ipcMain.removeHandler(IPC_CHANNELS.PRINTER.CANCEL_JOBS);
    ipcMain.removeAllListeners(IPC_CHANNELS.LEGACY.PRINT);
  }
}

export default PrinterHandler;
