

const { promisify } = require('util');
const console = require('electron-log');
const { exec, spawn } = require('child_process');
const path = require('path'), { ipcRenderer } = require('electron');


const containsExclamationMark = path.join(require('os').homedir(), 'Desktop').includes('!');
const desktopPath = containsExclamationMark ? 'C:\\' : path.join(require('os').homedir(), 'Desktop');


const executeCommand = (command) => {

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error}`);
                reject(new Error(`Error: ${error.message}`));
            } else if (stderr) {
                console.error(`Error: ${error}`);
                reject(new Error(`Stderr: ${stderr}`));
            } else {
                console.log(`Command executed successfully: ${stdout}`);
                resolve(stdout);
            }
        });
    });
}

const getCommandBaseType = (fullPath) => {

    const type = path.extname(fullPath);
    const fileName = path.basename(fullPath);

    switch (type) {
        case '.py':
            return {
                fullPathCommand: `python "${fullPath}"`,
                filePathCommand: `python "${fileName}"`
            };
        case '.ps1':
            return {
                fullPathCommand: `powershell -File "${fullPath}"`,
                filePathCommand: `powershell -File "${fileName}"`
            };
        case '.bat':
            return {
                fullPathCommand: `"${fullPath}"`,
                filePathCommand: fileName
            };
        case '.js':
            return {
                fullPathCommand: `node --watch "${fullPath}"`,
                filePathCommand: `node --watch "${fileName}"`
            };
        default:
            return {
                fullPathCommand: `"${fullPath}"`,
                filePathCommand: fileName
            };
    }
}

const openCmdInNewTabOrWindowFolder = async (command) => {


    exec(`wt -w 0 nt cmd /k ${command}`, (err) => {
        if (err) {
            console.error('Error opening new tab in Windows Terminal:', err);
        }
    });
};

const openCmdInNewTabOrWindow = async (filePath, commandToRun) => {

    console.log(`dirPath : ${filePath}`);

    const command = `wt -w 0 nt cmd /k cd /d "${filePath}" & ${commandToRun}`;

    exec(command, (err) => {
        if (err) {
            console.error('Error opening new tab in Windows Terminal:', err);
        }
    });
};

const openCmdInNewTabOrWindowAsAdmin = async (command) => {

    const adminCommand = `powershell -Command "Start-Process 'cmd.exe' -ArgumentList '/K ${command}' -Verb RunAs"`;

    exec(adminCommand, (err, stdout, stderr,) => {
        if (err) {
            console.error('Error running command as admin :', err);
            throw err;
        }
        if (stderr) {
            console.error('Error running command as admin :', stderr);
            throw stderr;
        }
        console.log(`Command executed successfully: ${stdout}`);
        return stdout;
    });
};


const openFileDirectly = (filePath) => {
    exec(`start "" "${filePath}"`, (err) => {
        if (err) {
            console.error('Error opening file :', err);
        }
    });
};


const openPowerShellAsAdmin = async () => {

    try {

        const command = `powershell -Command "Start-Process PowerShell -ArgumentList '-NoExit', '-Command', 'cd ${desktopPath}' -Verb RunAs"`;
        await executeCommand(command);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
};

const openPowerShellNoAdmin = async () => {

    try {

        const command = `powershell -Command "Start-Process PowerShell -ArgumentList '-NoExit', '-Command', 'cd ${desktopPath}' "`;
        console.log(command);

        await executeCommand(command);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
};


const openCmdAsAdmin = async () => {

    try {
        const command = `powershell -Command "Start-Process cmd -ArgumentList '/K', 'title Command Prompt & cd /d ${desktopPath}' -Verb RunAs"`;
        await executeCommand(command);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
};

const openCmdNoAdmin = async () => {

    try {
        const command = `powershell -Command "Start-Process cmd -ArgumentList '/K', 'title Command Prompt & cd /d ${desktopPath}'"`;
        await executeCommand(command);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
};

const runExeAndCloseCmd = async (exeName, params, exeDir = 'misc') => {

    const exePath = path.join(process.env.BINARIES_DIR, exeDir, exeName);

    try {

        const command = `powershell -Command "Start-Process '${exePath}' -ArgumentList '${params}' -NoNewWindow -Wait"`;
        const output = await executeCommand(command);
        console.log(`runExeAndCloseCmd Output : ${output}`);
        return output;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        throw new Error(`Error: ${err.message}`);
    }
};

const runPowerShellFile = (ps1FilePath) => {

    const PowerShell = require("powershell");

    return new Promise((resolve, reject) => {

        const ps = new PowerShell(`& "${ps1FilePath}"`);

        let output = '';
        ps.on("output", data => {
            output += data;
        });

        ps.on("error-output", err => {
            console.error(err)
            reject(err);
        });

        ps.on("error", err => {
            console.error(err)
            reject(err);
        });

        ps.on("end", code => {
            if (code === 0) {
                console.log(`PowerShell script finished with exit code ${code} - Sec`);
                resolve(output);

            } else {
                console.error(`PowerShell script finished with exit code ${code} `);
                reject(err || `PowerShell script finished with exit code ${code} `);
            }
        });
    });


};

const runPsCommand = async (commands = []) => {

    const shell = require('node-powershell');

    const ps = new shell({ executionPolicy: 'Bypass', noProfile: true });


    commands.forEach(command => { ps.addCommand(command) });

    try {

        const output = await ps.invoke();
        console.log('runPsCommand Output :', output);
        return output;

    } catch (err) {
        console.error('runPsCommand Error :', err);
        throw err;
    }
    finally {
        ps.dispose();
    }


}


// Spawn make it keep on the process running even after the parent process dies .

const executeCommandWithSpawn = (exePath, params = []) => {

    console.log('Executing command with spawn :', exePath, params);
    // const child = spawn(exePath, params, { shell: true, stdio: 'inherit', detached: true });
    const child = spawn(exePath, params, { detached: false, stdio: 'ignore' });
    child.unref();
    return child.pid;
}


// As admin via Spawn and PS, will close the cmd window after the exe is executed and will stay open even after the parent process dies ..
const runExeFileAsAdmin = (exePath) => {

    const child = spawn('powershell.exe',
        ['-Command', `Start-Process -FilePath "${exePath}" -Verb RunAs`], {
        shell: true,
        detached: true,
        stdio: 'ignore'
    });
    child.unref();
};


// run it from the electron app will close if the app is closed - this funk first open the cmd and then run the exe file .. like in real life ..

const openCmdAndRunFromThere = (command, params = []) => {

    const cdIntoDir = path.dirname(command);


    // if you want make it open on new window not matter what ..
    // exec(`start cmd.exe /K "cd /d ${exeDir} && ${path.basename(command)} ${params}"`, (error, stdout, stderr) => {


    //if you want make it open on new tab if the terminal is already open ..
    exec(`wt -w 0 nt cmd.exe /K "cd /d ${cdIntoDir} && ${command} ${params}"`,
        (error, stdout, stderr) => {

            if (error) {
                console.error(`Error executing file : ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Error output : ${stderr}`);
                return;
            }
            console.log(`Output : ${stdout}`);
        });
}


const openCmdAndRunOnEnter = async (waitForInput, runWithInput, exePath) => {

    const openCmdAndWaitForInput = `start cmd.exe /K "cd /d ${path.dirname(exePath)} && ${waitForInput} ${runWithInput}" `;
    // const exeDir = path.dirname(exePath);

    return new Promise((resolve, reject) => {
        exec(
            openCmdAndWaitForInput,
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing file: ${error.message}`);
                    reject(new Error(`Error executing file: ${error.message}`));
                    return;
                }
                if (stderr) {
                    console.error(`Error output: ${stderr}`);
                    reject(new Error(`Error output: ${stderr}`));
                    return;
                }
                console.log(`Output: ${stdout}`);
                resolve(stdout);
            }
        );
    });
};

