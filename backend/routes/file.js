const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const urlModule = require('url');

let router = express.Router();

/* 获取视频文件API */
router.get('/getVideo', async function(req, res, next) {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(200).send({code:400, data: null, msg: '缺少url'});
        }

        // 使用axios下载文件
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
        });

        // 创建一个临时文件路径
        const tempFilePath = path.join(__dirname, 'tempfile');

        // 将响应流写入文件
        const writer = fs.createWriteStream(tempFilePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        }).then(() => {            // 解析 URL 获取文件名
            const parsedUrl = urlModule.parse(url);
            const fileName = path.basename(parsedUrl.pathname);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
            // 文件写入完成后，将其发送回客户端
            res.sendFile(tempFilePath, err => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Error sending file');
                }

                // 删除临时文件
                fs.unlink(tempFilePath, err => {
                    if (err) console.log(err);
                });
            });
        });
    } catch (error) {
        next(error);  // 转发错误到错误处理中间件
    }
});

router.get('/getImage', async function(req, res, next) {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).send({code:0, data: null, msg: '缺少url'});
        }

        // 使用axios获取图片数据流
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
        });

        // 从URL中获取文件名
        var filename = path.basename(url);
        // 分割文件名，并只保留'!'前面的部分，然后添加'.jpeg'
        filename = filename.split('!')[0] + '.jpeg';

        // 设置Content-Disposition响应头，指定文件名，并设置为inline，使浏览器尝试直接显示图片
        res.setHeader('Content-Disposition', `inline; filename=${filename}`);

        // 设置响应头
        res.setHeader('Content-Type', 'image/jpeg');
        // 将图片数据流直接发送给客户端
        response.data.pipe(res);
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
    if (err.message) {
        res.status(200).send({code:400, data: null, msg: err.message})
    } else {
        res.status(200).send({code:400, data: null, msg: '服务器内部错误'})
    }
});

module.exports = router;