

const { app } = require('electron');
const path = require('path'), os = require('os');


const isDevMode = !app.isPackaged;

console.log('isDevMode :', isDevMode);

if (isDevMode) {
    process.env.IS_DEV_MODE = true;
}

process.env.BINARIES_DIR = path.join(os.homedir(), 'Documents', 'appsAndMore', 'binaries');
process.env.ASSETS_DIR = isDevMode ? path.join(__dirname, '../assets') : process.resourcesPath;