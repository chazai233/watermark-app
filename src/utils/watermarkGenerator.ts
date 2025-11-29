import type { WatermarkConfig, ImageFile } from '../types';
import { loadImage, createCanvas } from './imageProcessor';

interface WatermarkLine {
    text: string;
    icon?: string;
}

export const generateWatermarkedImage = async (
    imageFile: ImageFile,
    config: WatermarkConfig,
    displayTime: string
): Promise<Blob> => {
    // 加载原图
    const img = await loadImage(imageFile.preview);

    // 创建canvas
    const canvas = createCanvas(imageFile.width, imageFile.height);
    const ctx = canvas.getContext('2d')!;

    // 绘制原图
    ctx.drawImage(img, 0, 0, imageFile.width, imageFile.height);

    // 准备水印内容
    const lines: WatermarkLine[] = [];

    if (config.area) {
        lines.push({ text: `施工区域：${config.area}` });
    }

    if (config.content) {
        lines.push({ text: `施工内容：${config.content}` });
    }

    lines.push({ text: `拍摄时间：${displayTime}` });

    config.customItems.forEach(item => {
        if (item.value) {
            lines.push({ text: `${item.label}：${item.value}` });
        }
    });

    // 绘制水印
    await drawWatermark(ctx, canvas, lines, config);

    // 转换为Blob - 使用配置的格式和质量
    const mimeType = config.exportFormat === 'png' ? 'image/png'
        : config.exportFormat === 'webp' ? 'image/webp'
            : 'image/jpeg';

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob!);
        }, mimeType, config.exportQuality);
    });
};

const drawWatermark = async (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    lines: WatermarkLine[],
    config: WatermarkConfig
) => {
    // Apply scale to BOTH fontSize AND margin
    const fontSize = config.fontSize * config.scale;
    const lineHeight = fontSize * 1.4;
    const margin = config.marginX;  // Removed config.scale to keep margin absolute

    // 设置字体样式
    ctx.font = `${fontSize}px ${config.fontFamily}`;
    ctx.fillStyle = config.fontColor;
    ctx.textBaseline = 'top';

    // 设置阴影
    if (config.textShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
    }

    // 计算总高度
    const totalHeight = lines.length * lineHeight + (config.logo ? 50 * config.scale : 0);

    // 计算起始位置
    let x = margin;
    let y = margin;

    const pos = config.position;

    if (pos.includes('right')) {
        x = canvas.width - margin;
    } else if (pos.includes('center') && !pos.includes('left') && !pos.includes('right')) {
        x = canvas.width / 2;
    }

    if (pos.includes('bottom')) {
        y = canvas.height - margin - totalHeight;
    } else if (pos === 'center') {
        y = (canvas.height - totalHeight) / 2;
    }

    // 绘制Logo
    if (config.logo) {
        try {
            const logoImg = await loadImage(config.logo);
            const logoHeight = 40 * config.scale;
            const logoWidth = (logoImg.width / logoImg.height) * logoHeight;

            let logoX = x;
            if (config.textAlign === 'center') logoX -= logoWidth / 2;
            else if (config.textAlign === 'right') logoX -= logoWidth;

            ctx.drawImage(logoImg, logoX, y, logoWidth, logoHeight);
            y += logoHeight + 10 * config.scale;
        } catch (e) {
            console.error('Failed to load logo:', e);
        }
    }

    // 绘制文字
    lines.forEach(line => {
        ctx.textAlign = config.textAlign;
        ctx.fillText(line.text, x, y);
        y += lineHeight;
    });
};
