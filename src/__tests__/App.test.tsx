import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import App from '../renderer/App';

// Mock window.electron
beforeAll(() => {
  Object.defineProperty(window, 'electron', {
    value: {
      ipcRenderer: {
        sendMessage: jest.fn(),
        on: jest.fn(() => jest.fn()), // Return a mock function for removeListener
        once: jest.fn(),
        invoke: jest.fn(() => Promise.resolve({ success: true, data: {} })),
        removeAllListeners: jest.fn(),
      },
    },
    writable: true,
  });
});

describe('App', () => {
  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });
});
