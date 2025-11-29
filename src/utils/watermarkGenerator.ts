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
    // 计算自适应缩放比例 (以1000px为基准)
    const refSize = 1000;
    const currentSize = Math.min(canvas.width, canvas.height);
    const ratio = Math.max(0.5, currentSize / refSize); // 限制最小缩放比为0.5，防止在极小图上太小

    // Apply scale to BOTH fontSize AND margin
    const fontSize = config.fontSize * config.scale * ratio;
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

    // 计算最大宽度
    let maxLineWidth = 0;
    lines.forEach(line => {
        const width = ctx.measureText(line.text).width;
        if (width > maxLineWidth) maxLineWidth = width;
    });

    // 计算Logo宽度并更新最大宽度
    let logoWidth = 0;
    let logoHeight = 0;
    if (config.logo) {
        try {
            const logoImg = await loadImage(config.logo);
            logoHeight = 40 * config.scale * ratio;
            logoWidth = (logoImg.width / logoImg.height) * logoHeight;
            if (logoWidth > maxLineWidth) maxLineWidth = logoWidth;
        } catch (e) {
            console.error('Failed to load logo:', e);
        }
    }

    // 计算总高度
    const totalHeight = lines.length * lineHeight + (config.logo ? logoHeight + 10 * config.scale * ratio : 0);

    // 计算水印块的左上角位置 (blockX, blockY)
    let blockX = margin;
    let blockY = margin;

    const pos = config.position;

    // 水平位置
    if (pos.includes('right')) {
        blockX = canvas.width - margin - maxLineWidth;
    } else if (pos.includes('center') && !pos.includes('left') && !pos.includes('right')) {
        blockX = (canvas.width - maxLineWidth) / 2;
    }

    // 垂直位置
    if (pos.includes('bottom')) {
        blockY = canvas.height - margin - totalHeight;
    } else if (pos === 'center') {
        blockY = (canvas.height - totalHeight) / 2;
    }

    // 绘制Logo
    if (config.logo) {
        try {
            const logoImg = await loadImage(config.logo);
            let logoX = blockX;

            // Logo在块内对齐
            if (config.textAlign === 'center') logoX = blockX + (maxLineWidth - logoWidth) / 2;
            else if (config.textAlign === 'right') logoX = blockX + maxLineWidth - logoWidth;

            ctx.drawImage(logoImg, logoX, blockY, logoWidth, logoHeight);
            blockY += logoHeight + 10 * config.scale * ratio;
        } catch (e) {
            // Logo加载失败已在上面处理过
        }
    }

    // 绘制文字
    lines.forEach(line => {
        let x = blockX;
        // 文字在块内对齐
        if (config.textAlign === 'center') x = blockX + maxLineWidth / 2;
        else if (config.textAlign === 'right') x = blockX + maxLineWidth;

        ctx.textAlign = config.textAlign;
        ctx.fillText(line.text, x, blockY);
        blockY += lineHeight;
    });
};
