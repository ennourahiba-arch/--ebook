const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  PageBreak, PageNumber, Header, Footer, BorderStyle, TableOfContents,
  SectionType, convertInchesToTwip, LevelFormat
} = require('docx');
const { THEME } = require('./theme');

const data = JSON.parse(fs.readFileSync('structure.json', 'utf-8'));

const { accent: ACCENT, accentSoft: ACCENT_SOFT, ink: INK, font: FONT } = THEME;

const numberWords = { One:1, Two:2, Three:3, Four:4, Five:5, Six:6, Seven:7, Eight:8, Nine:9, Ten:10,
  Eleven:11, Twelve:12, Thirteen:13, Fourteen:14, Fifteen:15, Sixteen:16, Seventeen:17, Eighteen:18,
  Nineteen:19, Twenty:20, 'Twenty-One':21, 'Twenty-Two':22, 'Twenty-Three':23, 'Twenty-Four':24,
  'Twenty-Five':25, 'Twenty-Six':26, 'Twenty-Seven':27, 'Twenty-Eight':28, 'Twenty-Nine':29, Thirty:30 };

// ---------- helpers ----------
function ornament(sizeOverride) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    keepNext: true,
    spacing: { before: 120, after: 240 },
    children: [ new TextRun({ text: '❁', font: FONT, color: ACCENT, size: sizeOverride || 30 }) ],
  });
}

function sceneBreak() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [ new TextRun({ text: '❁ ❁ ❁', font: FONT, color: ACCENT_SOFT, size: 16, characterSpacing: 40 }) ],
  });
}

function bodyParagraph(text, opts = {}) {
  const { firstOfChapter = false } = opts;
  if (firstOfChapter) {
    // split first ~4 words into small caps for an elegant chapter opening
    const words = text.split(' ');
    const leadCount = Math.min(4, words.length);
    const lead = words.slice(0, leadCount).join(' ');
    const rest = words.slice(leadCount).join(' ');
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      widowControl: true,
      keepLines: true,
      spacing: { line: 300, after: 200 },
      children: [
        new TextRun({ text: lead + (rest ? ' ' : ''), font: FONT, size: 25, color: INK, smallCaps: true, characterSpacing: 10 }),
        new TextRun({ text: rest, font: FONT, size: 25, color: INK }),
      ],
    });
  }
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    widowControl: true,
    keepLines: true,
    indent: { firstLine: convertInchesToTwip(0.28) },
    spacing: { line: 300, after: 130 },
    children: [ new TextRun({ text, font: FONT, size: 25, color: INK }) ],
  });
}

function buildBody(bodyArr) {
  const out = [];
  let first = true;
  for (const p of bodyArr) {
    if (p === '***SCENEBREAK***') {
      out.push(sceneBreak());
      first = true; // next paragraph after a scene break gets the elegant treatment again
      continue;
    }
    out.push(bodyParagraph(p, { firstOfChapter: first }));
    first = false;
  }
  return out;
}

function chapterLabel(num) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    keepNext: true,
    keepLines: true,
    spacing: { before: 0, after: 40 },
    children: [ new TextRun({ text: `CHAPTER ${num.toUpperCase()}`, font: FONT, size: 18, color: ACCENT_SOFT, bold: true, characterSpacing: 60 }) ],
  });
}

function chapterTitle(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    keepNext: true,
    keepLines: true,
    spacing: { before: 0, after: 60 },
    children: [ new TextRun({ text: title, font: FONT, size: 44, bold: true, color: INK }) ],
  });
}

// ---------- document assembly ----------
const children = [];

// ===== Title page =====
children.push(
  new Paragraph({ spacing: { before: 2400 }, children: [] }),
  ornament(40),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [ new TextRun({ text: data.title, font: FONT, size: 66, bold: true, color: INK }) ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 700 },
    children: [ new TextRun({ text: 'A Memoir', font: FONT, size: 26, italics: true, color: ACCENT }) ],
  }),
  ornament(26),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 900 },
    children: [ new TextRun({ text: 'BY', font: FONT, size: 18, color: ACCENT_SOFT, characterSpacing: 80 }) ],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100 },
    children: [ new TextRun({ text: data.author, font: FONT, size: 32, color: INK, characterSpacing: 20 }) ],
  }),
  new Paragraph({ children: [ new PageBreak() ] }),
);

