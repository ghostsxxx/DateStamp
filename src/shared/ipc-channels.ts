export const IPC_CHANNELS = {
  SETTINGS: {
    GET: 'settings:get',
    UPDATE: 'settings:update',
    VALIDATE_PIN: 'settings:validatePin',
    RESET: 'settings:reset',
  },
  PRINTER: {
    LIST: 'printers:list',
    PRINT: 'printer:print',
    TEST: 'printer:test',
    STATUS: 'printer:status',
    QUEUE: 'printer:queue',
    CANCEL_JOBS: 'printer:cancelJobs',
  },
  LOGGER: {
    GET_LOGS: 'logger:getLogs',
    CLEAR_LOGS: 'logger:clearLogs',
    EXPORT_LOGS: 'logger:exportLogs',
    LOG_PATH: 'logger:getPath',
  },
  LEGACY: {
    PRINT: 'ipc-example',
  }
} as const;

export type IPCChannels = typeof IPC_CHANNELS;