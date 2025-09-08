# DateStamp

DateStamp is an Electron-based desktop application for printing date-stamped labels using Zebra label printers.

## Features

- Touch-optimized interface with prime number buttons (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37)
- Each button triggers label printing with the specified number of copies
- Designed for touch-screen terminals without keyboards
- Automatic date updating in labels
- PIN-protected settings (default: 1234)
- Support for German and English printer systems

## Tech Stack

- **Framework**: Electron React Boilerplate
- **Frontend**: React 18 with TypeScript
- **Bundler**: Webpack
- **Styling**: Touch-optimized CSS
- **Settings**: electron-settings for persistence
- **Logging**: electron-log with 7-day rotation

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/datestamp.git
cd datestamp
npm install
```

## Development

Start the app in development mode:

```bash
npm start
```

Build individual components:
```bash
npm run build:main     # Build main process only
npm run build:renderer # Build renderer process only
```

## Building for Production

Package the application for Linux AppImage:

```bash
npm run package
```

## Configuration

The application uses a settings system with PIN protection (default PIN: 1234). Settings include:
- Printer selection from system printers
- Label file path configuration
- Automatic date updating option

## License

MIT