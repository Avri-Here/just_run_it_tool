


const wmic = require('wmic-js');


const getInstalledPrograms = async () => {

    try {

        const programs = await wmic().alias('product').get('name');
        const installedPrograms = programs.map(program => program.Name).filter(Boolean);
        return installedPrograms;

    } catch (error) {
        console.error('Error listing programs :', error);
        return [];
    }
}



const uninstallProgram = async (programName) => {

    try {
        await wmic().alias('product').where('name', '=', programName).call('uninstall');
        console.log(`Successfully uninstalled ${programName} !`);
    } catch (error) {
        console.error(`Error uninstalling program: ${programName}`, error);
    }
}


module.exports = { getInstalledPrograms, uninstallProgram }










































// listInstalledPrograms()
// Installed programs : [
//     'Python 3.12.6 pip Bootstrap (64-bit)',
//     'Python 3.12.6 Development Libraries (64-bit)',
//     'Python Launcher',
//     'Microsoft Teams Meeting Add-in for Microsoft Office',
//     'Python 3.12.6 Standard Library (64-bit)',
//     'Python 3.12.6 Executables (64-bit)',
//     'Python 3.12.6 Add to Path (64-bit)',
//     'Python 3.12.6 Core Interpreter (64-bit)',
//     'Python 3.12.6 Tcl/Tk Support (64-bit)',
//     'Office 16 Click-to-Run Extensibility Component',
//     'Office 16 Click-to-Run Licensing Component',
//     'Microsoft Visual C++ 2019 X86 Additional Runtime - 14.28.29914',
//     'FortiClient',
//     'MSVC80_x86_v2',
//     'Microsoft Intune Management Extension',
//     'Microsoft .NET Framework 4.7.2 SDK',
//     'Microsoft Visual C++ 2019 X64 Additional Runtime - 14.28.29914',
//     'BeyondTrust Privilege Management Cloud Adapter (x64)',
//     'Microsoft .NET Framework 4.7.2 Targeting Pack (ENU)',
//     'Node.js',
//     'Java(TM) 6 Update 30',
//     'Microsoft_VC100_CRT_SP1_x86',
//     'Windows Subsystem for Linux Update',
//     'MSVC90_x86',
//     'Active Directory Rights Management Services Client 2.1',
//     'Microsoft_VC100_CRT_SP1_x64',
//     'Microsoft Policy Platform',
//     'Windows Subsystem for Linux',
//     'Microsoft Visual C++ 2019 X86 Minimum Runtime - 14.28.29914',
//     'Rapid7 Insight Agent',
//     'MSVC90_x64',
//     'Microsoft Visual C++ 2010  x64 Redistributable - 10.0.30319',
//     'Microsoft Visual C++ 2019 X64 Minimum Runtime - 14.28.29914',
//     'Microsoft Visual C++ 2010  x86 Redistributable - 10.0.30319',
//     'Configuration Manager Client',
//     'Microsoft .NET Framework 4.7.2 Targeting Pack',
//     'AWS Command Line Interface v2',
//     'Microsoft Azure Information Protection',
//     'Nokia Suite',
//     'MSVC80_x64_v2',
//     'Privilege Management for Windows (x64) 23.9.261.0'
//   ]