const fs = require('fs');
const JSZip = require('jszip');
const data = JSON.parse(fs.readFileSync('structure.json', 'utf8'));
const { THEME } = require('./theme');

const outputFile = 'the_woman_who_held_on_to_hope.epub';
const identifier = 'urn:uuid:1a9399ee-e6d2-4f12-8e0a-8b337eae6b78';

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]);
}

function xhtml(title, content) {
  return `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en"><head><title>${escapeXml(title)}</title><link rel="stylesheet" type="text/css" href="styles.css"/></head><body>${content}</body></html>`;
}

function paragraphHtml(paragraphs) {
  let opening = true;
  return paragraphs.map((paragraph) => {
    if (paragraph === '***SCENEBREAK***') {
      opening = true;
      return '<div class="scene-break" aria-label="scene break">* * *</div>';
    }
    const words = paragraph.split(' ');
    const lead = opening ? `<span class="opening">${escapeXml(words.splice(0, 4).join(' '))}${words.length ? ' ' : ''}</span>` : '';
    opening = false;
    return `<p>${lead}${escapeXml(words.join(' '))}</p>`;
  }).join('\n');
}

function chapterContent(chapter) {
  return `<p class="chapter-number">CHAPTER ${escapeXml(chapter.number.toUpperCase())}</p><h1>${escapeXml(chapter.subtitle || `Chapter ${chapter.number}`)}</h1><div class="ornament">*</div>${paragraphHtml(chapter.body)}`;
}

const spine = [];
const manifest = [];
const navItems = [];
const files = [];
let order = 1;

function addDocument(id, href, label, content) {
  files.push({ href, content: xhtml(label, content) });
  manifest.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
  spine.push(`<itemref idref="${id}"/>`);
  navItems.push({ href, label, order: order++ });
}

addDocument('cover', 'cover.xhtml', 'Cover', '<section class="cover"><img src="cover.jpg" alt="Cover of The Woman Who Held On to Hope"/></section>');
addDocument('title-page', 'title-page.xhtml', data.title, `<section class="title-page"><div class="ornament">*</div><h1>${escapeXml(data.title)}</h1><p class="subtitle">A Memoir</p><p class="author">${escapeXml(data.author)}</p></section>`);

for (const [index, section] of data.front_matter.entries()) {
  addDocument(`front-${index}`, `front-${index}.xhtml`, section.heading, `<section><h1>${escapeXml(section.heading)}</h1>${paragraphHtml(section.body)}</section>`);
}
for (const [index, chapter] of data.chapters.entries()) {
  addDocument(`chapter-${index + 1}`, `chapter-${index + 1}.xhtml`, `Chapter ${chapter.number}: ${chapter.subtitle}`, `<section class="chapter">${chapterContent(chapter)}</section>`);
}
for (const [index, section] of (data.back_matter || []).entries()) {
  addDocument(`back-${index}`, `back-${index}.xhtml`, section.heading, `<section><h1>${escapeXml(section.heading)}</h1>${paragraphHtml(section.body)}</section>`);
}

const navigation = navItems.map((item) => `<li><a href="${item.href}">${escapeXml(item.label)}</a></li>`).join('\n');
const ncxNavigation = navItems.map((item) => `<navPoint id="nav-${item.order}" playOrder="${item.order}"><navLabel><text>${escapeXml(item.label)}</text></navLabel><content src="${item.href}"/></navPoint>`).join('\n');
const css = `@namespace epub "http://www.idpf.org/2007/ops";
body { color: #${THEME.ink}; font-family: Georgia, serif; font-size: 1em; line-height: 1.55; margin: 5%; }
h1 { break-before: page; font-size: 1.65em; line-height: 1.2; margin: 2.8em 0 1.4em; text-align: center; }
p { margin: 0 0 0.7em; text-align: justify; text-indent: 1.35em; }
h1 + p, .ornament + p, .chapter-number + h1 + .ornament + p { text-indent: 0; }
.opening { font-variant: small-caps; letter-spacing: .04em; }
.chapter-number, .subtitle, .author { letter-spacing: .12em; text-align: center; text-indent: 0; }
.chapter-number, .subtitle { color: #${THEME.accent}; font-size: .82em; }
.author { margin-top: 4em; }
.ornament, .scene-break { color: #${THEME.accent}; margin: 1.2em 0; text-align: center; }
.title-page { break-before: page; padding-top: 26%; text-align: center; }
.title-page h1 { break-before: auto; font-size: 2.2em; margin: .7em 0; }
.cover { margin: -5%; padding: 0; }
.cover img { display: block; height: auto; width: 100%; }
nav ol { list-style: none; margin: 0; padding: 0; }
nav li { margin: .7em 0; }
a { color: #${THEME.ink}; text-decoration: none; }`;

const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="3.0" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${identifier}</dc:identifier>
    <dc:title>${escapeXml(data.title)}</dc:title>
    <dc:creator>${escapeXml(data.author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
    <item id="cover-image" href="cover.jpg" media-type="image/jpeg" properties="cover-image"/>
    ${manifest.join('\n    ')}
  </manifest>
  <spine toc="ncx">${spine.slice(0, 2).join('')}<itemref idref="nav"/>${spine.slice(2).join('')}</spine>
</package>`;

async function buildEpub() {
  if (!fs.existsSync('the_woman_who_held_on_to_hope_cover.jpg')) {
    await require('./generate-cover').buildCover();
  }
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  zip.file('OEBPS/content.opf', opf);
  zip.file('OEBPS/styles.css', css);
  zip.file('OEBPS/nav.xhtml', xhtml('Contents', `<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${navigation}</ol></nav>`));
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${identifier}"/></head><docTitle><text>${escapeXml(data.title)}</text></docTitle><navMap>${ncxNavigation}</navMap></ncx>`);
  zip.file('OEBPS/cover.jpg', fs.readFileSync('the_woman_who_held_on_to_hope_cover.jpg'));
  for (const file of files) zip.file(`OEBPS/${file.href}`, file.content);
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.writeFileSync(outputFile, buffer);
  console.log(`written ${outputFile} (${buffer.length} bytes)`);
}

buildEpub().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});