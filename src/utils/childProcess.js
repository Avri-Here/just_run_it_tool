

const { promisify } = require('util');
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

const openCmdAndRunAsAdmin = async (command) => {

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
        console.log(`runExeAndCloseCmd Done !`);
        return output;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        throw new Error(`Error: ${err.message}`);
    }
};

const runPowerShellFile = (ps1FilePath, params = []) => {

    const PowerShell = require("powershell");

    return new Promise((resolve, reject) => {
        // Construct the PowerShell command with optional parameters
        const paramString = params.length > 0 ? params.join(' ') : '';
        const ps = new PowerShell(`& "${ps1FilePath}" ${paramString}`);

        let output = '';
        ps.on("output", data => {
            output += data;
        });

        ps.on("error-output", err => {
            console.error(err);
            reject(err);
        });

        ps.on("error", err => {
            console.error(err);
            reject(err);
        });

        ps.on("end", code => {
            if (code === 0) {
                console.log(`PowerShell script finished with exit code ${code}`);
                resolve(output);
            } else {
                console.error(`PowerShell script finished with exit code ${code}`);
                reject(`PowerShell script finished with exit code ${code}`);
            }
        });
    });
};


const runPsCommand = async (commands = []) => {

    // work on var - node-powershell  "3.1.1" !
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


// run it from the electron app and not exit if the electron is closed - this funk first open the cmd and then run the exe file .. like in real life ..

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
                console.error(`Error : ${stderr || 'unknown'}`);
                return;
            }
            console.log(`executed successfully !`);
        });
}


// Pass the name of the exe file , like vlcPortable.exe ...
const isExeRunningOnWindows = async (exeName) => {
    const execAsync = promisify(exec);
    try {
        const command = `tasklist /FI "IMAGENAME eq ${exeName}"`;
        const { stdout } = await execAsync(command);
        return stdout.includes(exeName);

    } catch (error) {
        console.error('Error in isExeRunningOnWindows :', error);
        return 'off';
    }
};

const timeOutPromise = () => {
    return new Promise(resolve => {
        setTimeout(() => { resolve('timeOut') }, 20000);
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



//  run JS script in a new CMD tab or window and keep it running !

const runScriptOnNewTabOrWindow = (commandToRun) => {

    console.log(`Command to run : ${commandToRun}`);

    const openCMD = `wt -w 0 nt cmd /K "${commandToRun}"`; 
    exec(openCMD, (error, _, stderr) => {

        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.info(`RunScriptOnNew Done!`);
    });
};


module.exports = {
    openCmdAndRunAsAdmin, openCmdInNewTabOrWindowFolder,
    runPsCommand, executeCommandWithSpawn, openCmdAndRunFromThere,
    openPowerShellAsAdmin, timeOutPromise, runIsolatedCommandAsAdmin,
    openPowerShellNoAdmin, openCmdNoAdmin, runScriptOnNewTabOrWindow,
    isExeRunningOnWindows, openFileDirectly, openCmdAsAdmin, runPowerShellFile,
    getCommandBaseType, openCmdInNewTabOrWindow, runExeFileAsAdmin, runExeAndCloseCmd,
};



// '
// powershell -Command "Start-Process 'cmd' -ArgumentList '/c node \"C:\Users\Avri !\Desktop\childProcess.js\" & pause' -Verb RunAs"'