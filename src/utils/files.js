export const SERVER = 'http://192.168.1.111:6060';

export const EXT_MAP = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'],
  video: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv', 'm4v'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  doc: ['pdf', 'txt', 'csv', 'json', 'xml', 'log', 'md', 'yaml', 'yml'],
  code: ['py', 'js', 'html', 'css', 'sh', 'bash', 'sql', 'java', 'cpp', 'c', 'go', 'rs'],
  archive: ['zip', 'tar', 'gz', 'bz2', 'rar', '7z', 'xz'],
};

export function getExt(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function getFileType(name) {
  const ext = getExt(name);
  for (const [type, exts] of Object.entries(EXT_MAP)) {
    if (exts.includes(ext)) return type;
  }
  return 'other';
}

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Turn an autoindex date ("24-Nov-2026", "07:59[:12]") into a sortable epoch ms.
export function parseListingDate(dmy, hms) {
  const m = dmy.match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (!m) return NaN;
  const day = parseInt(m[1], 10);
  const month = MONTHS[m[2].toLowerCase()];
  const year = parseInt(m[3], 10);
  if (month === undefined) return NaN;
  const [hh = 0, mm = 0, ss = 0] = (hms || '').split(':').map((v) => parseInt(v, 10) || 0);
  return Date.UTC(year, month, day, hh, mm, ss);
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function parseDirectoryListing(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a');
  const items = [];

  links.forEach((a) => {
    let href = a.getAttribute('href');
    let name = a.textContent.trim();

    if (!href || href === '../' || href === '.' || href === '..' || name === '..') return;
    if (href.startsWith('?') || href.startsWith('#')) return;

    const isDir = href.endsWith('/');
    name = decodeURIComponent(name).replace(/\/$/, '');

    // In an Apache/nginx autoindex, the modified date and size sit in the text
    // node that follows the link, e.g. "   24-Nov-2026 07:59       -"
    const trailing = a.nextSibling ? a.nextSibling.textContent : '';

    let date = '';
    let ts = NaN;
    const dateMatch = trailing.match(/(\d{1,2}-[A-Za-z]{3}-\d{4})\s+(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (dateMatch) {
      date = `${dateMatch[1]} ${dateMatch[2]}`;
      ts = parseListingDate(dateMatch[1], dateMatch[2]);
    }

    let size = '';
    const sizeMatch = trailing.trim().match(/([\d.]+[KMGT]?)\s*$/i);
    if (sizeMatch) size = sizeMatch[1];

    items.push({ name, href: decodeURIComponent(href), isDir, size, date, ts });
  });

  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    // Numbered folders (ball 1, 2, 3 …) keep their natural numeric order.
    const an = Number(a.name);
    const bn = Number(b.name);
    if (a.name !== '' && b.name !== '' && !isNaN(an) && !isNaN(bn)) return an - bn;
    // Otherwise (sessions, bookings) show newest first when both have a timestamp.
    if (!isNaN(a.ts) && !isNaN(b.ts) && a.ts !== b.ts) return b.ts - a.ts;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  return items;
}
