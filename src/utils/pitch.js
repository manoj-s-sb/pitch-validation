import { parseCSV } from './csv';

export const PITCH_PARAMS = [
  { label: 'Pan', setCol: 'Pan (Set)', readCol: 'Pan (Read)' },
  { label: 'M-Tilt', setCol: 'M-Tilt (Set)', readCol: 'M-Tilt (Read)' },
  { label: 'L-Tilt', setCol: 'L-Tilt (Set)', readCol: 'L-Tilt (Read)' },
  { label: 'R-Tilt', setCol: 'R-Tilt (Set)', readCol: 'R-Tilt (Read)' },
  { label: 'L-RPM', setCol: 'L-rpm (Set)', readCol: 'L-rpm (Read)' },
  { label: 'R-RPM', setCol: 'R-rpm (Set)', readCol: 'R-rpm (Read)' },
];

export const LENGTH_BANDS = [
  { id: 'fulltoss', label: 'Full Toss', height: 8, color: '#F79894' },
  { id: 'yorkers', label: 'Yorkers', height: 8, color: '#FBE68C' },
  { id: 'halfvolley', label: 'Half Volley', height: 16, color: '#81C784' },
  { id: 'full', label: 'Full', height: 16, color: '#F79894' },
  { id: 'length', label: 'Length', height: 16, color: '#CF86DC' },
  { id: 'backoflength', label: 'Back of Length', height: 16, color: '#8486D8' },
  { id: 'shorts', label: 'Shorts', height: 20, color: '#555' },
];

export function getLineLabel(x) {
  const pct = x / 3;
  if (pct <= 33.33) return 'Outside Off';
  if (pct <= 66.66) return 'Inline';
  return 'Outside Leg';
}

export function getLengthLabel(y) {
  if (y < 8) return 'Full Toss';
  if (y <= 16) return 'Yorkers';
  if (y <= 32) return 'Half Volley';
  if (y <= 48) return 'Full';
  if (y <= 64) return 'Length';
  if (y <= 80) return 'Back of Length';
  return 'Shorts';
}

export function parsePitchBalls(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return { balls: [], colIdx: {} };

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const colIdx = {};
  headers.forEach((h, i) => {
    colIdx[h.trim()] = i;
  });

  const ballIdCol = colIdx['Ball ID'];
  const xCol = colIdx['x'];
  const yCol = colIdx['y'];
  const speedCol = colIdx['speed'];
  const releaseSpeedCol = colIdx['Release speed'];
  const videoCol = colIdx['Video URL'];
  const pitchXCol = colIdx['Pitching point x'];
  const pitchZCol = colIdx['Pitching point z'];

  const balls = dataRows.map((row, ri) => {
    const ballId = ballIdCol !== undefined ? row[ballIdCol] : ri + 1;
    const x = xCol !== undefined ? parseFloat(row[xCol]) : NaN;
    const y = yCol !== undefined ? parseFloat(row[yCol]) : NaN;
    const spd = speedCol !== undefined ? row[speedCol] : '-';
    const releaseSpeed = releaseSpeedCol !== undefined ? row[releaseSpeedCol] : '-';
    const videoUrl = videoCol !== undefined ? row[videoCol] : '';

    const pitchXcm = pitchXCol !== undefined ? parseFloat(row[pitchXCol]) : NaN;
    const pitchZcm = pitchZCol !== undefined ? parseFloat(row[pitchZCol]) : NaN;
    const PITCH_WIDTH_CM = 177.8;
    const actualX = !isNaN(pitchXcm) ? ((pitchXcm + PITCH_WIDTH_CM / 2) / PITCH_WIDTH_CM) * 300 : NaN;
    const actualY = !isNaN(pitchZcm) ? (pitchZcm / 1000) * 80 : NaN;

    return { ballId, x, y, actualX, actualY, pitchXcm, pitchZcm, speed: spd, releaseSpeed, videoUrl, row, index: ri };
  });

  return { balls, colIdx };
}

// Parse scoring_stats.csv (cricket outcome per ball) into a per-ball lookup + summary.
// Joins to stats.csv on "Ball Number" <-> "Ball ID".
export function parseScoringStats(csvText) {
  const empty = { byBall: {}, summary: null };
  if (!csvText || typeof csvText !== 'string') return empty;

  const rows = parseCSV(csvText);
  if (rows.length < 2) return empty;

  const headers = rows[0].map((h) => h.trim());
  const idx = {};
  headers.forEach((h, i) => {
    idx[h] = i;
  });

  const get = (row, name) => {
    const i = idx[name];
    return i !== undefined ? (row[i] ?? '').trim() : '';
  };

  const isWicket = (wicketVal, dismissalVal) => {
    const w = (wicketVal || '').toLowerCase();
    if (dismissalVal) return true;
    return w !== '' && w !== 'not_out' && w !== 'notout' && w !== 'no' && w !== 'none';
  };

  const byBall = {};
  let totalRuns = 0;
  let wickets = 0;
  let fours = 0;
  let sixes = 0;
  let dots = 0;
  let count = 0;

  rows.slice(1).forEach((row) => {
    if (!row || row.length === 0) return;
    const ballNum = get(row, 'Ball Number');
    if (ballNum === '') return;

    const runs = parseInt(get(row, 'Runs'), 10);
    const runsVal = isNaN(runs) ? 0 : runs;
    const dismissal = get(row, 'Dismissal');
    const wicketRaw = get(row, 'Wicket');
    const out = isWicket(wicketRaw, dismissal);

    const entry = {
      ballNumber: ballNum,
      runs: isNaN(runs) ? null : runs,
      out,
      dismissal,
      fielder: get(row, 'Fielder'),
      direction: get(row, 'Ball Direction'),
      travel: get(row, 'Ball Travel (m)'),
      maxHeight: get(row, 'Max Height (m)'),
      bounced: get(row, 'Bounced'),
      scoringCheck: get(row, 'Scoring Check'),
    };
    byBall[String(ballNum)] = entry;

    totalRuns += runsVal;
    count++;
    if (out) wickets++;
    if (runsVal === 4) fours++;
    if (runsVal === 6) sixes++;
    if (runsVal === 0 && !out) dots++;
  });

  if (count === 0) return empty;

  const overs = count / 6;
  const runRate = overs > 0 ? totalRuns / overs : 0;

  return {
    byBall,
    summary: { balls: count, totalRuns, wickets, fours, sixes, dots, runRate },
  };
}

export function configXtoCm(x) {
  return x - 150;
}
export function configYtoCm(y) {
  return (y / 100) * 1000;
}

export const DIFF_PARAMS = [
  { key: 'pan', setCol: 'Pan (Set)', readCol: 'Pan (Read)' },
  { key: 'mTilt', setCol: 'M-Tilt (Set)', readCol: 'M-Tilt (Read)' },
  { key: 'lTilt', setCol: 'L-Tilt (Set)', readCol: 'L-Tilt (Read)' },
  { key: 'rTilt', setCol: 'R-Tilt (Set)', readCol: 'R-Tilt (Read)' },
];

export function parseFileNameMeta(fileName) {
  const laneMatch = fileName.match(/Lane(\d+)/i);
  const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
  return {
    lane: laneMatch ? laneMatch[1] : '',
    date: dateMatch ? dateMatch[1] : '',
  };
}
