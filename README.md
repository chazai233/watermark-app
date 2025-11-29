# 水印大师 - 专业施工照片水印工具

一款专业的PC/WEB端水印软件，专为施工照片管理设计，支持批量添加水印、EXIF信息读取和自定义样式。

## ✨ 功能特性

### 核心功能
- 📸 **真实图片处理** - 支持多张图片上传，保留原始分辨率
- 📋 **EXIF自动读取** - 自动提取拍摄时间、GPS位置、相机信息
- 🎨 **实时预览** - 所见即所得的水印效果预览
- 💾 **批量导出** - 一键导出所有选中的图片

### 样式自定义
- 🎯 9个位置选择（上中下×左中右）
- 🔤 7种字体选择（思源黑体、宋体、楷体等）
- 🎨 自定义颜色和阴影效果
- 📏 精确的边距和缩放控制

### 内容设置
- 🖼️ Logo上传支持
- 📝 施工区域/内容自定义
- ⏰ 5种时间格式
- ➕ 无限自定义字段

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 构建生产版本

```bash
npm run build
```

## 📖 使用指南

### 1. 上传图片
- 点击左侧"添加照片"按钮
- 选择一张或多张图片
- 图片将显示在左侧列表，自动读取EXIF信息

### 2. 配置水印

**外观设置**:
- 选择水印位置（9个预设位置）
- 调整整体缩放（0.5x ~ 2.0x）
- 设置边缘距离（0 ~ 100px）
- 选择字体和颜色

**内容设置**:
- 上传Logo（支持透明PNG）
- 填写施工区域和内容
- 选择时间格式（或使用自定义时间）
- 添加自定义项（备注、天气等）

### 3. 导出图片
- 勾选要导出的图片
- 点击"批量导出"按钮
- 图片将自动下载，文件名添加"_watermarked"后缀

## 🛠️ 技术栈

- **框架**: Vite + React + TypeScript
- **样式**: Tailwind CSS
- **图标**: lucide-react
- **EXIF读取**: exif-js
- **图片处理**: HTML Canvas API

## 📁 项目结构

```
watermark-app/
├── src/
│   ├── types/           # TypeScript类型定义
│   ├── utils/           # 工具函数
│   │   ├── exifReader.ts         # EXIF信息读取
│   │   ├── imageProcessor.ts     # 图片处理
│   │   ├── watermarkGenerator.ts # 水印生成
│   │   └── exportHelper.ts       # 导出功能
│   ├── App.tsx          # 主应用组件
│   └── index.css        # 全局样式
├── package.json
└── vite.config.ts
```

## 🎯 核心实现

### EXIF信息读取

```typescript
import EXIF from 'exif-js';

EXIF.getData(file, function() {
  const dateTime = EXIF.getTag(this, 'DateTime');
  const gpsLat = EXIF.getTag(this, 'GPSLatitude');
  const make = EXIF.getTag(this, 'Make');
  // ...
});
```

### Canvas水印绘制

```typescript
// 绘制原图
ctx.drawImage(img, 0, 0, width, height);

// 设置样式
ctx.font = `${fontSize}px ${fontFamily}`;
ctx.fillStyle = fontColor;
ctx.shadowColor = 'rgba(0,0,0,0.8)';

// 绘制水印
ctx.fillText(text, x, y);

// 导出为JPEG
canvas.toBlob(blob => {
  downloadBlob(blob, filename);
}, 'image/jpeg', 0.85);
```

## 🔧 浏览器支持

- Chrome/Edge (推荐)
- Firefox
- Safari

## 📝 注意事项

1. **图片格式**: 支持JPG、PNG等常见格式
2. **EXIF读取**: 某些编辑过的图片可能没有EXIF信息
3. **批量导出**: 导出大量图片时可能需要允许浏览器多个下载
4. **文件命名**: 导出的文件自动添加"_watermarked"后缀

## 🎨 界面预览

应用界面包含三个主要区域：

- **左侧面板**: 图片列表管理（可折叠）
- **中间画布**: 实时预览区域（支持缩放）
- **右侧面板**: 水印设置选项（可折叠）

## 📄 License

MIT

## 👨‍💻 作者

基于用户提供的demo开发，由Antigravity AI助手实现。

## 🙏 致谢

- [Vite](https://vitejs.dev/) - 快速的前端构建工具
- [React](https://react.dev/) - UI框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [exif-js](https://github.com/exif-js/exif-js) - EXIF读取库
- [lucide-react](https://lucide.dev/) - 图标库

---

**享受使用水印大师！** 🎉
