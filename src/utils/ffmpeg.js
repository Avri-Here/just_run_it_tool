

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { ipcRenderer } = require('electron');
const { popUpProgressBar } = require('./popUpProgressBar');

// const isDev = process.defaultApp || /[\\/]electron[\\/]/.test(process.execPath) || process.argv[0].includes('node');

// const baseDir = isDev ? path.join(__dirname, '..', 'assets', 'binaries', 'misc') :
//     path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'assets', 'binaries', 'misc');

const ffmpegPath = path.join(process.env.BINARIES_DIR, 'misc', 'ffmpeg.exe');


const getFileExtension = (filePath) => path.extname(filePath).toLowerCase();

const convertMediaFile = (filePath) => {
    // popUpProgressBar(10, 'Converting media file ...', false);
    return new Promise((resolve, reject) => {
        try {
            if (!fs.existsSync(filePath)) {
                console.error('File does not exist:', filePath);
                reject(new Error('File does not exist'));
                return;
            }

            const ext = getFileExtension(filePath);
            let outputFormat, ffmpegCommand;

            const outputDir = path.join(path.dirname(filePath), 'compressed');

            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            if (['.mp3', '.wav', '.aac', '.flac', '.ogg', '.wma'].includes(ext)) {
                outputFormat = 'mp3';
                ffmpegCommand = `"${ffmpegPath}" -i "${filePath}" -y -codec:a libmp3lame -qscale:a 2 "${path.join(outputDir, path.basename(filePath, ext) + '.' + outputFormat)}"`;
            } else if (['.mp4', '.mkv', '.avi', '.mov', '.flv', '.wmv'].includes(ext)) {
                outputFormat = 'mp4';
                ffmpegCommand = `"${ffmpegPath}" -i "${filePath}" -y -vcodec libx264 -crf 23 -preset medium -acodec aac "${path.join(outputDir, path.basename(filePath, ext) + '.' + outputFormat)}"`;
            } else {
                console.error('Unsupported file format:', ext);
                reject(new Error('Unsupported file format '));
                return;
            }

            console.log('Executing command:', ffmpegCommand);

            // const command = `powershell -Command "Start-Process 'cmd.exe' -ArgumentList '/K ${ffmpegCommand}'"`;
            exec(ffmpegCommand, { stdio: 'inherit' }, (error, stdout, stderr) => {
                // exec(command, (error, stdout, stderr) => {
                // if (error) {
                // console.error(`Error: ${error.message}`);
                // reject(new Error(`Error: ${error.message}`));
                // } else if (stderr) {
                // console.error(`Stderr: ${stderr}`);
                // reject(new Error(`Stderr: ${stderr}`));
                // } else {
                console.log(`Command executed with code : ${error?.code || '0'} ..`);
                resolve(stdout);
                const notificationObj = {
                    title: error?.code ? `Error : ${error?.code}` : `Ffmpeg Command executed successfully  ..`,
                    // title: `Ffmpeg Command executed successfully  ..`,
                    body: `FileName : ${path.basename(filePath)} !`,
                    silent: false,
                    timeout: 7000
                }
                ipcRenderer.invoke('showNotification', notificationObj);

                // }
            });
        } catch (error) {
            console.error('Error:', error);
            // reject(error);
        }
    });
};



module.exports = { convertMediaFile };
