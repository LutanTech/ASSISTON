// Set cookie
function setCookie(name, value, maxAge = 86400) {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

// Get cookie
function getCookie(name) {
    const cookies = document.cookie.split("; ");
    for (let c of cookies) {
        const [key, val] = c.split("=");
        if (key === name) return val;
    }
    return null;
}

// Delete cookie
function deleteCookie(name) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
}