export const SERVER = 'http://192.168.0.111:6060';

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

    let size = '';
    const parentText = a.parentElement ? a.parentElement.textContent : '';
    const sizeMatch = parentText.match(/(\d+[.\d]*[KMGT]?)\s*$/i);
    if (sizeMatch) size = sizeMatch[1];

    items.push({ name, href: decodeURIComponent(href), isDir, size });
  });

  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return items;
}
