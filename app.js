// ---- Configuration ----
const SERVER = 'http://192.168.0.111:6060';
const BASE_PATH = '/';

// ---- State ----
let currentPath = BASE_PATH;
let allItems = [];
let viewMode = 'grid';
let currentFileUrl = '';
let currentCsvData = null;

// ---- File type helpers ----
const EXT_MAP = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff'],
  video: ['mp4', 'avi', 'mkv', 'mov', 'webm', 'flv', 'wmv', 'm4v'],
  audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
  doc: ['pdf', 'txt', 'csv', 'json', 'xml', 'log', 'md', 'yaml', 'yml'],
  code: ['py', 'js', 'html', 'css', 'sh', 'bash', 'sql', 'java', 'cpp', 'c', 'go', 'rs'],
  archive: ['zip', 'tar', 'gz', 'bz2', 'rar', '7z', 'xz'],
};

function getExt(name) {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function getFileType(name) {
  const ext = getExt(name);
  for (const [type, exts] of Object.entries(EXT_MAP)) {
    if (exts.includes(ext)) return type;
  }
  return 'other';
}

function getIcon(name, isDir) {
  if (isDir) return '<i data-lucide="folder" style="color:var(--folder)"></i>';
  const type = getFileType(name);
  switch (type) {
    case 'image': return '<i data-lucide="image" style="color:var(--image)"></i>';
    case 'video': return '<i data-lucide="video" style="color:var(--video)"></i>';
    case 'audio': return '<i data-lucide="music" style="color:var(--doc)"></i>';
    case 'doc': return '<i data-lucide="file-text" style="color:var(--doc)"></i>';
    case 'code': return '<i data-lucide="file-code" style="color:var(--accent)"></i>';
    case 'archive': return '<i data-lucide="archive" style="color:var(--other)"></i>';
    default: return '<i data-lucide="file" style="color:var(--other)"></i>';
  }
}

// ---- Utils ----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Fetch & Parse ----
async function fetchDirectory(path) {
  const url = SERVER + path;
  const resp = await axios.get(url);
  return parseDirectoryListing(resp.data);
}

function parseDirectoryListing(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a');
  const items = [];

  links.forEach(a => {
    let href = a.getAttribute('href');
    let name = a.textContent.trim();

    if (!href || href === '../' || href === '.' || href === '..' || name === '..') return;
    if (href.startsWith('?') || href.startsWith('#')) return;

    const isDir = href.endsWith('/');
    name = decodeURIComponent(name).replace(/\/$/, '');

    let size = '';
    const parentText = a.parentElement ? a.parentElement.textContent : '';
    const sizeMatch = parentText.match(/(\d+[\.\d]*[KMGT]?)\s*$/i);
    if (sizeMatch) size = sizeMatch[1];

    items.push({ name, href: decodeURIComponent(href), isDir, size });
  });

  items.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return items;
}

// ---- Navigation ----
async function navigate(path) {
  currentPath = path;
  document.getElementById('searchInput').value = '';
  renderBreadcrumb();
  showLoading();

  try {
    allItems = await fetchDirectory(path);
    renderFiles(allItems);
  } catch (err) {
    showError(err.message);
  }
}

function renderBreadcrumb() {
  const pathInput = document.getElementById('pathInput');
  if (pathInput) pathInput.value = currentPath === '/' ? '' : currentPath;
}

function goBack() {
  let path = currentPath.replace(/\/$/, '');
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash > 0) {
    path = path.substring(0, lastSlash + 1);
  } else {
    path = '/';
  }
  navigate(path);
}

function navigateToInput() {
  let path = document.getElementById('pathInput').value.trim();
  if (!path) path = '/';
  if (!path.startsWith('/')) path = '/' + path;
  if (!path.endsWith('/')) path += '/';
  navigate(path);
}

