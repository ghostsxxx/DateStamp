import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import settingsService from './settings';
import logger from './logger';

const execAsync = promisify(exec);

export interface Printer {
  name: string;
  status: string;
  isDefault: boolean;
}

export interface PrintResult {
  success: boolean;
  message: string;
  jobId?: string;
  error?: string;
}

class PrinterService {
  private static instance: PrinterService;

  private constructor() {}

  public static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  public async listPrinters(): Promise<Printer[]> {
    try {
      logger.debug('Listing available printers');
      
      // Run lpstat commands separately for better compatibility
      let printersOutput = '';
      let defaultOutput = '';
      
      try {
        const printerResult = await execAsync('lpstat -p');
        printersOutput = printerResult.stdout;
        logger.debug('lpstat -p output:', printersOutput);
      } catch (error: any) {
        logger.error('Error running lpstat -p:', error.message);
      }
      
      try {
        const defaultResult = await execAsync('lpstat -d');
        defaultOutput = defaultResult.stdout;
        logger.debug('lpstat -d output:', defaultOutput);
      } catch (error: any) {
        logger.debug('Error getting default printer:', error.message);
      }
      
      const lines = printersOutput.split('\n').filter(line => line.trim());
      
      const printers: Printer[] = [];
      let defaultPrinter = '';
      
      // Parse default printer from separate output
      if (defaultOutput) {
        if (defaultOutput.includes('system default destination:')) {
          defaultPrinter = defaultOutput.split('system default destination:')[1].trim();
        } else if (defaultOutput.includes('Standardzielort:')) {
          // German: "System-Standardzielort: PrinterName"
          defaultPrinter = defaultOutput.split('Standardzielort:')[1].trim();
        } else if (defaultOutput.includes('Standardziel:')) {
          defaultPrinter = defaultOutput.split('Standardziel:')[1].trim();
        }
        logger.debug('Default printer detected:', defaultPrinter);
      }
      
      logger.debug('Processing', lines.length, 'lines');
      
      for (const line of lines) {
        // Handle both English and German output
        if (line.startsWith('printer ') || line.startsWith('Drucker ')) {
          let name = '';
          let status = 'unknown';
          
          if (line.startsWith('printer ')) {
            // English format: "printer PrinterName is idle..."
            const parts = line.split(' ');
            name = parts[1];
            status = line.includes('is idle') ? 'idle' : 
                    line.includes('is printing') ? 'printing' : 'unknown';
          } else if (line.startsWith('Drucker ')) {
            // German format: 'Drucker „PrinterName" ist inaktiv...'
            // The quotes are Unicode: „ (U+201E) and " (U+201C)
            logger.debug('Trying to match German format, line:', line);
            
            // Remove "Drucker " prefix (8 characters)
            const afterDrucker = line.substring(8);
            
            // Look for the specific Unicode quotes used in German lpstat output
            // Opening quote: „ (U+201E - DOUBLE LOW-9 QUOTATION MARK)
            // Closing quote: " (U+201C - LEFT DOUBLE QUOTATION MARK)
            const openQuote = '„';
            const closeQuote = '"';
            
            // Find the opening and closing quotes
            const openIndex = afterDrucker.indexOf(openQuote);
            const closeIndex = afterDrucker.indexOf(closeQuote);
            
            if (openIndex !== -1 && closeIndex !== -1 && closeIndex > openIndex) {
              // Extract printer name between the quotes
              name = afterDrucker.substring(openIndex + 1, closeIndex);
              status = line.includes('ist inaktiv') ? 'idle' : 
                      line.includes('druckt') ? 'printing' : 
                      line.includes('ist offline') ? 'offline' : 'unknown';
              logger.debug('Found printer:', name, 'status:', status);
            } else {
              // Fallback: try other quote patterns
              logger.debug('Unicode quotes not found, trying other patterns');
              
              // Try ASCII quotes or other variations
              const patterns = [
                /"([^"]+)"/,  // ASCII double quotes
                /'([^']+)'/,  // ASCII single quotes
                /„([^"]+)"/,  // German quotes with Unicode
                /«([^»]+)»/,  // French quotes
                /‚([^']+)'/   // German single quotes
              ];
              
              let matched = false;
              for (const pattern of patterns) {
                const match = afterDrucker.match(pattern);
                if (match) {
                  name = match[1];
                  status = line.includes('ist inaktiv') ? 'idle' : 
                          line.includes('druckt') ? 'printing' : 
                          line.includes('ist offline') ? 'offline' : 'unknown';
                  logger.debug('Found printer via pattern:', name, 'status:', status);
                  matched = true;
                  break;
                }
              }
              
              if (!matched) {
                logger.debug('Could not parse printer from line:', line);
              }
            }
          }
          
          if (name) {
            printers.push({
              name,
              status,
              isDefault: false
            });
          }
        }
      }
      
      printers.forEach(printer => {
        printer.isDefault = printer.name === defaultPrinter;
      });
      
      // If no printers found, add a helpful message
      if (printers.length === 0) {
        logger.warn('No printers detected by lpstat');
        // Still check for the default Zebra printer
        try {
          const { stdout: statusOut } = await execAsync('lpstat -p "Zebra_Technologies_ZTC_GK420d" 2>&1');
          if (statusOut && !statusOut.includes('does not exist')) {
            printers.push({
              name: 'Zebra_Technologies_ZTC_GK420d',
              status: statusOut.includes('is idle') ? 'idle' : 'unknown',
              isDefault: true
            });
          }
        } catch (e) {
          // Zebra printer not found
        }
        
        if (printers.length === 0) {
          printers.push({
            name: 'No printers detected',
            status: 'unknown',
            isDefault: false
          });
        }
      }
      
      logger.info(`Found ${printers.length} printer(s)`, { count: printers.length, default: defaultPrinter });
      return printers;
    } catch (error: any) {
      logger.error('Error listing printers', error);
      // Return a message instead of empty array
      return [{
        name: 'Error detecting printers',
        status: 'error',
        isDefault: false
      }];
    }
  }

