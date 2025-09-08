# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DateStamp is an Electron-based desktop application for printing labels using Zebra label printers. The app displays prime number buttons (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37) that trigger label printing with the specified number of copies. The application is designed for touch-screen terminals without keyboards.

## Tech Stack

- **Framework**: Electron React Boilerplate
- **Frontend**: React 18 with TypeScript
- **Bundler**: Webpack
- **Main Process**: Electron with TypeScript
- **Styling**: CSS (Touch-optimized)
- **Testing**: Jest with React Testing Library
- **Settings**: electron-settings for persistence
- **Logging**: electron-log with 7-day rotation
- **IPC**: Type-safe IPC handlers with structured responses

## Common Commands

```bash
# Development
npm start              # Start the app in development mode
npm run start:main     # Start main process only
npm run start:renderer # Start renderer process only

# Building
npm run build          # Build both main and renderer
npm run build:main     # Build main process only
npm run build:renderer # Build renderer process only
npm run package        # Build and package for Linux AppImage

# Code Quality
npm run lint           # Run ESLint
npm test              # Run Jest tests
```

## Architecture

### Main Process (`src/main/`)
- **main.ts**: Entry point, initializes IPC handlers, window management
- **menu.ts**: Application menu configuration with settings access
- **preload.ts**: Bridge between main and renderer processes (exposes IPC methods)
- **util.ts**: Helper utilities

#### Services (`src/main/services/`)
- **settings.ts**: Settings management with PIN protection (default: 1234)
- **printer.ts**: Printer enumeration, printing, queue management (supports German lpstat output)
- **logger.ts**: Structured logging with automatic rotation

#### IPC Handlers (`src/main/ipc/`)
- **settings-handler.ts**: Settings CRUD operations with PIN validation
- **printer-handler.ts**: Printer operations and status checking
- **logger-handler.ts**: Log viewing, filtering, and export

### Renderer Process (`src/renderer/`)
- **App.tsx**: Main component with prime number buttons, integrates all UI components
- **index.tsx**: React entry point
- **App.css**: Application styles

#### Components (`src/renderer/components/`)
Touch-optimized components with minimum sizes:
- **GearIcon**: Settings access button (50x50px, bottom-right corner)
- **PinDialog**: 4-digit PIN entry with numeric keypad (60x60px buttons)
- **OnScreenKeyboard**: Full QWERTY keyboard for text input (45x45px keys)
- **SettingsModal**: Fullscreen settings with printer configuration
- **Toast**: Notification system (success/error/info/warning)
- **LogViewer**: Log display with search, filter, and export
- **StatusBar**: Printer status and last print info

### Shared (`src/shared/`)
- **ipc-channels.ts**: Type-safe IPC channel definitions

## Key Features

### Settings System
- **PIN Protection**: 4-digit PIN (default: 1234, hardcoded)
- **Printer Configuration**: Select from system printers or manual entry
- **Label Path**: Configurable label file location
- **Auto-Update Date**: Option to update date in label before printing
- **Persistence**: Settings saved using electron-settings

### Printing System
- **Printer Discovery**: Automatic enumeration via lpstat (supports German output with Unicode quotes)
- **Print Commands**: Uses `lp` command with raw mode for ZPL
- **Queue Management**: Check and cancel print jobs
- **Test Print**: Send test labels to verify configuration
- **Error Handling**: Structured error responses with logging

### Logging System
- **Structured Logs**: Timestamp, level, context, and message
- **Rotation**: 7-day retention, 10MB file size limit
- **Levels**: debug, info, warn, error
- **Special Logs**: Print operations, settings changes, system info
- **Export**: Save logs to file with save dialog
- **Live Viewing**: Real-time log viewer with filtering

### Touch UI Design
- **Button Sizes**: 
  - Primary: 60x60px minimum
  - Secondary: 44x44px minimum
  - Keyboard keys: 45x45px
- **No Hover States**: Touch-only interactions
- **Large Fonts**: 16-20px for readability
- **Fullscreen Modals**: Maximize screen usage
- **On-Screen Input**: Virtual keyboard for text entry

## International Support

The application handles German system output:
- Printer names with Unicode quotes („ and ")
- German status messages (inaktiv, druckt, offline)
- Proper parsing of localized lpstat output

## Security Notes

- PIN is stored as plain text (acceptable for kiosk environment)
- Default PIN: 1234 (hardcoded in settings)
- No network authentication required

## Build Configuration
- Webpack configs in `.erb/configs/`
- Electron Builder configuration in package.json
- Outputs to `release/build/` directory

## Troubleshooting

### Empty Printer List
- Check lpstat output format (English vs German)
- Verify CUPS service is running
- Check printer name parsing in logs

### PIN Validation Errors
- Ensure preload.ts exposes invoke method
- Check IPC handler registration in main.ts

### Touch Issues
- Verify button sizes meet minimum requirements
- Check CSS for proper touch-target sizing