/** 文件下载的缓存，后续支持多个并发下载的时候有用，现在没啥用 */
var downloadFileCache = {};

/** 后续支持多个并发下载的时候有用;重复的文件不下进行下载,将每秒检查一下重复的文件下载好了没有，然后resolve */
function checkCache(res, url) {
    setTimeout(function () {
        if (downloadFileCache[url].success) {
            res(downloadFileCache[url].file);
        } else {
            checkCache(res, url);
        }
    }, 1000);
}

/** 替换掉文件中不可作为文件名的字符 */
function replaceInvalidCharsInUrl(url) {
    // 匹配非字母数字、点、下划线、破折号的字符
    var invalidCharRegex = /[^a-zA-Z0-9.\-_]/g;
    // 将匹配到的字符替换为下划线
    return url.replace(invalidCharRegex, '_');
}

function includesFileExtension(string) {
    // 使用正则表达式检查字符串是否以 "." 字符开头，且后面跟着一个或多个字母
    var regex = /.*\.[a-zA-Z0-9]+$/;
    return regex.test(string);
}

function getURLFingerprint(url) {
    var hash = 0;

    if (url.length === 0) {
        return hash;
    }

    for (var i = 0; i < url.length; i++) {
        var char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    // Convert hash to string and trim to 20 characters
    return hash.toString().slice(0, 20);
}

export function downloadFile2({ url, filename }) {
    if (downloadFileCache[url]) {
        // 后续支持多文件并发下载的时候才有效;如果文件已经下载好了
        return new Promise(function (res) {
            checkCache(res, url);
        });
    }

    // fetch下载文件
    return new Promise(async function (resolve, reject) {
        try {
            var response = await fetch(url); // ignore_security_alert_wait_for_fix SSRF
            if (!response.ok) {
                reject(new Error(`文件下载失败. Response status: ${response.status}.`));
                return;
            }
            var contentType = response.headers.get('content-type') || '';
            var pre = (url.split('?')[1]?.slice?.(0, 10) || '') + getURLFingerprint(url);
            /** 最终给文件的拓展名 */
            var ex = '';
            if (!includesFileExtension(filename)) {
                ex = contentTypeExtension[contentType] || '';
            }

            var blob = await response.blob();
            var file = new File([blob], replaceInvalidCharsInUrl(pre + filename + ex), { type: contentType });
            console.log("download file success:", url);
            resolve(file);
        } catch (error) {
            reject(error);
        }
    });
}

export function downloadFiles(urlList, filename) {
    return urlList.map((url, index) => {
        var filenameWithIndex = filename;
        if (!includesFileExtension(filename)) {
            filenameWithIndex = `${filename}_${index}`;
        } else {
            filenameWithIndex = `${index}_${filename}`;
        }
        return downloadFile2({url, filename: filenameWithIndex});
    });
}


/** 可以打开这种contentType的文件拓展名 */
const contentTypeExtension = {
    'text/html': '.html',
    'text/css': '.css',
    'text/javascript': '.js',
    'text/markdown': '.md',
    'text/csv': '.csv',
    'text/xml': '.xml',
    'image/jpeg': '.jpeg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
    'application/json': '.json',
    'application/xml': '.xml',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/postscript': '.ps',
    'application/x-shockwave-flash': '.swf',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/midi': '.midi',
    'audio/x-midi': '.midi',
    'audio/webm': '.webm',
    'video/mpeg': '.mpeg',
    'video/mp4': '.mp4',
    'video/ogg': '.ogg',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'application/x-tar': '.tar',
    'application/x-gzip': '.gz',
    'application/x-bzip2': '.bz2',
    'application/x-7z-compressed': '.7z',
    'application/javascript': '.js',
    'application/x-javascript': '.js',
    'application/octet-stream': '',
    'application/font-woff': '.woff',
    'application/font-woff2': '.woff2',
    'application/vnd.android.package-archive': '.apk',
    'application/vnd.apple.installer+xml': '.mpkg',
    'application/x-deb': '.deb',
    'application/x-dvi': '.dvi',
    'application/x-font-ttf': '.ttf',
    'application/x-rar-compressed': '.rar',
    'application/x-sh': '.sh',
    'application/x-tex': '.tex',
    'application/rtf': '.rtf',
    'image/tiff': '.tiff',
    'image/x-icon': '.ico',
    'text/cache-manifest': '.appcache',
    'text/calendar': '.ics',
    'text/x-asm': '.asm',
    'text/x-c': '.c',
    'text/x-c++': '.cpp',
    'text/x-coffeescript': '.coffee',
    'text/x-diff': '.diff',
    'text/x-dtd': '.dtd',
    'text/x-erlang': '.erl',
    'text/x-haskell': '.hs',
    'text/x-java-source': '.java',
    'text/x-lua': '.lua',
    'text/x-mariadb': '.sql',
    'text/x-mysql': '.sql',
    'text/x-nfo': '.nfo',
    'text/x-pascal': '.pas',
    'text/x-perl': '.pl',
    'text/x-python': '.py',
    'text/x-rust': '.rs',
    'text/x-sass': '.sass',
    'text/x-scala': '.scala',
    'text/x-scss': '.scss',
    'text/x-sql': '.sql',
    'text/x-vhdl': '.vhdl',
    'text/x-yaml': '.yml',
    'text/vcard': '.vcf',
    'text/vnd.rim.location.xloc': '.xloc',
    'text/vnd.sun.j2me.app-descriptor': '.jad',
    'text/vtt': '.vtt',
    'text/x-component': '.htc',
    'text/x-jquery-tmpl': '.tmpl',
    'video/3gpp': '.3gp',
    'video/3gpp2': '.3g2',
    'video/h264': '.mp4',
    'video/x-flv': '.flv',
    'video/x-m4v': '.m4v',
    'video/x-mng': '.mng',
    'video/x-ms-asf': '.asf',
    'video/x-ms-wmv': '.wmv',
    'video/x-msvideo': '.avi',
    'video/x-sgi-movie': '.movie',
    'video/x-matroska': '.mkv',
    'application/vnd.mozilla.xul+xml': '.xul',
    'application/x-httpd-php': '.php',
    'application/x-httpd-php-source': '.phps',
    'application/x-latex': '.latex',
    'application/x-mpegURL': '.m3u8',
    'application/x-msdownload': '.exe',
    'application/x-msdos-program': '.com',
    'application/x-msi': '.msi',
    'application/x-www-form-urlencoded': '',
    'application/xhtml+xml': '.xhtml',
    'application/xml-dtd': '.dtd',
    'application/zip-compressed': '.zip',
    'audio/aac': '.aac',
    'audio/flac': '.flac',
    'audio/mp4': '.mp4a',
    'audio/mpeg3': '.mp3',
    'audio/x-ms-wma': '.wma',
    'audio/x-realaudio': '.ra',
    'image/x-xbitmap': '.xbm',
    'application/vnd.ms-fontobject': '.eot',
    'audio/vnd.rn-realaudio': '.ram',
    'image/vnd.wap.wbmp': '.wbmp',
    'image/x-xpixmap': '.xpm',
    'text/x-vcard': '.vcf'
};
