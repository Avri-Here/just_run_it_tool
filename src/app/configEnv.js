

const path = require('path'), os = require('os');


const isDevMode = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath) || process.argv[0].includes('node');

if (isDevMode) {
    process.env.IS_DEV_MODE = true;
}

process.env.BINARIES_DIR = path.join(os.homedir(), 'Documents', 'appsAndMore', 'binaries');
