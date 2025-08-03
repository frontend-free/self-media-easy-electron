# subject-media-electron

## 开发

> mac 环境

cp .env.copy-development .env.development

```bash
pnpm i
pnpm dev
```

## 打包&部署

打包

```bash
pnpm build:win
```

部署

- 服务器 47.105.58.181
- 上传到目录 /home/ecs-user/apps/static/subject-media-electron/
- 更改 latest.json 的信息

## 技术栈

关键技术栈

- electron electron-vite
- playwright 视频发布
- ffmpeg 直播录制