// ---- Rendering ----
function renderFiles(items) {
  const content = document.getElementById('content');
  const info = document.getElementById('fileInfo');

  const dirs = items.filter(i => i.isDir).length;
  const files = items.length - dirs;
  info.textContent = `${dirs} folder${dirs !== 1 ? 's' : ''}, ${files} file${files !== 1 ? 's' : ''}`;

  if (items.length === 0) {
    content.innerHTML = `
      <div class="status">
        <i data-lucide="folder-open" style="width: 48px; height: 48px; margin-bottom: 16px; color: var(--text-dim);"></i>
        <div style="color:var(--text-dim)">This directory is empty</div>
      </div>`;
    if(window.lucide) window.lucide.createIcons();
    return;
  }

  let html = `<div class="file-list ${viewMode}" id="fileList">`;
  items.forEach(item => {
    const icon = getIcon(item.name, item.isDir);
    const onclick = item.isDir
      ? `navigate('${currentPath}${item.href}')`
      : `openFile('${item.name}', '${currentPath}${item.href}')`;

    html += `
      <div class="file-item ${item.isDir ? 'dir-item' : ''}" onclick="${onclick}">
        <div class="icon">${icon}</div>
        <div class="name">${escapeHtml(item.name)}</div>
        ${item.size ? `<div class="meta">${item.size}</div>` : ''}
      </div>`;
  });
  html += '</div>';
  content.innerHTML = html;
  if(window.lucide) window.lucide.createIcons();
}

function filterFiles() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allItems.filter(item => item.name.toLowerCase().includes(query));
  renderFiles(filtered);
}

function setView(mode) {
  viewMode = mode;
  document.getElementById('gridBtn').classList.toggle('active', mode === 'grid');
  document.getElementById('listBtn').classList.toggle('active', mode === 'list');
  const list = document.getElementById('fileList');
  if (list) list.className = `file-list ${mode}`;
}

function showLoading() {
  document.getElementById('content').innerHTML = `
    <div class="status">
      <div class="spinner"></div>
      <div>Loading directory...</div>
    </div>`;
}

function showError(msg) {
  document.getElementById('content').innerHTML = `
    <div class="status">
      <i data-lucide="alert-triangle" style="width: 48px; height: 48px; margin-bottom: 16px; color: var(--video);"></i>
      <div class="error">
        <p><strong>Failed to load directory</strong></p>
        <p style="margin-top:8px">${escapeHtml(msg)}</p>
        <p style="margin-top:16px; font-size:13px; color:var(--text-dim)">
          If you see a CORS error, serve this HTML from the same server<br>
          or configure the server to allow cross-origin requests.
        </p>
        <p style="margin-top:12px">
          <button onclick="navigate(currentPath)" style="background:var(--accent); color:#fff; border:none; padding:8px 20px; border-radius:6px; cursor:pointer; font-size:14px;">
            Retry
          </button>
        </p>
      </div>
    </div>`;
  document.getElementById('fileInfo').textContent = 'Error loading directory';
  if(window.lucide) window.lucide.createIcons();
}

