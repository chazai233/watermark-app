import type { ExifData } from '../types';

// Simplified: Always return current time
// EXIF reading has been removed due to compatibility issues
export const readExifData = async (_file: File): Promise<ExifData> => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return {
        dateTime: `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`,
        make: '',
        model: '',
    };
};
