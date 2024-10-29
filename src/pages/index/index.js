



window.onload = async () => {

    if (sessionStorage.getItem('xpStartupSound')) {
        return;
    }

    const audio = new Audio('./../../assets/sound/startup/win8StartupSound.mp3');
    audio.play();

    sessionStorage.setItem('xpStartupSound', true);

};