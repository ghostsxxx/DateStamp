// Check if the renderer and main bundles are built
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

// Skip build check in CI environment or when running tests
if (process.env.CI || process.env.NODE_ENV === 'test') {
  console.log('Skipping build check in CI/test environment');
} else {
  // Only import webpack paths and check builds when not in CI
  const webpackPaths = require('../configs/webpack.paths').default;
  
  const mainPath = path.join(webpackPaths.distMainPath, 'main.js');
  const rendererPath = path.join(webpackPaths.distRendererPath, 'renderer.js');

  if (!fs.existsSync(mainPath)) {
    throw new Error(
      chalk.whiteBright.bgRed.bold(
        'The main process is not built yet. Build it by running "npm run build:main"',
      ),
    );
  }

  if (!fs.existsSync(rendererPath)) {
    throw new Error(
      chalk.whiteBright.bgRed.bold(
        'The renderer process is not built yet. Build it by running "npm run build:renderer"',
      ),
    );
  }
}
