# ccgs1 项目上下文

## 当前项目
- OneAPI Studio 的静态网站，入口是 `index.html`，资源位于 `assets/`。
- 落地页是全站深色主题，样式在 `assets/site.css`（与工作台共用强调色：图片=琥珀、视频=紫、Coding=青）。
- 当前使用原生 HTML、CSS、JavaScript；没有 Next.js、npm 构建或后端服务。
- `index-dark-backup.html` 是历史设计备份。
- 修改时遵循现有实现，不因父目录的通用技术栈假设而自动迁移框架。

## 来源与开发
- 从 `/Users/liwangyu/ccgs-workspace/oneapi-studio` 完整复制，保留了 Git 历史。
- 此目录是继续开发的副本，与原 Docker 工作区不会自动同步。
- 本地预览可在此目录运行 `python3 -m http.server 14174 --bind 127.0.0.1`，浏览器访问 `http://127.0.0.1:14174/`。如果端口被占用，选择其他空闲端口。
- 代码复制不包含部署授权；发布、域名和生产环境变更需遵循用户指示及父目录规则。

## 创作工作台（demo）
- 点能力卡会翻转放大成全屏工作台，代码在 `assets/studio.css`、`assets/studio.js`；模型与价格复用 `index.html` 暴露的 `window.OneAPIData`。
- 纯前端演示：生成按钮不调用真实 API，结果取自本地示例素材。
- 接入信息与「创建 API Key」弹窗在 `assets/access.js`：Key 在浏览器本地生成（`sk-oneapi-demo-…`，存 localStorage），**只是演示，不能真实调用**；正式上线需接注册登录与后端发 Key。
- 工作台的「用 API 调用」按当前模型和参数生成 curl / Python 请求；接口地址统一取自 `index.html` 的 `API_BASE`。
- `index.html` 模型数据里的 `id` 是按名称生成的演示调用名，**上线前需换成上游真实模型 ID**，否则用户复制去调用会报错。
- `assets/showcase/image-*.webp`、`video-*.webp` 为 oiioii.ai 首页展示作品的封面，仅供本地演示，**上线或对外展示前必须替换为自有素材**。`code-*.svg` 为脚本生成的示意图，可直接使用。
