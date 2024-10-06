


const wmic = require('wmic-js');


const listInstalledPrograms = async () => {

    try {

        const programs = await wmic().alias('product').get('name');
        const installedPrograms = programs.map(program => program.Name).filter(Boolean);
        return installedPrograms;

    } catch (error) {
        console.error('Error listing programs :', error);
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


module.exports = { listInstalledPrograms, uninstallProgram }