// ---- File Preview Modal ----
function openFile(name, path) {
  const url = SERVER + path;
  currentFileUrl = url;
  const type = getFileType(name);
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  const title = document.getElementById('modalTitle');

  title.textContent = name;

  if (type === 'image') {
    body.innerHTML = `<img src="${url}" alt="${escapeHtml(name)}" onerror="this.outerHTML='<div class=\\'no-preview\\'>Failed to load image</div>'">`;
  } else if (type === 'video') {
    body.innerHTML = `
      <video controls autoplay>
        <source src="${url}" type="video/${getExt(name) === 'mkv' ? 'x-matroska' : getExt(name)}">
        Your browser does not support this video format.
      </video>`;
  } else if (type === 'audio') {
    body.innerHTML = `
      <div style="padding:40px; text-align:center;">
        <i data-lucide="music" style="width: 60px; height: 60px; margin-bottom: 20px; color: var(--doc);"></i>
        <audio controls autoplay src="${url}" style="width:100%; max-width:400px;">
          Your browser does not support audio playback.
        </audio>
      </div>`;
  } else if (getExt(name) === 'csv') {
    body.innerHTML = `<div class="no-preview"><div class="spinner"></div><p style="margin-top:12px">Loading CSV...</p></div>`;
    document.getElementById('pitchMapBtn').style.display = 'none';
    document.getElementById('csvTableBtn').style.display = 'none';
    currentCsvData = null;
    axios.get(url, { responseType: 'text', transformResponse: [d => d] })
      .then(resp => {
        currentCsvData = resp.data;
        body.innerHTML = renderCSVTable(resp.data);
        document.getElementById('pitchMapBtn').style.display = '';
      })
      .catch(() => {
        body.innerHTML = `<div class="no-preview">Failed to load CSV file</div>`;
      });
  } else if (['doc', 'code'].includes(type) && ['txt', 'log', 'json', 'xml', 'md', 'yaml', 'yml', 'py', 'js', 'html', 'css', 'sh', 'sql', 'java', 'cpp', 'c', 'go', 'rs'].includes(getExt(name))) {
    body.innerHTML = `<div class="no-preview"><div class="spinner"></div><p style="margin-top:12px">Loading text content...</p></div>`;
    axios.get(url)
      .then(resp => {
        body.innerHTML = `<pre style="background:var(--bg); padding:16px; border-radius:8px; overflow:auto; max-height:70vh; max-width:80vw; font-size:13px; line-height:1.5; white-space:pre-wrap; word-break:break-all;">${escapeHtml(typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2))}</pre>`;
      })
      .catch(() => {
        body.innerHTML = `<div class="no-preview">Failed to load file content</div>`;
      });
  } else if (getExt(name) === 'pdf') {
    body.innerHTML = `<iframe src="${url}" style="width:80vw; height:75vh; border:none; border-radius:8px;"></iframe>`;
  } else {
    body.innerHTML = `
      <div class="no-preview">
        <div class="icon">${getIcon(name, false)}</div>
        <p><strong>${escapeHtml(name)}</strong></p>
        <p style="margin-top:8px">No preview available for this file type</p>
        <button onclick="downloadFile()" class="primary-btn" style="margin-top:16px; display:inline-flex; align-items:center; gap:8px;">
          <i data-lucide="download" style="width:16px;height:16px;"></i> Download File
        </button>
      </div>`;
  }

  modal.classList.add('active');
  document.addEventListener('keydown', handleModalKey);
  if(window.lucide) window.lucide.createIcons();
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modal')) return;
  const modal = document.getElementById('modal');
  modal.classList.remove('active');

  const video = modal.querySelector('video');
  const audio = modal.querySelector('audio');
  if (video) video.pause();
  if (audio) audio.pause();

  document.getElementById('pitchMapBtn').style.display = 'none';
  document.getElementById('csvTableBtn').style.display = 'none';
  document.getElementById('downloadBtn').style.display = '';
  document.getElementById('reportBtn').style.display = 'none';
  currentCsvData = null;

  document.removeEventListener('keydown', handleModalKey);
}

function handleModalKey(e) {
  if (e.key === 'Escape') closeModal();
}

function downloadFile() {
  if (!currentFileUrl) return;
  const a = document.createElement('a');
  a.href = currentFileUrl;
  a.download = '';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---- CSV Upload ----
function handleCsvUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    currentCsvData = csvText;
    currentFileUrl = '';

    const modal = document.getElementById('modal');
    const body = document.getElementById('modalBody');
    const title = document.getElementById('modalTitle');

    title.textContent = file.name;

    // Hide download for local uploads
    document.getElementById('downloadBtn').style.display = 'none';

    // Always show pitch mapping for uploaded CSV
    document.getElementById('pitchMapBtn').style.display = 'none';
    document.getElementById('csvTableBtn').style.display = '';
    document.getElementById('reportBtn').style.display = '';
    body.innerHTML = renderPitchMapping(csvText);
    if (pitchBalls.length > 0) selectBall(0);

    modal.classList.add('active');
    document.addEventListener('keydown', handleModalKey);
    if (window.lucide) window.lucide.createIcons();
  };
  reader.readAsText(file);

  // Reset input so same file can be uploaded again
  event.target.value = '';
}

// ---- Bulk CSV Upload ----
let bulkCsvFiles = []; // { name, data }
let activeBulkIndex = 0;
let bulkMode = false;

