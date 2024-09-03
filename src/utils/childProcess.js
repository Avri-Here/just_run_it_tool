


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
            return { command: `python "${fullPath}"`, suffix: `python ${fileName}` };
        case '.ps1':
            return { command: `powershell -File "${fullPath}"`, suffix: `powershell -File "${fileName}"` };
        case '.bat':
            return { command: `"${fullPath}"`, suffix: fileName };
        case '.js':
            return { command: `node "${fullPath}"`, suffix: `node ${fileName}` };
        default:
            return { command: `"${fullPath}"`, suffix: fileName };
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

    console.log(`dirPath: ${filePath}`);

    // const command = `wt -w 0 nt cmd /k cd /d "${filePath}" & ${commandToRun}`; 
    const command = `wt -w 0 nt cmd /k "cd /d "${filePath}" && ${commandToRun} || echo Error occurred while executing command && pause"`;

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
            console.error('Error opening file:', err);
        }
    });
};

const shouldOpenInTerminal = (filePath) => {

    const scriptExtensions = ['.py', '.ps1', '.bat', '.js'];
    return scriptExtensions.includes(path.extname(filePath).toLowerCase());
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

// runExeAsAdmin function not closing the cmd window after the exe is executed ...

const runExeAsAdmin = async (exeName, params, exeDir = 'misc') => {


    const exePath = path.join(process.env.BINARIES_DIR, exeDir, exeName);
    try {
        // const command = `powershell -Command "Start-Process cmd -ArgumentList '/K ${exePath} ${params}' -Verb RunAs"`;
        const command = `powershell -Command "Start-Process '${exePath}' ${params ? `-ArgumentList '${params}'` : ''
            } -NoNewWindow -Wait"`;
        const output = await executeCommand(command);
        console.log(`runExeAsAdmin Output: ${output}`);
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



const openWindowsComponentAsAdmin = async (componentName) => {
    const componentMap = {
        'controlPanel': 'control',
        'envVariables': 'rundll32 sysdm.cpl,EditEnvironmentVariables',
        'services': 'services.msc',
        'taskManager': 'taskmgr',
        'programsAndFeatures': 'appwiz.cpl',
        'pcExplorer': 'explorer.exe shell:MyComputerFolder'
    };

    const command = componentMap[componentName];

    try {
        const adminCommand = `powershell -Command "Start-Process ${command} -Verb RunAs"`;
        await executeCommand(adminCommand);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        return;
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


// This run it from the electron app will close if the app is closed - this funk first open the cmd and then run the exe file .. like in real life ..

const openCmdAndRunFromThere = (exePath, params = []) => {

    const exeDir = path.dirname(exePath);


    // if you want make it open on new window not matter what ..
    // exec(`start cmd.exe /K "cd /d ${exeDir} && ${path.basename(exePath)} ${params}"`, (error, stdout, stderr) => {


    //if you want make it open on new tab if the terminal is already open ..
    exec(`wt -w 0 nt cmd.exe /K "cd /d ${exeDir} && ${path.basename(exePath)} ${params}"`, (error, stdout, stderr) => {

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





const executeSpawnWithListener = (batFilePath, params = [], callback) => {
    try {
        // Combine the batch file path and any parameters into a single command
        const cmdArgs = ['/k', batFilePath, ...params];

        // Spawn a new command prompt process to run the .bat file in an interactive mode
        const child = spawn('cmd.exe', cmdArgs, {
            shell: true,
            stdio: 'inherit', // This will allow you to see and interact with the command prompt
            detached: true // Detach the child process to keep it running independently
        });

        child.on('exit', (code) => {
            const isDoneSuccessfully = code === 0;

            const notificationMsg = {
                title: `Command done with exit code ${code}`,
                message: isDoneSuccessfully ? 'Command executed successfully!' : 'An error occurred while executing the command!',
                icon: isDoneSuccessfully ? 'success' : 'error',
                sound: true,
                timeout: 5,
            };

            ipcRenderer.invoke('notificationWIthNode', notificationMsg);

            if (!isDoneSuccessfully) {
                throw new Error(`Error: Command done with exit code ${code}`);
            }

            callback && callback();

            // Unreference the child process
            child.unref();
        });

    } catch (error) {
        console.error('Error in executeSpawnWithListener:', error);
        throw error;
    }
};



module.exports = {
    openCmdAsAdmin, openPowerShellAsAdmin,
    openPowerShellNoAdmin, openCmdNoAdmin, openCmdAndRunOnEnter,
    runPsCommand, executeCommandWithSpawn, openCmdAndRunFromThere,
    openFileDirectly, shouldOpenInTerminal, executeSpawnWithListener,
    getCommandBaseType, openCmdInNewTabOrWindow, runPowerShellFile,
    runExeAsAdmin, runExeAndCloseCmd, openWindowsComponentAsAdmin,
    openCmdInNewTabOrWindowAsAdmin, openCmdInNewTabOrWindowFolder,
};



// '
// powershell -Command "Start-Process 'cmd' -ArgumentList '/c node \"C:\Users\Avri !\Desktop\childProcess.js\" & pause' -Verb RunAs"'