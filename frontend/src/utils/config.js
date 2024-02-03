import { FieldType } from "@lark-base-open/js-sdk";

export const config = {
    serverHost: 'http://127.0.0.1:4000',
    feilds: {
        url: { key: "url", zh: "链接", en: "Link", type: FieldType.Text },
        type: { key: "type", zh: "类型", en: "Type", type: FieldType.Text },
        title: { key: "title", zh: "标题", en: "Title", type: FieldType.Text },
        desc: { key: "desc", zh: "描述内容", en: "Description", type: FieldType.Text },
        uploader: { key: "uploader", zh: "博主", en: "Uploader", type: FieldType.Text },
        nickname: { key: "nickname", zh: "博主", en: "Nickname", type: FieldType.Text },
        userAvatar: { key: "userAvatar", zh: "博主头像", en: "User Avatar", type: FieldType.Text },
        tags: { key: "tags", zh: "标签", en: "Tags", type: FieldType.Text },
        releaseTime: { key: "releaseTime", zh: "发布时间", en: "Release Time", type: FieldType.DateTime },
        collectionCount: { key: "collectionCount", zh: "收藏量", en: "Collection Count", type: FieldType.Number },
        likeCount: { key: "likeCount", zh: "点赞量", en: "Like Count", type: FieldType.Number },
        shareCount: { key: "shareCount", zh: "转发量", en: "Share Count", type: FieldType.Number },
        commentCount: { key: "commentCount", zh: "评论量", en: "Comment Count", type: FieldType.Number },
        followsCount: { key: "followsCount", zh: "关注数", en: "Follows Count", type: FieldType.Number },
        fansCount: { key: "fansCount", zh: "粉丝数", en: "Fans Count", type: FieldType.Number },
        interactionCount: { key: "interactionCount", zh: "互动数", en: "Interaction Count", type: FieldType.Number },
        gender: { key: "gender", zh: "性别", en: "Gender", type: FieldType.Text },
        videoUrl: { key: "videoUrl", zh: "视频地址", en: "Video URL", type: FieldType.Text },
        videoCover: { key: "videoCover", zh: "视频封面", en: "Video Cover", type: FieldType.Text },
        musicUrl: { key: "musicUrl", zh: "配乐地址", en: "Music URL", type: FieldType.Text },
        musicTitle: { key: "musicTitle", zh: "配乐标题", en: "Music Title", type: FieldType.Text },
        signature: { key: "signature", zh: "博主签名", en: "Signature", type: FieldType.Text },
        userhome: { key: "userhome", zh: "用户主页", en: "User Home", type: FieldType.Text },
        videoId: { key: "videoId", zh: "视频id", en: "Video ID", type: FieldType.Text },
        noteId: { key: "noteId", zh: "笔记id", en: "Note ID", type: FieldType.Text },
        images: { key: "images", zh: "图片列表", en: "Images", type: FieldType.Text },
        imageNoWater: { key: "imageNoWater", zh: "去水印图片", en: "Image No Water", type: FieldType.Text },
        noteCover: { key: "noteCover", zh: "笔记封面", en: "Note Cover", type: FieldType.Text },
        ipLocation: { key: "ipLocation", zh: "归属地", en: "IP Location", type: FieldType.Text },
        fetchDataTime: { key: "fetchDataTime", zh: "数据获取时间", en: "Fetch Data Time", type: FieldType.DateTime },
        msg: { key: "msg", zh: "错误信息", en: "Error Message", type: FieldType.Text }
    },
    dataType: [
        {
            label: '获取抖音作品数据', 
            value: 'douyinDetail', 
            path: '/api',
            canChooseField: [ 'type', 'title', 'nickname', 'releaseTime','collectionCount', 'likeCount', 'shareCount', 'commentCount', 
                'videoUrl', 'videoCover', 'musicUrl', 'musicTitle', 'signature', 'userhome', 'videoId', 'images', 'msg', 'fetchDataTime'
            ],
        },
        {
            label: '获取小红书作品数据', 
            value: 'redbookNoteInfo', 
            path: '/redbook/getNoteInfo',
            canChooseField: [ "url", "type", "title", "userhome", "nickname", "userAvatar", "desc", "likeCount", "collectionCount", "commentCount", 
                "shareCount", "videoUrl", "releaseTime", "noteId", "images", "imageNoWater", "noteCover", 'fetchDataTime'
            ],
        },
        {
            label: '获取小红书作者数据', 
            value: 'redbookProfileInfo', 
            path: '/redbook/getProfileInfo',
            canChooseField: ['userhome', 'nickname', 'userAvatar', 'signature', 'followsCount', 'fansCount', 'interactionCount', 'ipLocation', 'gender', 'fetchDataTime'],
        },
        {
            label: '获取小红书作者全部笔记', 
            value: 'redbookNoteList', 
            path: '/redbook/getNoteList',
            canChooseField: ["url", "type", "title", "likeCount", "nickname", "userhome", "userAvatar", "noteCover", "noteId", 'fetchDataTime'],
        }
    ],
    doc: "https://aigccamp.feishu.cn/wiki/LvQRwI1A4iYtnMkOBtZc2zfsnMd"
}