




window.onload = async () => {

    if (sessionStorage.getItem('xpStartupSound')) {
        return;
    }

    const audio = new Audio('./../../assets/sound/startup/windowsSoundEffect.mp3');
    audio.play();

    sessionStorage.setItem('xpStartupSound', true);

};