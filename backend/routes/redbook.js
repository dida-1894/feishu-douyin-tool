const express = require('express');
const { getAllNoteList, getProfileInfo, getNoteInfo } = require('../utils/redbookService.js');

let router = express.Router();

/* 获取全部笔记API */
router.post('/getNoteList', async function(req, res, next) {
    try {
        // 尝试从cookies中获取并解析dycookie
        let xhsCookies;
        try {
            xhsCookies = req.body.xhsCookies;
        } catch {
            xhsCookies = null;
        }
        

        // 如果dycookie不存在或无法解析rs
        const allEmpty = Object.values(xhsCookies).every(value => value === '');
        if (allEmpty) {
            res.send({code:400, data: null, msg: '提供cookies参数缺失'})
            return;
        }

        // 如果未提供URL，则使用默认视频
        let userUrl = req.body.url;
        if (!userUrl) {
            throw new Error('用户主页地址为空');
        }

        // 检查URL的有效性（简单的）
        if (!userUrl.startsWith('https://www.xiaohongshu.com/')) {
            throw new Error('无效的URL地址');
        }

        // 根据提供的URL获取视频ID
        const parts = userUrl.split("/");
        const userId = parts[parts.length - 1];
        const regex = /^[0-9a-zA-Z]{24}$/;
        if(!regex.test(userId)) {
            throw new Error('用户主页地址错误');
        }

        // 使用视频ID和cookie获取视频详情
        const noteList = await getAllNoteList(userId, xhsCookies);
        res.send({code:0, data: noteList, msg: '成功'})
    } catch (error) {
        console.log("error==========>", error);
        next(error);  // 转发错误到错误处理中间件
    }
});

/* 获取用户信息API */
router.post('/getProfileInfo', async function(req, res, next) {
    try {
        // 尝试从cookies中获取并解析dycookie
        let xhsCookies;
        try {
            xhsCookies = req.body.xhsCookies;
        } catch {
            xhsCookies = null;
        }
        

        // 如果dycookie不存在或无法解析rs
        const allEmpty = Object.values(xhsCookies).every(value => value === '');
        if (allEmpty) {
            res.send({code:400, data: null, msg: '提供cookies参数缺失'})
            return;
        }

        // 如果未提供URL
        let userUrl = req.body.url;
        if (!userUrl) {
            throw new Error('用户主页地址为空');
        }

        // 检查URL的有效性（简单的）
        if (!userUrl.startsWith('https://www.xiaohongshu.com/')) {
            throw new Error('无效的URL地址');
        }

        // 根据提供的URL获取用户ID
        const parts = userUrl.split("/");
        const userId = parts[parts.length - 1];
        const regex = /^[0-9a-zA-Z]{24}$/;
        if(!regex.test(userId)) {
            throw new Error('用户主页地址错误');
        }

        // 使用用户ID和cookie获取用户详情
        const profileInfo = await getProfileInfo(userId, xhsCookies);
        res.send({code:0, data: profileInfo, msg: '成功'})
    } catch (error) {
        console.log("error==========>", error);
        next(error);  // 转发错误到错误处理中间件
    }
});

/* 获取笔记API */
router.post('/getNoteInfo', async function(req, res, next) {
    try {
        // 尝试从cookies中获取并解析dycookie
        let xhsCookies;
        try {
            xhsCookies = req.body.xhsCookies;
        } catch {
            xhsCookies = null;
        }
        

        // 如果dycookie不存在或无法解析rs
        const allEmpty = Object.values(xhsCookies).every(value => value === '');
        if (allEmpty) {
            res.status(400).send({code:400, data: null, msg: '提供cookies参数缺失'})
            return;
        }

        // 如果未提供URL
        let noteUrl = req.body.url;
        if (!noteUrl) {
            throw new Error('用户主页地址为空');
        }

        // 检查URL的有效性（简单的）
        if (!noteUrl.startsWith('https://www.xiaohongshu.com/')) {
            throw new Error('无效的URL地址');
        }

        // 根据提供的URL获取笔记ID
        const parts = noteUrl.split("/");
        const noteId = parts[parts.length - 1];
        const regex = /^[0-9a-zA-Z]{24}$/;
        if(!regex.test(noteId)) {
            throw new Error('用户主页地址错误');
        }

        // 使用笔记ID和cookie获取笔记详情
        const noteInfo = await getNoteInfo(noteId, xhsCookies);
        res.send({code:0, data: noteInfo, msg: '成功'})
    } catch (error) {
        console.log("error==========>", error);
        next(error);  // 转发错误到错误处理中间件
    }
});

// 错误处理中间件
router.use((err, req, res, next) => {
    console.log("use error==========>", err);
    console.error(err.stack)
    // 不要尝试嗅探并覆盖响应的MIME类型
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // 根据错误类型或消息为用户提供不同的反馈
    if (err.message.includes('无效的URL地址')) {
        res.status(200).send({code:400, data: null, msg: '提供的URL无效'})
    } else {
        res.status(200).send({code:400, data: null, msg: err.message ?? '服务器内部错误'})
    }
});

module.exports = router;