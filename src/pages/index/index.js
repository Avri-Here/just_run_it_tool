




window.onload = async () => {

    if (sessionStorage.getItem('xpStartupSound')) {
        return;
    }

    const audio = new Audio('./../../assets/sound/startup/windowsSoundEffect.mp3');
    audio.play();

    sessionStorage.setItem('xpStartupSound', true);

    //     document.addEventListener('mouseleave', () => {
    //     document.body.style.visibility = 'hidden'; // Hide document when mouse leaves
    // });

    // document.addEventListener('mouseenter', () => {
    //     document.body.style.visibility = 'visible'; // Show document when mouse enters
    // });

};