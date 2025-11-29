import type { ImageFile } from '../types';

export interface RenamePattern {
    pattern: string;
    preview: string[];
}

export interface RenameContext {
    name: string;
    index: number;
    date: string;
    time: string;
    area: string;
    content: string;
    exifTime?: string;
}

// 解析命名模式
export const parsePattern = (pattern: string, context: RenameContext): string => {
    return pattern
        .replace(/\{name\}/g, context.name)
        .replace(/\{index\}/g, String(context.index).padStart(3, '0'))
        .replace(/\{date\}/g, context.date)
        .replace(/\{time\}/g, context.time)
        .replace(/\{area\}/g, context.area)
        .replace(/\{content\}/g, context.content)
        .replace(/\{exif_time\}/g, context.exifTime || 'no_time');
};

// 预览重命名结果
export const previewRename = (
    images: ImageFile[],
    pattern: string,
    area: string,
    content: string
): string[] => {
    const now = new Date();
    const date = now.toISOString().split('T')[0].replace(/-/g, '');
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');

    return images.map((img, index) => {
        const nameWithoutExt = img.name.replace(/\.[^/.]+$/, '');
        const ext = img.name.match(/\.[^/.]+$/)?.[0] || '.jpg';

        const context: RenameContext = {
            name: nameWithoutExt,
            index: index + 1,
            date,
            time,
            area,
            content,
            exifTime: img.exif.dateTime?.replace(/:/g, '').replace(' ', '_') || undefined,
        };

        const newName = parsePattern(pattern, context);
        return `${newName}${ext}`;
    });
};

// 常用模板
export const renameTemplates = [
    { label: '原名_水印', pattern: '{name}_watermarked' },
    { label: '序号_日期', pattern: '{index}_{date}' },
    { label: '区域_序号', pattern: '{area}_{index}' },
    { label: '日期_时间_序号', pattern: '{date}_{time}_{index}' },
    { label: '区域_内容_序号', pattern: '{area}_{content}_{index}' },
    { label: 'EXIF时间_序号', pattern: '{exif_time}_{index}' },
];

// 获取安全的文件名（移除非法字符）
export const sanitizeFilename = (filename: string): string => {
    return filename
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_');
};
