import type { WatermarkConfig } from '../types';

export interface Template {
    id: string;
    name: string;
    config: Omit<WatermarkConfig, 'customItems'> & { customItems: Array<{ label: string; value: string }> };
    createdAt: string;
    thumbnail?: string;
}

const STORAGE_KEY = 'watermark_templates';

export const templateManager = {
    // 获取所有模板
    getTemplates(): Template[] {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch {
            return [];
        }
    },

    // 保存新模板
    saveTemplate(name: string, config: WatermarkConfig): Template {
        const templates = this.getTemplates();
        const newTemplate: Template = {
            id: Date.now().toString(),
            name,
            config: {
                ...config,
                customItems: config.customItems.map(item => ({ label: item.label, value: item.value }))
            },
            createdAt: new Date().toISOString(),
        };

        templates.push(newTemplate);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
        return newTemplate;
    },

    // 加载模板
    loadTemplate(id: string): Template | null {
        const templates = this.getTemplates();
        return templates.find(t => t.id === id) || null;
    },

    // 删除模板
    deleteTemplate(id: string): boolean {
        const templates = this.getTemplates();
        const filtered = templates.filter(t => t.id !== id);
        if (filtered.length === templates.length) return false;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    },

    // 重命名模板
    renameTemplate(id: string, newName: string): boolean {
        const templates = this.getTemplates();
        const template = templates.find(t => t.id === id);
        if (!template) return false;

        template.name = newName;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
        return true;
    },

    // 更新模板
    updateTemplate(id: string, config: WatermarkConfig): boolean {
        const templates = this.getTemplates();
        const template = templates.find(t => t.id === id);
        if (!template) return false;

        template.config = {
            ...config,
            customItems: config.customItems.map(item => ({ label: item.label, value: item.value }))
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
        return true;
    },
};