// ===== Front matter (Dedication, Foreword, Introduction, Acknowledgment) =====
for (const section of data.front_matter) {
  const isDedication = section.heading === 'Dedication';
  children.push(
    ornament(26),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      keepNext: true,
      keepLines: true,
      spacing: { after: 300 },
      children: [ new TextRun({ text: section.heading, font: FONT, size: 34, bold: true, color: INK, characterSpacing: 20 }) ],
    }),
  );
  if (isDedication) {
    for (const p of section.body) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200, line: 320 },
        children: [ new TextRun({ text: p, font: FONT, size: 25, italics: true, color: INK }) ],
      }));
    }
  } else {
    children.push(...buildBody(section.body));
  }
  children.push(new Paragraph({ children: [ new PageBreak() ] }));
}

// ===== Table of contents (manually authored so it always displays, in any viewer) =====
children.push(
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { after: 500 },
    children: [ new TextRun({ text: 'Contents', font: FONT, size: 34, bold: true, color: INK, characterSpacing: 20 }) ],
  }),
);
for (const section of data.front_matter) {
  if (section.heading === 'Dedication') continue;
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 },
    children: [ new TextRun({ text: section.heading, font: FONT, size: 24, color: INK }) ],
  }));
}
for (const ch of data.chapters) {
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 },
    children: [
      new TextRun({ text: `Chapter ${ch.number}`, font: FONT, size: 18, color: ACCENT, bold: true, characterSpacing: 30 }),
      new TextRun({ text: '   ' + (ch.subtitle || ''), font: FONT, size: 24, color: INK }),
    ],
  }));
}
children.push(new Paragraph({ children: [ new PageBreak() ] }));

// ===== Chapters =====
for (const ch of data.chapters) {
  children.push(
    new Paragraph({ spacing: { before: 900 }, children: [] }),
    chapterLabel(ch.number),
    chapterTitle(ch.subtitle || `Chapter ${ch.number}`),
    ornament(22),
  );
  children.push(...buildBody(ch.body));
  children.push(new Paragraph({ children: [ new PageBreak() ] }));
}

// ===== Back matter (Acknowledgment, etc.) =====
for (const section of (data.back_matter || [])) {
  children.push(
    ornament(26),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      keepNext: true,
      keepLines: true,
      spacing: { after: 300 },
      children: [ new TextRun({ text: section.heading, font: FONT, size: 34, bold: true, color: INK, characterSpacing: 20 }) ],
    }),
  );
  children.push(...buildBody(section.body));
  children.push(new Paragraph({ children: [ new PageBreak() ] }));
}
children.pop(); // remove trailing page break after the very last section

// ---------- header / footer ----------
const header = new Header({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D9CFC4', space: 6 } },
      children: [ new TextRun({ text: data.title.toUpperCase(), font: FONT, size: 15, color: ACCENT_SOFT, characterSpacing: 40 }) ],
    }),
  ],
});

const footer = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '— ', font: FONT, size: 20, color: ACCENT_SOFT }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20, color: ACCENT_SOFT }),
        new TextRun({ text: ' —', font: FONT, size: 20, color: ACCENT_SOFT }),
      ],
    }),
  ],
});

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: 25, color: INK } },
    },
  },
  features: { updateFields: true },
  sections: [
    {
      properties: {
        page: {
          size: { width: 8640, height: 12960 }, // 6in x 9in trim size (common book format), in twips
          margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
        },
        titlePage: true,
      },
      headers: { default: header, first: new Header({ children: [new Paragraph('')] }) },
      footers: { default: footer, first: new Footer({ children: [new Paragraph('')] }) },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync('the_woman_who_held_on_to_hope.docx', buf);
  console.log('written', buf.length, 'bytes');
});
