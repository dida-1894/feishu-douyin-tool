<h1 align="center">✨ 获取抖音、小红书数据保存到飞书多维表格 ✨</h1>

# 使用效果
![使用效果](/use-doc/使用示例.gif)

# 使用教程
### 1. 新增一个多维表格，将需要采集的链接贴入
每行一个，支持的链接形式有：

```
https://www.douyin.com/video/7304875720877034803
https://v.douyin.com/iL7oNdRv/
```

### 2. 运行程序

可使用Replit 一键部署：https://replit.com/@yib360/feishu-douyin-tool

如果没有，可以参考下方本地运行方式，运行成功后
添加自定义插件，地址填写：http://localhost:4000/
![新增自定义插件](/use-doc/新增自定义插件.png)
![填写自定义插件](/use-doc/填写自定义插件.png)

### 3. 获取cookie
登陆 https://www.douyin.com/

![获取cookie](/use-doc/获取cookie.png)

### 4. 填入cookie 并 选择需要的字段
![使用截图](/use-doc/使用截图.png)

### 5. 点击获取数据

# 本地运行
## Install
```
git clone https://github.com/happyVee/feishu-douyin-tool.git
cd feishu-douyin-tool
npm install
```

## Build
```
npm build
```

## Run
```
npm start
```

## view
访问： http://localhost:4000/