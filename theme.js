const THEMES = {
  terracotta: {
    accent: 'A85C42',
    accentSoft: '9C8776',
    ink: '2B2420',
    paper: 'F3ECE4',
    font: 'Garamond',
  },
  evergreen: {
    accent: '476B57',
    accentSoft: '87937B',
    ink: '263128',
    paper: 'EEF0E8',
    font: 'Baskerville',
  },
  mulberry: {
    accent: '85465A',
    accentSoft: '9A7B82',
    ink: '30242A',
    paper: 'F4EAEC',
    font: 'Palatino Linotype',
  },
  indigo: {
    accent: '3E5C7C',
    accentSoft: '8294A5',
    ink: '222B35',
    paper: 'E9EEF2',
    font: 'Cormorant Garamond',
  },
};

const themeName = process.env.EBOOK_THEME || 'terracotta';
const THEME = THEMES[themeName];
if (!THEME) {
  throw new Error(`Unknown EBOOK_THEME "${themeName}". Choose one of: ${Object.keys(THEMES).join(', ')}`);
}

module.exports = { THEME, THEMES, themeName };