function openBulkUploadModal() {
  bulkCsvFiles = [];
  bulkMode = true;

  const modal = document.getElementById('modal');
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');

  document.getElementById('downloadBtn').style.display = 'none';
  document.getElementById('pitchMapBtn').style.display = 'none';
  document.getElementById('csvTableBtn').style.display = 'none';

  title.textContent = 'Bulk CSV Upload';
  body.innerHTML = renderBulkUploadUI();

  modal.classList.add('active');
  document.addEventListener('keydown', handleModalKey);
  if (window.lucide) window.lucide.createIcons();
}

function renderBulkUploadUI() {
  let html = '<div style="width:100%; max-width:600px; margin:0 auto;">';

  // File list
  html += '<div style="margin-bottom:20px;">';
  if (bulkCsvFiles.length === 0) {
    html += '<div style="text-align:center; padding:40px 20px; background:var(--surface); border:2px dashed var(--border-solid); border-radius:12px; color:var(--text-dim);">';
    html += '<i data-lucide="file-plus" style="width:40px; height:40px; margin-bottom:12px; opacity:0.5;"></i>';
    html += '<p style="font-size:15px; font-weight:500;">No files added yet</p>';
    html += '<p style="font-size:13px; margin-top:4px;">Click "Add Files" to select CSV files</p>';
    html += '</div>';
  } else {
    // Select all checkbox
    const allChecked = bulkCsvFiles.every(f => f.checked);
    html += `<div style="display:flex; align-items:center; gap:8px; padding:10px 16px; background:var(--surface2); border:1px solid var(--border); border-radius:12px 12px 0 0; border-bottom:none;">
      <input type="checkbox" id="bulkSelectAll" ${allChecked ? 'checked' : ''} onchange="toggleBulkSelectAll(this.checked)" style="width:16px; height:16px; cursor:pointer; accent-color:var(--accent);">
      <label for="bulkSelectAll" style="font-size:13px; font-weight:600; color:var(--text-dim); cursor:pointer;">Select All</label>
      <span style="margin-left:auto; font-size:12px; color:var(--text-dim);">${bulkCsvFiles.filter(f => f.checked).length} of ${bulkCsvFiles.length} selected</span>
    </div>`;
    html += '<div style="background:var(--surface); border:1px solid var(--border); border-radius:0 0 12px 12px; overflow:hidden;">';
    bulkCsvFiles.forEach((file, i) => {
      html += `<div style="display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border);">
        <input type="checkbox" ${file.checked ? 'checked' : ''} onchange="toggleBulkFile(${i}, this.checked)" style="width:16px; height:16px; cursor:pointer; accent-color:var(--accent); flex-shrink:0;">
        <i data-lucide="file-text" style="width:18px; height:18px; color:var(--doc); flex-shrink:0;"></i>
        <span style="flex:1; font-size:14px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(file.name)}</span>
        <button onclick="removeBulkFile(${i})" style="background:none; border:none; cursor:pointer; color:var(--text-dim); padding:4px; border-radius:4px;" title="Remove">
          <i data-lucide="x" style="width:16px; height:16px;"></i>
        </button>
      </div>`;
    });
    html += '</div>';
  }
  html += '</div>';

  // Buttons
  html += '<div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">';
  html += `<button class="upload-csv-btn" onclick="document.getElementById('csvBulkAdd').click()" style="padding:10px 24px;">
    <i data-lucide="plus" style="width:16px; height:16px;"></i> Add Files
  </button>`;
  if (bulkCsvFiles.length > 0) {
    html += `<button class="upload-csv-btn" onclick="startBulkView()" style="padding:10px 24px; background:var(--accent); color:#fff; border-color:var(--accent);">
      <i data-lucide="play" style="width:16px; height:16px;"></i> Show Pitch Map
    </button>`;
    const checkedCount = bulkCsvFiles.filter(f => f.checked).length;
    html += `<button class="upload-csv-btn" onclick="generateBulkReport()" style="padding:10px 24px; ${checkedCount === 0 ? 'opacity:0.5; pointer-events:none;' : ''}" ${checkedCount === 0 ? 'disabled' : ''}>
      <i data-lucide="download" style="width:16px; height:16px;"></i> Generate Report (${checkedCount})
    </button>`;
  }
  html += '</div>';

  html += '</div>';
  return html;
}

