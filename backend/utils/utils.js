function parseCookie(cookie) {
    let cookieObj = {};
    let cookieArr = cookie.split('; ');

    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split('=');
        cookieObj[decodeURIComponent(cookiePair[0])] = decodeURIComponent(cookiePair[1]);
    }

    console.log(cookieObj);

    return cookieObj;
}

module.exports = {
    parseCookie
}