// Pass the name of the exe file , like vlcPortable.exe ...
const isExeRunningOnWindows = async (exeName) => {
    const execAsync = promisify(exec);
    try {
        const command = `tasklist /FI "IMAGENAME eq ${exeName}"`;
        const { stdout } = await execAsync(command);
        // console.log('isExeRunningOnWindows stdout :', stdout);
        return stdout.includes(exeName);

    } catch (error) {
        console.error('Error in isExeRunningOnWindows :', error);
        return 'off';
    }
};

const timeOutPromise = () => {
    return new Promise(resolve => {
        setTimeout(() => { resolve('timeOut') }, 2000);
    })
}

const runIsolatedCommandAsAdmin = (typeIt = 'color 4') => {
    return new Promise(resolve => {
        const command = `powershell -Command "Start-Process cmd -ArgumentList '/k ${typeIt}' -Verb RunAs"`;

        exec(command, { shell: 'powershell.exe' }, (error, stdout, stderr) => {
            if (error) {
                console.error(`User denied UAC or other error occurred : ${error.message}`);
                resolve(false);
                return;
            }
            if (stderr) {
                console.error(`Something went wrong .. : ${stderr}`);
                resolve(false);
                return;
            }
            console.log(`Command executed successfully  : ${stdout}`);
            resolve(true);
        });
    });
};



//  run JS script in a new CMD tab or window and keep it running with node --watch
const runScriptOnNewTabOrWindow = (fullPathWithCommand, insertToHistory) => {

    console.log(`fullPathWithCommand : ${fullPathWithCommand}`);

    const openCMD = `wt -w 0 nt cmd /k ${fullPathWithCommand}`;

    exec(openCMD, (error, stdout, stderr) => {

        if (error) {
            console.error(`Error : ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr : ${stderr}`);
            return;
        }
        console.log(`Output : ${stdout}`);
    });
};

module.exports = {
    openCmdInNewTabOrWindowAsAdmin, openCmdInNewTabOrWindowFolder,
    runPsCommand, executeCommandWithSpawn, openCmdAndRunFromThere,
    openFileDirectly,
    openCmdAsAdmin, openPowerShellAsAdmin, timeOutPromise, runIsolatedCommandAsAdmin,
    getCommandBaseType, openCmdInNewTabOrWindow, runPowerShellFile, runExeFileAsAdmin, runExeAndCloseCmd, isExeRunningOnWindows,
    openPowerShellNoAdmin, openCmdNoAdmin, openCmdAndRunOnEnter, runScriptOnNewTabOrWindow,
};



// '
// powershell -Command "Start-Process 'cmd' -ArgumentList '/c node \"C:\Users\Avri !\Desktop\childProcess.js\" & pause' -Verb RunAs"'