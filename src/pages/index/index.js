

const dropZone = document.getElementById('dropZone');
// const musicPlayer = document.querySelector('.musicPlayer');
const btnGroup = document.querySelector('.btn-group');
const dragFiles = document.querySelector('.list-group');


btnGroup.addEventListener('dragover', (e) => {
    e.preventDefault();
    dragFiles.style.display = 'block';
    dropZone.style.display = 'block';
    btnGroup.style.display = 'none';
});

dragFiles.addEventListener('dragleave', async (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    dragFiles.style.display = 'none';
    dropZone.style.display = 'none';
    btnGroup.style.display = 'block';
});

dragFiles.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
    dragFiles.style.display = 'block';
    dropZone.style.display = 'block';
    btnGroup.style.display = 'none';
});

document.addEventListener('dragover', (e) => {

    e.preventDefault();
    if (e.target.classList.contains('btn-group')) {
        dropZone.classList.remove('dragging');
        dragFiles.style.display = 'none';
        btnGroup.style.display = 'block';
    }

});
document.addEventListener('dragleave', (e) => {

    e.preventDefault();
    if (e.target.classList.contains('btn-group')) {
        dropZone.classList.remove('dragging');
        dragFiles.style.display = 'none';
        btnGroup.style.display = 'block';
    }

});


document.addEventListener('drop', (e) => {
    e.preventDefault();
});


window.onload = async () => {


    
    if (sessionStorage.getItem('xpStartupSound')) {
        return;
    }

    sessionStorage.setItem('xpStartupSound', true);

    const audio = new Audio('./../../assets/sound/2000StartupSound.mp3');
    audio.play().catch(error => {
        console.error('Error playing sound :', error);
    });

};