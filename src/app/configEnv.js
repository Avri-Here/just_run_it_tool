

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


const { join } = require('path');
const { app } = require('electron');
const homedir = require('os').homedir();


const isDevMode = !app.isPackaged;

console.log('isDevMode :', isDevMode);

if (isDevMode) process.env.IS_DEV_MODE = true;

process.env.BINARIES_DIR = join(homedir, 'Documents', 'myBackupFolder', 'binaries');
const assetsDir = isDevMode ? join(__dirname, '../assets') : join(process.resourcesPath, 'assets');


process.env.ASSETS_DIR = assetsDir;

