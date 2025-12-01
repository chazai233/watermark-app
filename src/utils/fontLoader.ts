/**
 * Utility to load Google Fonts dynamically
 */

// Keep track of loaded fonts to avoid duplicate requests
const loadedFonts = new Set<string>();

export const loadFont = (fontFamily: string, fontUrl?: string) => {
    if (!fontUrl || loadedFonts.has(fontFamily)) return;

    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    loadedFonts.add(fontFamily);
};

export const GOOGLE_FONTS = [
    // Chinese Fonts
    { label: '思源黑体 (Noto Sans SC)', value: '"Noto Sans SC", sans-serif', url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap' },
    { label: '思源宋体 (Noto Serif SC)', value: '"Noto Serif SC", serif', url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700&display=swap' },
    { label: '站酷小薇 (ZCOOL XiaoWei)', value: '"ZCOOL XiaoWei", serif', url: 'https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap' },
    { label: '站酷庆科黄油体 (ZCOOL QingKe HuangYou)', value: '"ZCOOL QingKe HuangYou", display', url: 'https://fonts.googleapis.com/css2?family=ZCOOL+QingKe+HuangYou&display=swap' },
    { label: '站酷快乐体 (ZCOOL KuaiLe)', value: '"ZCOOL KuaiLe", display', url: 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap' },
    { label: '马善政毛笔 (Ma Shan Zheng)', value: '"Ma Shan Zheng", cursive', url: 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap' },
    { label: '龙苍 (Long Cang)', value: '"Long Cang", cursive', url: 'https://fonts.googleapis.com/css2?family=Long+Cang&display=swap' },
    { label: '志莽行书 (Zhi Mang Xing)', value: '"Zhi Mang Xing", cursive', url: 'https://fonts.googleapis.com/css2?family=Zhi+Mang+Xing&display=swap' },
    { label: '刘建毛笔 (Liu Jian Mao Cao)', value: '"Liu Jian Mao Cao", cursive', url: 'https://fonts.googleapis.com/css2?family=Liu+Jian+Mao+Cao&display=swap' },

    // English/Number Fonts (Good for timestamps)
    { label: 'Roboto (无衬线)', value: '"Roboto", sans-serif', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' },
    { label: 'Oswald (紧凑型)', value: '"Oswald", sans-serif', url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&display=swap' },
    { label: 'Montserrat (现代)', value: '"Montserrat", sans-serif', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap' },
    { label: 'Lato (优雅)', value: '"Lato", sans-serif', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
];

export const SYSTEM_FONTS = [
    { label: '系统默认', value: 'sans-serif' },
    { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
    { label: '黑体', value: 'SimHei, sans-serif' },
    { label: '宋体', value: 'SimSun, serif' },
    { label: '仿宋', value: 'FangSong, serif' },
    { label: '楷体', value: 'KaiTi, serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
];

export const ALL_FONTS = [...SYSTEM_FONTS, ...GOOGLE_FONTS];
