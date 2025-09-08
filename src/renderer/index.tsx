import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (_arg) => {
  // eslint-disable-next-line no-console
  // Log(arg);
});
// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
