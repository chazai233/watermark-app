export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const getExportFilename = (originalName: string, suffix: string = '_watermarked'): string => {
    const lastDot = originalName.lastIndexOf('.');
    if (lastDot === -1) {
        return `${originalName}${suffix}.jpg`;
    }

    const name = originalName.substring(0, lastDot);
    const ext = originalName.substring(lastDot);

    return `${name}${suffix}${ext}`;
};

export const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
