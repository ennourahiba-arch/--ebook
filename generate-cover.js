const fs = require('fs');
const sharp = require('sharp');
const data = JSON.parse(fs.readFileSync('structure.json', 'utf8'));
const { THEME } = require('./theme');

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]);
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="6.25in" height="9.25in" viewBox="0 0 1875 2775" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(data.title)}</title>
  <desc id="description">A botanical memoir cover in warm terracotta and cream.</desc>
  <rect width="1875" height="2775" fill="#${THEME.paper}"/>
  <rect x="68" y="68" width="1739" height="2639" fill="none" stroke="#${THEME.accentSoft}" stroke-width="3"/>
  <rect x="90" y="90" width="1695" height="2595" fill="none" stroke="#${THEME.accent}" stroke-width="1.5"/>
  <path d="M937 1570 C916 1390 942 1190 916 1018 C893 915 862 820 937 766" fill="none" stroke="#${THEME.accent}" stroke-width="11" stroke-linecap="round"/>
  <path d="M924 1430 C1114 1350 1260 1192 1282 1010 C1082 1040 954 1171 924 1430Z" fill="#${THEME.accentSoft}" opacity=".78"/>
  <path d="M930 1222 C1067 1120 1155 989 1158 838 C1017 873 936 1004 930 1222Z" fill="#${THEME.accent}" opacity=".68"/>
  <g fill="none" stroke="#${THEME.accent}" stroke-width="8">
    <path d="M937 765 C838 661 799 565 846 457 C938 502 978 601 937 765Z"/>
    <path d="M937 765 C1038 664 1080 566 1029 457 C937 503 898 600 937 765Z"/>
    <path d="M937 765 C786 715 688 637 670 522 C785 507 892 578 937 765Z"/>
    <path d="M937 765 C1088 714 1186 637 1204 522 C1089 507 982 577 937 765Z"/>
    <path d="M937 765 C858 848 838 939 887 1011 C957 956 980 867 937 765Z"/>
    <path d="M937 765 C1017 848 1037 939 988 1011 C917 956 894 867 937 765Z"/>
  </g>
  <circle cx="937" cy="765" r="37" fill="#${THEME.accent}"/>
  <path d="M481 2290 H1394" stroke="#${THEME.accentSoft}" stroke-width="2"/>
  <text x="937" y="408" text-anchor="middle" fill="#${THEME.accent}" font-family="${THEME.font}, Georgia, serif" font-size="30" letter-spacing="10">A MEMOIR</text>
  <text x="937" y="1850" text-anchor="middle" fill="#${THEME.ink}" font-family="${THEME.font}, Georgia, serif" font-size="94" font-weight="bold">THE WOMAN</text>
  <text x="937" y="1968" text-anchor="middle" fill="#${THEME.ink}" font-family="${THEME.font}, Georgia, serif" font-size="94" font-weight="bold">WHO HELD ON</text>
  <text x="937" y="2086" text-anchor="middle" fill="#${THEME.ink}" font-family="${THEME.font}, Georgia, serif" font-size="94" font-weight="bold">TO HOPE</text>
  <text x="937" y="2390" text-anchor="middle" fill="#${THEME.ink}" font-family="${THEME.font}, Georgia, serif" font-size="43" letter-spacing="3">${escapeXml(data.author.toUpperCase())}</text>
</svg>`;

async function buildCover() {
  if (fs.existsSync('front.png')) {
    await sharp('front.png').jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile('the_woman_who_held_on_to_hope_cover.jpg');
    console.log('written the_woman_who_held_on_to_hope_cover.jpg from front.png');
    return;
  }
  fs.writeFileSync('the_woman_who_held_on_to_hope_cover.svg', svg);
  await sharp(Buffer.from(svg)).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile('the_woman_who_held_on_to_hope_cover.jpg');
  console.log('written the_woman_who_held_on_to_hope_cover.svg and the_woman_who_held_on_to_hope_cover.jpg');
}

module.exports = { buildCover };

if (require.main === module) {
  buildCover().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}