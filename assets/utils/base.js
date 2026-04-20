// window.API_BASE = 'http://127.0.0.1:5000'
window.API_BASE = 'https://asisston.eu.pythonanywhere.com'


const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

const getUser = () => {
    const userEncoded = getCookie('user');
    if (!userEncoded) return null;
    try {
        const decoded = atob(userEncoded);
        return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch (e) {
        return null;
    }
}