function toggleBulkFile(index, checked) {
  bulkCsvFiles[index].checked = checked;
  const body = document.getElementById('modalBody');
  body.innerHTML = renderBulkUploadUI();
  if (window.lucide) window.lucide.createIcons();
}

function toggleBulkSelectAll(checked) {
  bulkCsvFiles.forEach(f => f.checked = checked);
  const body = document.getElementById('modalBody');
  body.innerHTML = renderBulkUploadUI();
  if (window.lucide) window.lucide.createIcons();
}

function generateBulkReport() {
  const selected = bulkCsvFiles.filter(f => f.checked);
  if (selected.length === 0) return;

  // CSV header
  const reportHeaders = [
    'Session File', 'Ball ID', 'Release Speed (km/h)', 'Speed (km/h)',
    'Line (Config)', 'Length (Config)', 'Config X', 'Config Y',
    'Line (Actual)', 'Length (Actual)', 'Actual X', 'Actual Y',
    'Pitch X (cm)', 'Pitch Z (cm)',
    'Pan Set', 'Pan Read', 'Pan Diff',
    'M-Tilt Set', 'M-Tilt Read', 'M-Tilt Diff',
    'L-Tilt Set', 'L-Tilt Read', 'L-Tilt Diff',
    'R-Tilt Set', 'R-Tilt Read', 'R-Tilt Diff',
    'L-RPM Set', 'L-RPM Read',
    'R-RPM Set', 'R-RPM Read'
  ];

  const reportRows = [reportHeaders.join(',')];

  selected.forEach(file => {
    const balls = parsePitchBalls(file.data);
    balls.forEach(ball => {
      const releaseSpd = parseFloat(ball.releaseSpeed);
      const pitchSpd = parseFloat(ball.speed);
      const cleanName = file.name.replace(/\.csv$/i, '');
      const row = [
        '"' + cleanName.replace(/"/g, '""') + '"',
        ball.ballId,
        !isNaN(releaseSpd) ? Math.round(releaseSpd) : '',
        !isNaN(pitchSpd) ? Math.round(pitchSpd) : '',
        !isNaN(ball.x) ? getLineLabel(ball.x) : '',
        !isNaN(ball.y) ? getLengthLabel(ball.y) : '',
        !isNaN(ball.x) ? ball.x.toFixed(1) : '',
        !isNaN(ball.y) ? ball.y.toFixed(1) : '',
        !isNaN(ball.actualX) ? getLineLabel(ball.actualX) : '',
        !isNaN(ball.actualY) ? getLengthLabel(ball.actualY) : '',
        !isNaN(ball.actualX) ? ball.actualX.toFixed(1) : '',
        !isNaN(ball.actualY) ? ball.actualY.toFixed(1) : '',
        !isNaN(ball.pitchXcm) ? ball.pitchXcm.toFixed(1) : '',
        !isNaN(ball.pitchZcm) ? ball.pitchZcm.toFixed(1) : '',
      ];

      // Pan, M-Tilt, L-Tilt, R-Tilt with diff; L-RPM, R-RPM without diff
      const REPORT_PARAMS = [
        { setCol: 'Pan (Set)', readCol: 'Pan (Read)', diff: true },
        { setCol: 'M-Tilt (Set)', readCol: 'M-Tilt (Read)', diff: true },
        { setCol: 'L-Tilt (Set)', readCol: 'L-Tilt (Read)', diff: true },
        { setCol: 'R-Tilt (Set)', readCol: 'R-Tilt (Read)', diff: true },
        { setCol: 'L-rpm (Set)', readCol: 'L-rpm (Read)', diff: false },
        { setCol: 'R-rpm (Set)', readCol: 'R-rpm (Read)', diff: false },
      ];

      REPORT_PARAMS.forEach(param => {
        const setIdx = pitchColIdx[param.setCol];
        const readIdx = pitchColIdx[param.readCol];
        const setVal = setIdx !== undefined ? (ball.row[setIdx] || '') : '';
        const readVal = readIdx !== undefined ? (ball.row[readIdx] || '') : '';
        row.push(setVal, readVal);
        if (param.diff) {
          const s = parseFloat(setVal), r = parseFloat(readVal);
          row.push(!isNaN(s) && !isNaN(r) ? (r - s).toFixed(0) : '');
        }
      });

      reportRows.push(row.join(','));
    });
  });

  // Download CSV
  const csvContent = reportRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pitching_validation_report.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function addBulkFiles(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  let loaded = 0;

  files.forEach(file => {
    // Skip duplicates
    if (bulkCsvFiles.some(f => f.name === file.name)) { loaded++; return; }

    const reader = new FileReader();
    reader.onload = function(e) {
      bulkCsvFiles.push({ name: file.name, data: e.target.result, checked: true });
      loaded++;
      if (loaded === files.length) {
        // Re-render the upload UI
        const body = document.getElementById('modalBody');
        body.innerHTML = renderBulkUploadUI();
        if (window.lucide) window.lucide.createIcons();
      }
    };
    reader.readAsText(file);
  });

  event.target.value = '';
}

function removeBulkFile(index) {
  bulkCsvFiles.splice(index, 1);
  const body = document.getElementById('modalBody');
  body.innerHTML = renderBulkUploadUI();
  if (window.lucide) window.lucide.createIcons();
}

function startBulkView() {
  if (bulkCsvFiles.length === 0) return;

  const title = document.getElementById('modalTitle');
  title.innerHTML = `<span id="bulkCsvTabs" style="display:flex; gap:6px; align-items:center; overflow-x:auto; max-width:100%; padding-bottom:4px;"></span>`;

  document.getElementById('reportBtn').style.display = '';

  const body = document.getElementById('modalBody');
  body.innerHTML = '<div id="bulkCsvContent" style="width:100%; align-self:stretch;"></div>';

  renderBulkTabs();
  selectBulkCsv(0);

  if (window.lucide) window.lucide.createIcons();
}

function renderBulkTabs() {
  const tabs = document.getElementById('bulkCsvTabs');
  if (!tabs) return;

  const checkedCount = bulkCsvFiles.filter(f => f.checked).length;
  let html = '';
  bulkCsvFiles.forEach((file, i) => {
    const shortName = file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name;
    html += `<div style="display:inline-flex; align-items:center; gap:4px;">
      <input type="checkbox" ${file.checked ? 'checked' : ''} onchange="toggleBulkFileCheck(${i}, this.checked); event.stopPropagation();" style="width:14px; height:14px; cursor:pointer; accent-color:var(--accent);">
      <button class="bulk-tab ${i === activeBulkIndex ? 'active' : ''}" onclick="selectBulkCsv(${i})" title="${escapeHtml(file.name)}">
        ${escapeHtml(shortName)}
      </button>
    </div>`;
  });
  tabs.innerHTML = html;

  // Update report button label
  const reportBtn = document.getElementById('reportBtn');
  if (reportBtn && bulkMode) {
    reportBtn.innerHTML = `<i data-lucide="file-down" style="width: 16px; height: 16px;"></i> Generate Report (${checkedCount})`;
    reportBtn.style.opacity = checkedCount > 0 ? '1' : '0.5';
    reportBtn.style.pointerEvents = checkedCount > 0 ? 'auto' : 'none';
    if (window.lucide) window.lucide.createIcons();
  }
}

function toggleBulkFileCheck(index, checked) {
  bulkCsvFiles[index].checked = checked;
  renderBulkTabs();
}

function selectBulkCsv(index) {
  activeBulkIndex = index;
  const file = bulkCsvFiles[index];
  if (!file) return;

  currentCsvData = file.data;
  currentFileUrl = '';

  renderBulkTabs();

  const content = document.getElementById('bulkCsvContent');
  content.innerHTML = renderPitchMapping(file.data);
  if (pitchBalls.length > 0) selectBall(0);
}

// ---- Init ----
navigate(BASE_PATH);