  public async printLabel(copies: number = 1): Promise<PrintResult> {
    try {
      const printerName = await settingsService.getPrinter();
      const labelPath = await settingsService.getLabelPath();
      
      logger.info('Starting print job', { printer: printerName, copies, labelPath });
      
      const labelSettings = await settingsService.get('label');
      if (labelSettings.autoUpdateDate) {
        await this.updateLabelDate(labelPath);
        logger.debug('Label date updated');
      }
      
      if (!fs.existsSync(labelPath)) {
        const error = `Label file not found: ${labelPath}`;
        logger.error(error);
        logger.logPrintOperation(printerName, copies, false, 'FILE_NOT_FOUND');
        return {
          success: false,
          message: error,
          error: 'FILE_NOT_FOUND'
        };
      }
      
      const command = `lp -n ${copies} -d "${printerName}" -o raw "${labelPath}"`;
      logger.debug('Executing print command', { command });
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('request id is')) {
        logger.error('Print command failed', { stderr });
        logger.logPrintOperation(printerName, copies, false, stderr);
        return {
          success: false,
          message: `Print failed: ${stderr}`,
          error: 'PRINT_FAILED'
        };
      }
      
      const jobIdMatch = stdout.match(/request id is ([\w-]+)/);
      const jobId = jobIdMatch ? jobIdMatch[1] : undefined;
      
      logger.info('Print job completed', { jobId, copies });
      logger.logPrintOperation(printerName, copies, true);
      
      return {
        success: true,
        message: `Printed ${copies} label(s) successfully`,
        jobId
      };
    } catch (error: any) {
      logger.error('Error printing label', error);
      const printerName = await settingsService.getPrinter();
      logger.logPrintOperation(printerName, copies, false, error.message);
      return {
        success: false,
        message: error.message || 'Unknown print error',
        error: 'PRINT_ERROR'
      };
    }
  }

  public async testPrint(printerName: string): Promise<PrintResult> {
    try {
      const testContent = `^XA
^FO50,50^A0N,40,40^FDTest Print^FS
^FO50,100^A0N,30,30^FD${new Date().toLocaleString()}^FS
^FO50,150^A0N,30,30^FDPrinter: ${printerName}^FS
^XZ`;
      
      const tempPath = path.join(app.getPath('temp'), 'test-label.zpl');
      fs.writeFileSync(tempPath, testContent);
      
      const command = `lp -n 1 -d "${printerName}" -o raw "${tempPath}"`;
      const { stdout, stderr } = await execAsync(command);
      
      fs.unlinkSync(tempPath);
      
      if (stderr && !stderr.includes('request id is')) {
        return {
          success: false,
          message: `Test print failed: ${stderr}`,
          error: 'TEST_PRINT_FAILED'
        };
      }
      
      return {
        success: true,
        message: 'Test print sent successfully'
      };
    } catch (error: any) {
      console.error('Error in test print:', error);
      return {
        success: false,
        message: error.message || 'Test print failed',
        error: 'TEST_PRINT_ERROR'
      };
    }
  }

  public async validatePrinter(printerName: string): Promise<boolean> {
    try {
      const printers = await this.listPrinters();
      return printers.some(p => p.name === printerName);
    } catch (error) {
      console.error('Error validating printer:', error);
      return false;
    }
  }

  public async getPrinterStatus(printerName: string): Promise<string> {
    try {
      const { stdout } = await execAsync(`lpstat -p "${printerName}"`);
      if (stdout.includes('is idle')) return 'idle';
      if (stdout.includes('is printing')) return 'printing';
      if (stdout.includes('disabled')) return 'disabled';
      return 'unknown';
    } catch (error) {
      console.error('Error getting printer status:', error);
      return 'error';
    }
  }

  private async updateLabelDate(labelPath: string): Promise<void> {
    try {
      const data = fs.readFileSync(labelPath, 'utf8');
      const currentDate = this.getCurrentDate();
      const updatedContent = data.replace(/\d{2}\.\d{2}\./, currentDate);
      fs.writeFileSync(labelPath, updatedContent, 'utf8');
    } catch (error) {
      console.error('Error updating label date:', error);
      throw error;
    }
  }

  private getCurrentDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.`;
  }

  public async checkPrintQueue(printerName?: string): Promise<number> {
    try {
      const printer = printerName || await settingsService.getPrinter();
      const { stdout } = await execAsync(`lpstat -o "${printer}" | wc -l`);
      return parseInt(stdout.trim(), 10);
    } catch (error) {
      console.error('Error checking print queue:', error);
      return 0;
    }
  }

  public async cancelAllJobs(printerName?: string): Promise<boolean> {
    try {
      const printer = printerName || await settingsService.getPrinter();
      await execAsync(`cancel -a "${printer}"`);
      return true;
    } catch (error) {
      console.error('Error canceling print jobs:', error);
      return false;
    }
  }
}

export default PrinterService.getInstance();