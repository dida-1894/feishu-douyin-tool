const axios = require("axios");
const getXs = require("./xhs-sign");
const { json } = require("express");


function getTypeWord(type) {
    if (type == 'normal') {
        return "图文"
    } else {
        return "视频"
    }
}

function getGenderWord(gender) {
    if (gender === 0) {
        return  '男';
    } else if (gender === 1) {
        return  '女';
    } else {
        return  '未知';
    }
}

function extractIdFromUrl(url) {
    const regex = /\/(\w+)!/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function processUrls(urlList) {
    return urlList.map(url => {
        const id = extractIdFromUrl(url);
        return id ? 'https://sns-img-bd.xhscdn.com/' + id : null;
    }).filter(url => url !== null);
}

function decodedUniChars(url) {
    let decodedUniChars = decodeURIComponent(escape(url));
    return decodedUniChars;
}

function get_cookies() {
    return {
        "xsecappid": "",
        "a1": "",
        "webId": "",
        "gid": "",
        "webBuild": "3.3.4",
        "web_session": "",
        "websectiga": "",
        "sec_poison_id": ""
    }
}

function get_home_headers() {
    return {
        "authority": "www.xiaohongshu.com",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Microsoft Edge\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.47"
    }
}

function get_headers() {
    return {
        "authority": "edith.xiaohongshu.com",
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "content-type": "application/json;charset=UTF-8",
        "origin": "https://www.xiaohongshu.com",
        "referer": "https://www.xiaohongshu.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.188",
        "x-s": "",
        "x-t": ""
    }
}

function get_note_data(note_id) {
    return {
        "source_note_id": note_id,
        "image_scenes": [
            "CRD_PRV_WEBP",
            "CRD_WM_WEBP"
        ]
    }
}

function get_search_data() {
    return {
        "image_scenes": "FD_PRV_WEBP,FD_WM_WEBP",
        "keyword": "",
        "note_type": "0",
        "page": "",
        "page_size": "20",
        "search_id": "2c7hu5b3kzoivkh848hp0",
        "sort": "general"
    }
}

function get_params() {
    return {
        "num": "30",
        "cursor": "",
        "user_id": "",
        "image_scenes": ""
    }
}

function formatNote(note) {
    if (!note) {
        return null;
    }
    return {
        "url" : "https://www.xiaohongshu.com/explore/" + note.note_id,
        "type" : getTypeWord(note.type),
        "title" : note.display_title,
        "likeCount" : note.interact_info?.liked_count,
        "nickname" : note.user?.nick_name,
        "userhome" : "https://www.xiaohongshu.com/user/profile/" + note.user?.user_id,
        "userAvatar" : note.user?.avatar,
        "noteCover" : note.cover?.url,
        "noteId" : note.note_id,
    }
}

function handleProfileInfo(userId, htmlText) {
    const userhome = "https://www.xiaohongshu.com/user/profile/" + userId
    const infoRegex = /<script>window.__INITIAL_STATE__=(.*?)<\/script>/;
    let info = htmlText.match(infoRegex);
    if (info.length < 2) {
        throw new Error('请求用户主页失败');
    }
    info = info[1];
    info = info.replace(/undefined/g, 'null');
    info = JSON.parse(info);
    let userPageData = info.user.userPageData;

    let nickname = userPageData.basicInfo.nickname;
    let userAvatar = userPageData.basicInfo.images;
    // Assuming that decodedUniChars is a function in your environment
    userAvatar = decodedUniChars(userAvatar); 
    let signature = userPageData.basicInfo.desc;

    console.log(JSON.stringify(userPageData));

    let followsCount = userPageData.interactions[0].count;
    let fansCount = userPageData.interactions[1].count;
    let interactionCount = userPageData.interactions[2].count;
    let ipLocation = userPageData.basicInfo.ipLocation;
    let gender = getGenderWord(userPageData.basicInfo.gender);
    let tagsTemp = info.user.userPageData.tags;
    let tags = [];
    for(let tag of tagsTemp) {
        try {
            tags.push(tag.name);
        } catch(e) {
            console.error(e);
        }
    }

    return { userhome, nickname, userAvatar, signature, followsCount, fansCount, interactionCount, ipLocation, gender, tags};
}


function handleNoteInfo(data) {
    let noteId = data.id;
    let note_type = data.note_card.type;
    let userId = data.note_card.user.user_id;
    let nickname = data.note_card.user.nickname;
    let avatar = data.note_card.user.avatar;
    let title = data.note_card.title;
    let desc = data.note_card.desc;
    let liked_count = data.note_card.interact_info.liked_count;
    let collected_count = data.note_card.interact_info.collected_count;
    let comment_count = data.note_card.interact_info.comment_count;
    let share_count = data.note_card.interact_info.share_count;
    let video_addr = '';

    if (note_type === 'video') {
        video_addr = 'https://sns-video-bd.xhscdn.com/' + data.note_card.video.consumer.origin_video_key;
    }

    let image_list = data.note_card.image_list;
    let urlList = [];

    for (let image of image_list) {
        for (let info of image.info_list) {
            if (info.image_scene === 'CRD_WM_WEBP') {
                urlList.push(info.url);
            }
        }
    }

    let tags_temp = data.note_card.tag_list;
    let tags = [];

    for (let tag of tags_temp) {
        try {
            tags.push(tag.name);
        } catch (error) {
            // pass
        }
    }

    let upload_time = data.note_card.time; // Assuming this function is already defined

    let noteInfo = {
        url : "https://www.xiaohongshu.com/explore/" + noteId,
        type : getTypeWord(note_type),
        title: title,
        userhome: "https://www.xiaohongshu.com/user/profile/" + userId,
        nickname: nickname,
        userAvatar: avatar,
        desc: desc,
        likeCount: liked_count,
        collectionCount: collected_count,
        commentCount: comment_count,
        shareCount: share_count,
        videoUrl: video_addr,
        tags: tags,
        releaseTime: upload_time,
        noteId: noteId,
        images: urlList,
        imageNoWater: processUrls(urlList),
        noteCover: urlList?.[0],
    };

    return noteInfo;
}

async function  getNoteList(userId, xhsCookies, cursor = '') {
    let headers = get_headers()
    let params = get_params()
    params.user_id = userId
    params.cursor = cursor

    let more_url = 'https://edith.xiaohongshu.com/api/sns/web/v1/user_posted'
    // let queryString = new URLSearchParams(params);
    let api= '/api/sns/web/v1/user_posted?' +  new URLSearchParams(params).toString();
    let ret = getXs(api, '', xhsCookies.a1)

    headers['x-s'] = ret['X-s']
    headers['x-t'] = String(ret['X-t'])

    let cookiesStr = Object.entries(xhsCookies).map(([k, v]) => `${k}=${v}`).join('; ');

    // Add cookies to headers
    headers['Cookie'] = cookiesStr;
    // console.log(headers);

    try {
        let response = await axios.get(more_url, {
            headers: headers,
            params: params
        });
        let result = response.data.data;
        result.notes = result.notes.map(formatNote);
        // console.log(JSON.stringify(result));
        return result;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error('请求笔记列表失败');
    };
}

async function getAllNoteList(userId, xhsCookies) {
    var cursor = ''
    var notes = []
    var has_more = false
    do {
        let batchResult = await getNoteList(userId, xhsCookies, cursor);
        notes = notes.concat(batchResult.notes);
        cursor = batchResult.cursor;
        has_more = batchResult.has_more;
    } while (has_more);
    return notes
}

async  function getProfileInfo(userId, xhsCookies) {
    var userHome = "https://www.xiaohongshu.com/user/profile/" + userId
    var headers = get_headers()
    let cookiesStr = Object.entries(xhsCookies).map(([k, v]) => `${k}=${v}`).join('; ');
    // Add cookies to headers
    headers['Cookie'] = cookiesStr;

    var response = await axios.get(userHome, { headers: headers });
    var html = response.data
    var profile = handleProfileInfo(userId, html)
    return profile
}


async function getNoteInfo(noteId, xhsCookies) {
    let postData = get_note_data(noteId)
    let data = JSON.stringify(postData)
    let feedUrl = 'https://edith.xiaohongshu.com/api/sns/web/v1/feed'
    let api = '/api/sns/web/v1/feed'
    let ret = getXs(api, data, xhsCookies.a1)

    let headers = get_headers();
    headers['x-s'] = ret['X-s']
    headers['x-t'] = String(ret['X-t'])
    let cookiesStr = Object.entries(xhsCookies).map(([k, v]) => `${k}=${v}`).join('; ');
    headers['Cookie'] = cookiesStr;

    let note;
    try {
        let response = await axios.post(feedUrl, postData, {
            headers: headers,
        });
    
        let res = response.data.data;
        // console.log(JSON.stringify( res));
        note = handleNoteInfo(res.items[0]); // Assuming this function is already defined
    } catch (error) {
        console.log(error);
        console.log(`Note ${noteId} is not allowed to view.`);
        return;
    }

    return note;
}

module.exports = {
    getNoteList,
    getAllNoteList,
    getProfileInfo,
    getNoteInfo,
}