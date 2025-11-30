import type { ImageEditState, Drawing } from '../types';

/**
 * 应用所有编辑操作到图片
 * @param imageSource 图片源（URL 或 base64）
 * @param edits 编辑状态
 * @returns 应用编辑后的 Canvas
 */
export async function applyImageEdits(
    imageSource: string,
    edits: ImageEditState
): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                // 创建临时 canvas
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                if (!tempCtx) {
                    reject(new Error('无法创建 canvas context'));
                    return;
                }

                // 计算旋转后的尺寸
                const isRotated = edits.rotation % 180 !== 0;
                let width = img.width;
                let height = img.height;

                if (isRotated) {
                    [width, height] = [height, width];
                }

                tempCanvas.width = width;
                tempCanvas.height = height;

                // 应用旋转和翻转
                tempCtx.save();
                tempCtx.translate(width / 2, height / 2);
                tempCtx.rotate((edits.rotation * Math.PI) / 180);
                tempCtx.scale(edits.flipH ? -1 : 1, edits.flipV ? -1 : 1);
                tempCtx.drawImage(img, -img.width / 2, -img.height / 2);

                // 应用涂鸦和标注
                // 涂鸦坐标是基于原图的，所以需要应用相同的变换
                // 但因为 drawImage 使用了中心偏移，我们需要将坐标系移回左上角
                if (edits.drawings && edits.drawings.length > 0) {
                    tempCtx.translate(-img.width / 2, -img.height / 2);
                    edits.drawings.forEach(drawing => {
                        drawDrawing(tempCtx, drawing);
                    });
                }

                tempCtx.restore();

                // 应用裁剪
                if (edits.crop) {
                    const finalCanvas = document.createElement('canvas');
                    const finalCtx = finalCanvas.getContext('2d');
                    if (!finalCtx) {
                        reject(new Error('无法创建最终 canvas context'));
                        return;
                    }

                    finalCanvas.width = edits.crop.width;
                    finalCanvas.height = edits.crop.height;

                    finalCtx.drawImage(
                        tempCanvas,
                        edits.crop.x, edits.crop.y, edits.crop.width, edits.crop.height,
                        0, 0, edits.crop.width, edits.crop.height
                    );

                    resolve(finalCanvas);
                } else {
                    resolve(tempCanvas);
                }
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error('图片加载失败'));
        };

        img.src = imageSource;
    });
}

/**
 * 在 canvas 上绘制单个绘图对象
 */
function drawDrawing(ctx: CanvasRenderingContext2D, drawing: Drawing) {
    ctx.save();
    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = drawing.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawing.tool === 'pen') {
        // 画笔：连接所有点
        if (drawing.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
            for (let i = 1; i < drawing.points.length; i++) {
                ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
            }
            ctx.stroke();
        }
    } else if (drawing.tool === 'arrow' && drawing.start && drawing.end) {
        // 箭头
        ctx.beginPath();
        ctx.moveTo(drawing.start.x, drawing.start.y);
        ctx.lineTo(drawing.end.x, drawing.end.y);
        ctx.stroke();

        // 绘制箭头头部
        const headLength = drawing.width * 4;
        const angle = Math.atan2(drawing.end.y - drawing.start.y, drawing.end.x - drawing.start.x);

        ctx.beginPath();
        ctx.moveTo(drawing.end.x, drawing.end.y);
        ctx.lineTo(
            drawing.end.x - headLength * Math.cos(angle - Math.PI / 6),
            drawing.end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(drawing.end.x, drawing.end.y);
        ctx.lineTo(
            drawing.end.x - headLength * Math.cos(angle + Math.PI / 6),
            drawing.end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    } else if (drawing.tool === 'rect' && drawing.start && drawing.end) {
        // 矩形
        const width = drawing.end.x - drawing.start.x;
        const height = drawing.end.y - drawing.start.y;
        ctx.strokeRect(drawing.start.x, drawing.start.y, width, height);
    } else if (drawing.tool === 'circle' && drawing.start && drawing.end) {
        // 圆形/椭圆
        const radiusX = Math.abs(drawing.end.x - drawing.start.x) / 2;
        const radiusY = Math.abs(drawing.end.y - drawing.start.y) / 2;
        const centerX = Math.min(drawing.start.x, drawing.end.x) + radiusX;
        const centerY = Math.min(drawing.start.y, drawing.end.y) + radiusY;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
    }

    ctx.restore();
}
