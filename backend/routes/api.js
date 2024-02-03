const express = require('express');
const { GetID, GetInfo } = require('../utils/douyinService');
const getXB = require('../utils/x-bogus.js')

let router = express.Router();

/* 获取API */
router.post('/', async function(req, res, next) {
    try {
        // 尝试从cookies中获取并解析dycookie
        let dyCookie;
        try {
            dyCookie = req.body.dyCookie;
        } catch {
            dyCookie = null;
        }
        

        // 如果dycookie不存在或无法解析rs
        const allEmpty = Object.values(dyCookie).every(value => value === '');
        if (allEmpty) {
            res.render('index', { videoData: {work:false} });
            return;
        }

        // 如果未提供URL，则使用默认视频
        let videoUrl = req.body.url;
        if (!videoUrl) {
            throw new Error('视频地址为空');
        }

        // 检查URL的有效性（简单的）
        if (!videoUrl.startsWith('https://v.douyin.com/') && !videoUrl.startsWith('https://www.douyin.com/')) {
            throw new Error('无效的URL地址');
        }

        // 根据提供的URL获取视频ID
        const videoId = await GetID(videoUrl);

        // 使用视频ID和cookie获取视频详情
        const videoData = await GetInfo(videoId, dyCookie, getXB);
        res.send({code:0, data: videoData, msg: '解析成功'})
    } catch (error) {
        next(error);  // 转发错误到错误处理中间件
    }
});

// 错误处理中间件
router.use((err, req, res, next) => {
    console.error(err.stack)
    // 不要尝试嗅探并覆盖响应的MIME类型
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // 根据错误类型或消息为用户提供不同的反馈
    if (err.message.includes('无效的URL地址')) {
        res.status(200).send({code:400, data: null, msg: '提供的URL无效'})
    } else {
        res.status(200).send({code:400, data: null, msg: '服务器内部错误'})
    }
});

module.exports = router;