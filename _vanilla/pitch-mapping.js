function showCopyToast(msg) {
  const existing = document.querySelector('.copy-toast-global');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'copy-toast-global';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

function copyCellValue(el, value) {
  navigator.clipboard.writeText(value).then(() => {
    showCopyToast('Video URL copied successfully!');
  });
}

// ---- CSV Parser & Table Renderer ----
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = text.split('\n');

  for (const line of lines) {
    if (!line.trim() && !inQuotes) continue;
    current += (current ? '\n' : '') + line;
    const quoteCount = (current.match(/"/g) || []).length;
    inQuotes = quoteCount % 2 !== 0;
    if (!inQuotes) {
      const row = [];
      let cell = '';
      let q = false;
      for (let i = 0; i < current.length; i++) {
        const ch = current[i];
        if (ch === '"') {
          if (q && current[i + 1] === '"') { cell += '"'; i++; }
          else q = !q;
        } else if (ch === ',' && !q) {
          row.push(cell.trim());
          cell = '';
        } else {
          cell += ch;
        }
      }
      row.push(cell.trim());
      rows.push(row);
      current = '';
    }
  }
  return rows;
}

function renderCSVTable(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return '<div class="no-preview">Empty CSV file</div>';

  const headers = rows[0];
  const dataRows = rows.slice(1);

  let html = '<div class="csv-table-wrap"><table class="csv-table"><thead><tr>';
  html += '<th class="csv-row-num">#</th>';
  headers.forEach(h => { html += `<th>${escapeHtml(h)}</th>`; });
  html += '</tr></thead><tbody>';

  dataRows.forEach((row, i) => {
    html += `<tr><td class="csv-row-num">${i + 1}</td>`;
    headers.forEach((_, ci) => {
      const val = row[ci] !== undefined ? row[ci] : '';
      const isUrl = /^https?:\/\//i.test(val);
      if (isUrl) {
        html += `<td title="${escapeHtml(val)}" class="csv-url-cell" onclick="copyCellValue(this, '${escapeHtml(val).replace(/'/g, "\\'")}')"><span class="csv-url-text">${escapeHtml(val)}</span><span class="csv-url-icon"><i data-lucide="copy" style="width:12px;height:12px;"></i></span></td>`;
      } else {
        html += `<td title="${escapeHtml(val)}">${escapeHtml(val)}</td>`;
      }
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
}

// ---- Pitch Mapping ----
const PITCH_PARAMS = [
  { label: 'Pan', setCol: 'Pan (Set)', readCol: 'Pan (Read)' },
  { label: 'M-Tilt', setCol: 'M-Tilt (Set)', readCol: 'M-Tilt (Read)' },
  { label: 'L-Tilt', setCol: 'L-Tilt (Set)', readCol: 'L-Tilt (Read)' },
  { label: 'R-Tilt', setCol: 'R-Tilt (Set)', readCol: 'R-Tilt (Read)' },
  { label: 'L-RPM', setCol: 'L-rpm (Set)', readCol: 'L-rpm (Read)' },
  { label: 'R-RPM', setCol: 'R-rpm (Set)', readCol: 'R-rpm (Read)' },
];

const LENGTH_BANDS = [
  { id: 'fulltoss',     label: 'Full Toss',       height: 8,  color: '#F79894' },
  { id: 'yorkers',      label: 'Yorkers',         height: 8,  color: '#FBE68C' },
  { id: 'halfvolley',   label: 'Half Volley',     height: 16, color: '#81C784' },
  { id: 'full',         label: 'Full',            height: 16, color: '#F79894' },
  { id: 'length',       label: 'Length',          height: 16, color: '#CF86DC' },
  { id: 'backoflength', label: 'Back of Length',  height: 16, color: '#8486D8' },
  { id: 'shorts',       label: 'Shorts',          height: 20, color: '#555' },
];


function getLineLabel(x) {
  const pct = x / 3;
  if (pct <= 33.33) return 'Outside Off';
  if (pct <= 66.66) return 'Inline';
  return 'Outside Leg';
}

function getLengthLabel(y) {
  if (y < 8) return 'Full Toss';
  if (y <= 16) return 'Yorkers';
  if (y <= 32) return 'Half Volley';
  if (y <= 48) return 'Full';
  if (y <= 64) return 'Length';
  if (y <= 80) return 'Back of Length';
  return 'Shorts';
}

let pitchBalls = [];
let pitchColIdx = {};

function parsePitchBalls(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  pitchColIdx = {};
  headers.forEach((h, i) => { pitchColIdx[h.trim()] = i; });

  const ballIdCol = pitchColIdx['Ball ID'];
  const xCol = pitchColIdx['x'];
  const yCol = pitchColIdx['y'];
  const speedCol = pitchColIdx['speed'];
  const releaseSpeedCol = pitchColIdx['Release speed'];
  const videoCol = pitchColIdx['Video URL'];
  const pitchXCol = pitchColIdx['Pitching point x'];
  const pitchZCol = pitchColIdx['Pitching point z'];

  return dataRows.map((row, ri) => {
    const ballId = ballIdCol !== undefined ? row[ballIdCol] : (ri + 1);
    const x = xCol !== undefined ? parseFloat(row[xCol]) : NaN;
    const y = yCol !== undefined ? parseFloat(row[yCol]) : NaN;
    const spd = speedCol !== undefined ? row[speedCol] : '-';
    const releaseSpeed = releaseSpeedCol !== undefined ? row[releaseSpeedCol] : '-';
    const videoUrl = videoCol !== undefined ? row[videoCol] : '';

    // Actual pitching point (cm) -> convert to pitch coordinates
    const pitchXcm = pitchXCol !== undefined ? parseFloat(row[pitchXCol]) : NaN;
    const pitchZcm = pitchZCol !== undefined ? parseFloat(row[pitchZCol]) : NaN;
    // X: pitch width = 300cm (3m), center = 0cm → 150. Range: -150 to +150 → 0 to 300
    const actualX = !isNaN(pitchXcm) ? pitchXcm + 150 : NaN;
    // Y: pitch length = 1000cm (10m), pitchable area = Y 0-80
    // Zones: Full Toss 1m(0-1), Yorkers 1m(1-2), Half Volley 2m(2-4), Full 2m(4-6), Length 2m(6-8), Back of Length 2m(8-10)
    const actualY = !isNaN(pitchZcm) ? pitchZcm / 1000 * 80 : NaN;

    return { ballId, x, y, actualX, actualY, pitchXcm, pitchZcm, speed: spd, releaseSpeed, videoUrl, row, index: ri };
  });
}

function renderPitchMapping(csvText) {
  pitchBalls = parsePitchBalls(csvText);
  if (pitchBalls.length === 0) return '<div class="no-preview">No data rows in CSV</div>';

  let html = '<div class="pitch-mapping">';

  // === LEFT: Visual Pitch ===
  html += '<div class="pitch-visual-wrap">';
  html += `<div class="pitch-line-labels">
    <span>Outside Off</span><span>Inline</span><span>Outside Leg</span>
  </div>`;
  html += '<div class="pitch-canvas">';
  html += `<div class="pitch-lane-divider" style="left:33.33%"></div>`;
  html += `<div class="pitch-lane-divider" style="left:66.66%"></div>`;

  let yOffset = 0;
  LENGTH_BANDS.forEach(band => {
    html += `<div class="pitch-length-band" style="position:absolute; left:0; right:0; top:${yOffset}%; height:${band.height}%; background:${band.color}; opacity:0.7;">
      <span>${band.label}</span>
    </div>`;
    yOffset += band.height;
  });

  html += `<div class="pitch-stumps" style="position:absolute; top:2%; left:50%; transform:translateX(-50%); z-index:3;">
    <div class="stump"></div><div class="stump"></div><div class="stump"></div>
  </div>`;

  pitchBalls.forEach(ball => {
    // Red dot = configured (set) position — hidden by default, shown on select
    if (!isNaN(ball.x) && !isNaN(ball.y)) {
      const leftPct = ball.x / 3;
      const topPct = ball.y;
      html += `<div class="pitch-ball-dot config-ball" id="pitch-dot-${ball.index}" onclick="selectBall(${ball.index})" style="left:${leftPct}%; top:${topPct}%; display:none;">
        <span class="ball-num">${escapeHtml(String(ball.ballId))}</span>
        <div class="ball-tooltip">Ball #${escapeHtml(String(ball.ballId))} (Config)</div>
      </div>`;
    }
    // Blue dot = actual pitching point — hidden by default, shown on select
    if (!isNaN(ball.actualX) && !isNaN(ball.actualY)) {
      const leftPct = ball.actualX / 3;
      const topPct = ball.actualY;
      html += `<div class="pitch-ball-dot actual-ball" id="pitch-actual-${ball.index}" onclick="selectBall(${ball.index})" style="left:${leftPct}%; top:${topPct}%; display:none;">
        <span class="ball-num">${escapeHtml(String(ball.ballId))}</span>
        <div class="ball-tooltip">Ball #${escapeHtml(String(ball.ballId))} (Actual)</div>
      </div>`;
    }
  });

  // Config "C" dot for All mode (uses first ball's config position since config is common)
  if (pitchBalls.length > 0 && !isNaN(pitchBalls[0].x) && !isNaN(pitchBalls[0].y)) {
    const leftPct = pitchBalls[0].x / 3;
    const topPct = pitchBalls[0].y;
    html += `<div class="pitch-ball-dot config-ball" id="pitch-dot-all" style="left:${leftPct}%; top:${topPct}%; display:none;">
      <span class="ball-num">C</span>
      <div class="ball-tooltip">Config (Set)</div>
    </div>`;
  }

  // Legend
  html += `<div style="position:absolute; bottom:8px; left:8px; z-index:6; display:flex; gap:12px; background:var(--surface); border:1px solid var(--border); padding:8px 12px; border-radius:10px; font-size:11px; font-weight:600; box-shadow:var(--shadow-sm);">
    <span style="display:flex; align-items:center; gap:6px; color:var(--text);"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Config</span>
    <span style="display:flex; align-items:center; gap:6px; color:var(--text);"><span style="width:10px;height:10px;border-radius:50%;background:#3b82f6;display:inline-block;"></span> Actual</span>
  </div>`;

  html += '</div></div>';

  // === RIGHT: Ball selector + detail ===
  html += '<div class="pitch-detail-panel">';

  html += '<div class="ball-selector">';
  html += `<button class="ball-selector-btn" id="ball-btn-all" onclick="selectAllBalls()">
    <span class="dot" style="background:#3b82f6; border:none; box-shadow:0 1px 2px rgba(0,0,0,0.1);"></span>
    All
  </button>`;
  pitchBalls.forEach((ball, i) => {
    const releaseSpd = parseFloat(ball.releaseSpeed) * 1.05;
    const spdText = !isNaN(releaseSpd) ? ` (${Math.round(releaseSpd)} km/h)` : '';
    html += `<button class="ball-selector-btn ${i === 0 ? 'active' : ''}" id="ball-btn-${i}" onclick="selectBall(${i})">
      <span class="dot" style="background:#ef4444; border:none; box-shadow:0 1px 2px rgba(0,0,0,0.1);"></span>
      Ball ${escapeHtml(String(ball.ballId))}${spdText}
    </button>`;
  });
  html += '</div>';

  html += '<div id="ball-detail"></div>';
  html += '</div>';

  html += '</div>';
  return html;
}

function selectBall(index) {
  const ball = pitchBalls[index];
  if (!ball) return;

  // Update active button - use IDs to avoid index mismatch with "All" button
  document.querySelectorAll('.ball-selector-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById('ball-btn-' + index);
  if (activeBtn) activeBtn.classList.add('active');

  // Show only the selected ball's dots, hide others
  document.querySelectorAll('.pitch-ball-dot').forEach(dot => {
    dot.style.display = 'none';
    dot.classList.remove('selected');
  });
  const configDot = document.getElementById('pitch-dot-' + index);
  const actualDot = document.getElementById('pitch-actual-' + index);
  if (configDot) { configDot.style.display = ''; configDot.classList.add('selected'); }
  if (actualDot) { actualDot.style.display = ''; actualDot.classList.add('selected'); }

  const releaseSpd = parseFloat(ball.releaseSpeed) * 1.05;
  const spdVal = !isNaN(releaseSpd) ? Math.round(releaseSpd) : '-';
  const pitchSpd = parseFloat(ball.speed);
  const pitchSpdVal = !isNaN(pitchSpd) ? Math.round(pitchSpd) : '-';

  let html = '';

  // Pitch info - Config (Red) — Speed, Line, Length, X, Y
  html += '<div class="pitch-detail-section">';
  html += '<h4 style="display:flex; align-items:center; gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Config (Set)</h4>';
  html += '<div class="pitch-info-grid">';
  html += `<div class="pitch-info-card"><div class="label">Speed</div><div class="value speed-val">${pitchSpdVal}<span style="font-size:11px; font-weight:400;"> km/h</span></div></div>`;
  if (!isNaN(ball.x)) {
    html += `<div class="pitch-info-card"><div class="label">Line</div><div class="value line-val" style="font-size:14px;">${getLineLabel(ball.x)}</div></div>`;
    html += `<div class="pitch-info-card"><div class="label">Length</div><div class="value length-val" style="font-size:14px;">${getLengthLabel(ball.y)}</div></div>`;
    html += `<div class="pitch-info-card"><div class="label">X</div><div class="value">${ball.x.toFixed(1)}</div></div>`;
    html += `<div class="pitch-info-card"><div class="label">Y</div><div class="value">${ball.y.toFixed(1)}</div></div>`;
  }
  html += '</div></div>';

  // Pitch info - Actual (Blue) — Release Speed, Line, Length, Pitch X (cm), Pitch Z (cm)
  html += '<div class="pitch-detail-section">';
  html += '<h4 style="display:flex; align-items:center; gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:#3b82f6;display:inline-block;"></span> Actual Pitching Point</h4>';
  html += '<div class="pitch-info-grid">';
  html += `<div class="pitch-info-card"><div class="label">Release Speed</div><div class="value">${spdVal}<span style="font-size:11px; font-weight:500; color:var(--text-dim);"> km/h</span></div></div>`;
  if (!isNaN(ball.actualX)) {
    html += `<div class="pitch-info-card"><div class="label">Line</div><div class="value" style="font-size:15px;">${getLineLabel(ball.actualX)}</div></div>`;
    html += `<div class="pitch-info-card"><div class="label">Length</div><div class="value" style="font-size:15px;">${getLengthLabel(ball.actualY)}</div></div>`;
    html += `<div class="pitch-info-card"><div class="label">X</div><div class="value">${ball.actualX.toFixed(1)} <span style="font-size:10px; font-weight:500; color:var(--text-dim);">(${ball.pitchXcm.toFixed(1)} cm)</span></div></div>`;
    html += `<div class="pitch-info-card"><div class="label">Y</div><div class="value">${ball.actualY.toFixed(1)} <span style="font-size:10px; font-weight:500; color:var(--text-dim);">(${ball.pitchZcm.toFixed(1)} cm)</span></div></div>`;
  } else {
    html += '<div class="pitch-info-card"><div class="label">Data</div><div class="value" style="font-size:14px; color:var(--text-dim);">-</div></div>';
  }
  html += '</div></div>';

  // Pan / Tilt / RPM
  html += '<div class="pitch-detail-section" style="margin-top: 24px;">';
  html += '<div class="param-table-wrap">';
  html += '<table class="param-table">';
  html += '<thead><tr><th>Pan / Tilt / RPM</th><th>Set</th><th>Read</th><th>Difference</th></tr></thead><tbody>';
  
  const isRPM = (label) => label === 'L-RPM' || label === 'R-RPM';

  PITCH_PARAMS.forEach(param => {
    const setIdx = pitchColIdx[param.setCol];
    const readIdx = pitchColIdx[param.readCol];
    if (setIdx === undefined && readIdx === undefined) return;
    const setVal = setIdx !== undefined ? (ball.row[setIdx] || '-') : '-';
    const readVal = readIdx !== undefined ? (ball.row[readIdx] || '-') : '-';
    const rpm = isRPM(param.label);
    const setNum = parseFloat(setVal);
    const readNum = parseFloat(readVal);
    const hasDiff = !rpm && !isNaN(setNum) && !isNaN(readNum);
    const diff = hasDiff ? Math.abs(setNum - readNum) : 0;
    const diffClass = hasDiff ? (diff === 0 ? 'match' : diff <= 50 ? 'off' : 'bad') : '';
    const diffLabel = hasDiff ? (diff === 0 ? 'Match' : (setNum > readNum ? '-' : '+') + diff.toFixed(0)) : '-';

    const readDisplay = rpm
      ? `<span style="color:var(--text-dim); font-style:italic;" title="RPM read values are not accurate">${escapeHtml(readVal)} <span style="font-size:10px; color:#ef4444;">*</span></span>`
      : escapeHtml(readVal);

    html += `<tr>
      <td class="param-name">${escapeHtml(param.label)}</td>
      <td>${escapeHtml(setVal)}</td>
      <td>${readDisplay}</td>
      <td>${hasDiff ? `<span class="pitch-diff badge ${diffClass}">${diffLabel}</span>` : '-'}</td>
    </tr>`;
  });
  
  html += '</tbody></table></div></div>';

  // Video
  html += '<div class="pitch-detail-section">';
  html += '<h4>Video</h4>';
  if (ball.videoUrl && ball.videoUrl.trim()) {
    const videoSrc = escapeHtml(ball.videoUrl.trim());
    html += `<div class="pitch-video-wrap">
      <video controls src="${videoSrc}" style="width:100%; max-height:280px;"></video>
    </div>`;
    html += `<div style="margin-top:8px; display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:8px 12px; cursor:pointer;" onclick="navigator.clipboard.writeText('${videoSrc.replace(/'/g, "\\'")}'); showCopyToast('Video URL copied successfully!');" title="Click to copy video URL">
      <i data-lucide="link" style="width:14px; height:14px; color:var(--text-dim); flex-shrink:0;"></i>
      <span style="flex:1; font-size:12px; color:var(--text-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${videoSrc}</span>
      <span style="font-size:11px; font-weight:600; color:var(--accent); flex-shrink:0;">Click to copy</span>
    </div>`;
  } else {
    html += '<div class="pitch-no-video">No video available for this ball</div>';
  }
  html += '</div>';

  document.getElementById('ball-detail').innerHTML = html;
}

function selectAllBalls() {
  // Update active button
  document.querySelectorAll('.ball-selector-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('ball-btn-all').classList.add('active');

  // Show one red config dot (first ball, since config is common) + all blue actual dots
  document.querySelectorAll('.pitch-ball-dot').forEach(dot => {
    dot.style.display = 'none';
    dot.classList.remove('selected');
  });

  // Show config "C" dot
  const configDot = document.getElementById('pitch-dot-all');
  if (configDot) { configDot.style.display = ''; configDot.classList.add('selected'); }

  // Show all actual (blue) dots
  pitchBalls.forEach(ball => {
    const actualDot = document.getElementById('pitch-actual-' + ball.index);
    if (actualDot) { actualDot.style.display = ''; }
  });

  // Show summary in detail panel
  const detail = document.getElementById('ball-detail');
  let html = '<div class="pitch-detail-section">';
  html += '<h4>All Balls Overview</h4>';
  html += '<div style="font-size:13px; color:var(--text-dim); margin-bottom:12px;">Showing all ' + pitchBalls.length + ' actual pitching points (blue) with config position (red)</div>';

  // Summary table
  html += '<div class="param-table-wrap"><table class="param-table">';
  html += '<thead><tr><th>Ball</th><th>Release Speed<br><span style="font-size:9px;font-weight:400;opacity:0.7;">Actual</span></th><th>Speed<br><span style="font-size:9px;font-weight:400;opacity:0.7;">Config</span></th>';
  PITCH_PARAMS.forEach(p => { html += `<th>${escapeHtml(p.label)}<br><span style="font-size:9px;font-weight:400;opacity:0.7;">Set / Read</span></th>`; });
  html += '</tr></thead><tbody>';
  pitchBalls.forEach(ball => {
    const releaseSpd = parseFloat(ball.releaseSpeed) * 1.05;
    const relSpdVal = !isNaN(releaseSpd) ? Math.round(releaseSpd) + ' km/h' : '-';
    const pitchSpd = parseFloat(ball.speed);
    const spdVal = !isNaN(pitchSpd) ? Math.round(pitchSpd) + ' km/h' : '-';
    html += `<tr><td class="param-name">Ball ${escapeHtml(String(ball.ballId))}</td><td>${relSpdVal}</td><td>${spdVal}</td>`;
    PITCH_PARAMS.forEach(param => {
      const setIdx = pitchColIdx[param.setCol];
      const readIdx = pitchColIdx[param.readCol];
      const setVal = setIdx !== undefined ? (ball.row[setIdx] || '-') : '-';
      const readVal = readIdx !== undefined ? (ball.row[readIdx] || '-') : '-';
      html += `<td>${escapeHtml(setVal)} / ${escapeHtml(readVal)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';

  detail.innerHTML = html;
}

// ---- Session Report Generator ----
function configXtoCm(x) { return x - 150; }
function configYtoCm(y) { return y / 100 * 1000; }

const DIFF_PARAMS = [
  { key: 'pan', setCol: 'Pan (Set)', readCol: 'Pan (Read)' },
  { key: 'mTilt', setCol: 'M-Tilt (Set)', readCol: 'M-Tilt (Read)' },
  { key: 'lTilt', setCol: 'L-Tilt (Set)', readCol: 'L-Tilt (Read)' },
  { key: 'rTilt', setCol: 'R-Tilt (Set)', readCol: 'R-Tilt (Read)' },
];

function parseFileNameMeta(fileName) {
  // Pattern: Lane2_2026-03-15_220944_stats.csv
  const laneMatch = fileName.match(/Lane(\d+)/i);
  const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
  return {
    lane: laneMatch ? laneMatch[1] : '',
    date: dateMatch ? dateMatch[1] : '',
  };
}

function processSessionBalls(csvData, sessionName) {
  const balls = parsePitchBalls(csvData);
  const meta = parseFileNameMeta(sessionName);

  let totalReleaseSpd = 0, countReleaseSpd = 0;
  let totalConfigSpd = 0, countConfigSpd = 0;
  let totalConfigXcm = 0, totalConfigYcm = 0, countConfig = 0;
  let totalActualXcm = 0, totalActualZcm = 0, countActual = 0;
  let sessionId = '';

  balls.forEach(ball => {
    const relSpd = parseFloat(ball.releaseSpeed);
    const cfgSpd = parseFloat(ball.speed);
    const cfgXcm = !isNaN(ball.x) ? configXtoCm(ball.x) : NaN;
    const cfgYcm = !isNaN(ball.y) ? configYtoCm(ball.y) : NaN;
    const actXcm = !isNaN(ball.pitchXcm) ? ball.pitchXcm : NaN;
    const actZcm = !isNaN(ball.pitchZcm) ? ball.pitchZcm : NaN;

    if (!isNaN(relSpd)) { totalReleaseSpd += relSpd; countReleaseSpd++; }
    if (!isNaN(cfgSpd)) { totalConfigSpd += cfgSpd; countConfigSpd++; }
    if (!isNaN(cfgXcm)) { totalConfigXcm += cfgXcm; totalConfigYcm += cfgYcm; countConfig++; }
    if (!isNaN(actXcm)) { totalActualXcm += actXcm; totalActualZcm += actZcm; countActual++; }

    if (!sessionId) {
      const sessionIdCol = pitchColIdx['Session ID'];
      sessionId = sessionIdCol !== undefined ? ball.row[sessionIdCol] : '';
    }
  });

  const avgRelSpdRaw = countReleaseSpd > 0 ? totalReleaseSpd / countReleaseSpd : NaN;
  const avgRelSpd = !isNaN(avgRelSpdRaw) ? avgRelSpdRaw * 1.05 : NaN;
  const avgCfgSpd = countConfigSpd > 0 ? totalConfigSpd / countConfigSpd : NaN;
  const avgCfgX = countConfig > 0 ? totalConfigXcm / countConfig : NaN;
  const avgCfgY = countConfig > 0 ? totalConfigYcm / countConfig : NaN;
  const avgActX = countActual > 0 ? totalActualXcm / countActual : NaN;
  const avgActZ = countActual > 0 ? totalActualZcm / countActual : NaN;

  const spdDiff = !isNaN(avgRelSpd) && !isNaN(avgCfgSpd) ? avgRelSpd - avgCfgSpd : NaN;
  const spdErrPct = !isNaN(spdDiff) && avgCfgSpd !== 0 ? Math.abs(spdDiff) / avgCfgSpd * 100 : NaN;
  const xDiff = !isNaN(avgActX) && !isNaN(avgCfgX) ? avgActX - avgCfgX : NaN;
  const xErrPct = !isNaN(xDiff) ? Math.abs(xDiff) / 300 * 100 : NaN;
  const yDiff = !isNaN(avgActZ) && !isNaN(avgCfgY) ? avgActZ - avgCfgY : NaN;
  const yErrPct = !isNaN(yDiff) ? Math.abs(yDiff) / 1000 * 100 : NaN;

  const f = (v) => !isNaN(v) ? v.toFixed(1) : '';
  const r = (v) => !isNaN(v) ? Math.round(v) : '';

  return [[
    meta.lane,
    meta.date,
    sessionId ? '"' + sessionId.replace(/"/g, '""') + '"' : '',
    balls.length,
    // Speed
    r(avgCfgSpd), r(avgRelSpd), r(spdDiff), r(spdErrPct),
    // X
    f(avgCfgX), f(avgActX), f(xDiff), f(xErrPct),
    // Y
    f(avgCfgY), f(avgActZ), f(yDiff), f(yErrPct),
  ]];
}

function generateSessionReport() {
  const headers = [
    'Lane Number', 'Session Date', 'Session ID', 'Balls Played',
    'User Selected Speed (km/h)', 'Machine Released Speed (km/h)', 'Speed Variance (km/h)', 'Speed Accuracy Loss (%)',
    'User Selected X (cm)', 'Machine Bowled X (cm)', 'X Variance (cm)', 'X Accuracy Loss (%)',
    'User Selected Y (cm)', 'Machine Bowled Y (cm)', 'Y Variance (cm)', 'Y Accuracy Loss (%)'
  ];

  const rows = [headers.join(',')];

  // Bulk mode: process checked files
  if (typeof bulkMode !== 'undefined' && bulkMode && typeof bulkCsvFiles !== 'undefined' && bulkCsvFiles.length > 0) {
    const selected = bulkCsvFiles.filter(f => f.checked);
    if (selected.length === 0) return;
    selected.forEach(file => {
      const sessionRows = processSessionBalls(file.data, file.name);
      sessionRows.forEach(r => rows.push(r.join(',')));
    });
  } else {
    // Single mode
    if (!currentCsvData) return;
    const title = document.getElementById('modalTitle');
    const fileName = title ? title.textContent : 'session';
    const sessionRows = processSessionBalls(currentCsvData, fileName);
    sessionRows.forEach(r => rows.push(r.join(',')));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pitching_validation_report.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function showPitchMapping() {
  if (!currentCsvData) return;
  const body = document.getElementById('modalBody');
  body.innerHTML = renderPitchMapping(currentCsvData);
  if (pitchBalls.length > 0) selectBall(0);
  document.getElementById('pitchMapBtn').style.display = 'none';
  document.getElementById('csvTableBtn').style.display = '';
  document.getElementById('reportBtn').style.display = '';
}

function showCSVTable() {
  if (!currentCsvData) return;
  const body = document.getElementById('modalBody');
  body.innerHTML = renderCSVTable(currentCsvData);
  document.getElementById('pitchMapBtn').style.display = '';
  document.getElementById('csvTableBtn').style.display = 'none';
  document.getElementById('reportBtn').style.display = 'none';
}
