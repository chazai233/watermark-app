import type { ImageFile, WatermarkConfig } from '../types';
import { readExifData } from './exifReader';

let imageIdCounter = 1;

export const processImageFile = async (file: File, defaultConfig?: WatermarkConfig): Promise<ImageFile> => {
    // 读取EXIF数据
    const exif = await readExifData(file);

    // 创建预览URL
    const preview = URL.createObjectURL(file);

    // 获取图片尺寸
    const dimensions = await getImageDimensions(preview);

    // 默认配置 (如果未提供)
    const config: WatermarkConfig = defaultConfig || {
        area: '',
        content: '',
        useExifTime: true,
        customTime: '',
        timeFormat: 'YYYY.MM.DD HH:mm:ss',
        logo: null,
        customItems: [],
        fontFamily: '"Noto Sans SC", sans-serif',
        fontSize: 24,
        fontColor: '#FFFFFF',
        textShadow: true,
        position: 'bottom-left',
        textAlign: 'left',
        scale: 1.0,
        marginX: 30,
        marginY: 30,
        exportFormat: 'jpeg',
        exportQuality: 0.92,
    };

    return {
        id: imageIdCounter++,
        file,
        name: file.name,
        preview,
        width: dimensions.width,
        height: dimensions.height,
        exif,
        config: JSON.parse(JSON.stringify(config)), // Deep copy to avoid reference issues
    };
};

const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = src;
    });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

export const createCanvas = (width: number, height: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};
