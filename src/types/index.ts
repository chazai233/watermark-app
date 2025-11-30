export interface ExifData {
    dateTime?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAltitude?: number;
    make?: string;
    model?: string;
    [key: string]: any;
}

// 绘图工具类型
export type DrawingTool = 'pen' | 'arrow' | 'rect' | 'circle';

// 绘图对象
export interface Drawing {
    tool: DrawingTool;
    points: { x: number; y: number }[];  // 用于 pen
    start?: { x: number; y: number };    // 用于形状
    end?: { x: number; y: number };      // 用于形状
    color: string;
    width: number;
}

// 图片编辑状态
export interface ImageEditState {
    rotation: number;        // 旋转角度：0, 90, 180, 270
    flipH: boolean;          // 水平翻转
    flipV: boolean;          // 垂直翻转
    crop?: {                 // 裁剪区域（像素坐标）
        unit: 'px';
        x: number;
        y: number;
        width: number;
        height: number;
    };
    drawings: Drawing[];     // 涂鸦和标注
}

export interface ImageFile {
    id: number;
    file: File;
    name: string;
    preview: string;
    width: number;
    height: number;
    exif: ExifData;
    edits?: ImageEditState;  // 编辑状态
    originalPreview?: string; // 原始图片预览（用于编辑回退）
}

export interface CustomItem {
    id: number;
    label: string;
    value: string;
}

export interface WatermarkConfig {
    // 内容
    area: string;
    content: string;
    useExifTime: boolean;
    customTime: string;
    timeFormat: string;
    logo: string | null;
    customItems: CustomItem[];

    // 样式
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    textShadow: boolean;
    position: string;
    textAlign: 'left' | 'center' | 'right';

    // 布局
    scale: number;
    marginX: number;
    marginY: number;

    // 导出选项
    exportFormat: 'jpeg' | 'png' | 'webp';
    exportQuality: number; // 0.1 - 1.0
}

export interface FontOption {
    label: string;
    value: string;
}

export interface TimeFormatOption {
    label: string;
    value: string;
}
