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
  UPDATER: {
    CHECK: 'updater:check',
    RESTART: 'updater:restart',
    GET_STATUS: 'updater:get-status',
  },
  APP: {
    GET_VERSION: 'app:get-version',
  },
  LEGACY: {
    PRINT: 'ipc-example',
  },
} as const;

export type IPCChannels = typeof IPC_CHANNELS;
