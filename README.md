# 个人主页 Personal Portfolio

杨骏青 Junqing Yang · Robotics & Embodied AI

静态个人主页，无构建步骤，直接由 GitHub Pages 托管。

## 本地预览

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

直接双击 `index.html` 也能看，但用 http server 更接近线上环境。

## 文件结构

```
index.html          页面内容
styles.css          样式（暗色主题，CSS 变量定义在 :root）
script.js           滚动淡入、导航高亮、锚点偏移
assets/images/      图片
assets/videos/      视频
```

## 修改内容

正文直接编辑 `index.html`。改完 `styles.css` 或 `script.js` 后，把 `index.html`
里两处 `?v=` 的版本号一起改掉（例如 `?v=20260831-b` → `?v=20260901-a`），
否则浏览器会继续用缓存的旧文件。

配色改 `styles.css` 顶部 `:root` 里的变量即可，不用逐条找规则。

## 待补充

项目区块里的 `media-placeholder` 是视频/图片占位，素材准备好后替换成
`<video>` 或 `<img>`。
