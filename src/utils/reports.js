import { parsePitchBalls, getLineLabel, getLengthLabel, configXtoCm, configYtoCm, parseFileNameMeta } from './pitch';

export function processSessionBalls(csvData, sessionName) {
  const { balls, colIdx } = parsePitchBalls(csvData);
  const meta = parseFileNameMeta(sessionName);

  let totalReleaseSpd = 0,
    countReleaseSpd = 0;
  let totalConfigSpd = 0,
    countConfigSpd = 0;
  let totalConfigXcm = 0,
    totalConfigYcm = 0,
    countConfig = 0;
  let totalActualXcm = 0,
    totalActualZcm = 0,
    countActual = 0;
  let sessionId = '';

  balls.forEach((ball) => {
    const relSpd = parseFloat(ball.releaseSpeed);
    const cfgSpd = parseFloat(ball.speed);
    const cfgXcm = !isNaN(ball.x) ? configXtoCm(ball.x) : NaN;
    const cfgYcm = !isNaN(ball.y) ? configYtoCm(ball.y) : NaN;
    const actXcm = !isNaN(ball.pitchXcm) ? ball.pitchXcm : NaN;
    const actZcm = !isNaN(ball.pitchZcm) ? ball.pitchZcm : NaN;

    if (!isNaN(relSpd)) {
      totalReleaseSpd += relSpd;
      countReleaseSpd++;
    }
    if (!isNaN(cfgSpd)) {
      totalConfigSpd += cfgSpd;
      countConfigSpd++;
    }
    if (!isNaN(cfgXcm)) {
      totalConfigXcm += cfgXcm;
      totalConfigYcm += cfgYcm;
      countConfig++;
    }
    if (!isNaN(actXcm)) {
      totalActualXcm += actXcm;
      totalActualZcm += actZcm;
      countActual++;
    }

    if (!sessionId) {
      const sessionIdCol = colIdx['Session ID'];
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
  const spdErrPct = !isNaN(spdDiff) && avgCfgSpd !== 0 ? (Math.abs(spdDiff) / avgCfgSpd) * 100 : NaN;
  const xDiff = !isNaN(avgActX) && !isNaN(avgCfgX) ? avgActX - avgCfgX : NaN;
  const xErrPct = !isNaN(xDiff) ? (Math.abs(xDiff) / 300) * 100 : NaN;
  const yDiff = !isNaN(avgActZ) && !isNaN(avgCfgY) ? avgActZ - avgCfgY : NaN;
  const yErrPct = !isNaN(yDiff) ? (Math.abs(yDiff) / 1000) * 100 : NaN;

  const f = (v) => (!isNaN(v) ? v.toFixed(1) : '');
  const r = (v) => (!isNaN(v) ? Math.round(v) : '');

  return [
    [
      meta.lane,
      meta.date,
      sessionId ? '"' + sessionId.replace(/"/g, '""') + '"' : '',
      balls.length,
      r(avgCfgSpd),
      r(avgRelSpd),
      r(spdDiff),
      r(spdErrPct),
      f(avgCfgX),
      f(avgActX),
      f(xDiff),
      f(xErrPct),
      f(avgCfgY),
      f(avgActZ),
      f(yDiff),
      f(yErrPct),
    ],
  ];
}

export function generateSessionReportCSV(bulkMode, bulkCsvFiles, currentCsvData, currentFileName) {
  const headers = [
    'Lane Number',
    'Session Date',
    'Session ID',
    'Balls Played',
    'User Selected Speed (km/h)',
    'Machine Released Speed (km/h)',
    'Speed Variance (km/h)',
    'Speed Accuracy Loss (%)',
    'User Selected X (cm)',
    'Machine Bowled X (cm)',
    'X Variance (cm)',
    'X Accuracy Loss (%)',
    'User Selected Y (cm)',
    'Machine Bowled Y (cm)',
    'Y Variance (cm)',
    'Y Accuracy Loss (%)',
  ];

  const rows = [headers.join(',')];

  if (bulkMode && bulkCsvFiles.length > 0) {
    const selected = bulkCsvFiles.filter((f) => f.checked);
    if (selected.length === 0) return null;
    selected.forEach((file) => {
      const sessionRows = processSessionBalls(file.data, file.name);
      sessionRows.forEach((r) => rows.push(r.join(',')));
    });
  } else {
    if (!currentCsvData) return null;
    const sessionRows = processSessionBalls(currentCsvData, currentFileName);
    sessionRows.forEach((r) => rows.push(r.join(',')));
  }

  return rows.join('\n');
}

export function generateBulkReportCSV(bulkCsvFiles) {
  const selected = bulkCsvFiles.filter((f) => f.checked);
  if (selected.length === 0) return null;

  const reportHeaders = [
    'Session File',
    'Ball ID',
    'Release Speed (km/h)',
    'Speed (km/h)',
    'Line (Config)',
    'Length (Config)',
    'Config X',
    'Config Y',
    'Line (Actual)',
    'Length (Actual)',
    'Actual X',
    'Actual Y',
    'Pitch X (cm)',
    'Pitch Z (cm)',
    'Pan Set',
    'Pan Read',
    'Pan Diff',
    'M-Tilt Set',
    'M-Tilt Read',
    'M-Tilt Diff',
    'L-Tilt Set',
    'L-Tilt Read',
    'L-Tilt Diff',
    'R-Tilt Set',
    'R-Tilt Read',
    'R-Tilt Diff',
    'L-RPM Set',
    'L-RPM Read',
    'R-RPM Set',
    'R-RPM Read',
  ];

  const reportRows = [reportHeaders.join(',')];

  const REPORT_PARAMS = [
    { setCol: 'Pan (Set)', readCol: 'Pan (Read)', diff: true },
    { setCol: 'M-Tilt (Set)', readCol: 'M-Tilt (Read)', diff: true },
    { setCol: 'L-Tilt (Set)', readCol: 'L-Tilt (Read)', diff: true },
    { setCol: 'R-Tilt (Set)', readCol: 'R-Tilt (Read)', diff: true },
    { setCol: 'L-rpm (Set)', readCol: 'L-rpm (Read)', diff: false },
    { setCol: 'R-rpm (Set)', readCol: 'R-rpm (Read)', diff: false },
  ];

  selected.forEach((file) => {
    const { balls, colIdx } = parsePitchBalls(file.data);
    balls.forEach((ball) => {
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

      REPORT_PARAMS.forEach((param) => {
        const setIdx = colIdx[param.setCol];
        const readIdx = colIdx[param.readCol];
        const setVal = setIdx !== undefined ? ball.row[setIdx] || '' : '';
        const readVal = readIdx !== undefined ? ball.row[readIdx] || '' : '';
        row.push(setVal, readVal);
        if (param.diff) {
          const s = parseFloat(setVal),
            r = parseFloat(readVal);
          row.push(!isNaN(s) && !isNaN(r) ? (r - s).toFixed(0) : '');
        }
      });

      reportRows.push(row.join(','));
    });
  });

  return reportRows.join('\n');
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
