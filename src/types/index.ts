export interface ExifData {
    dateTime?: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAltitude?: number;
    make?: string;
    model?: string;
    [key: string]: any;
}

export interface ImageFile {
    id: number;
    file: File;
    name: string;
    preview: string;
    width: number;
    height: number;
    exif: ExifData;
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
