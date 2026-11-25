import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'lucide-react';
import {
  parsePitchBalls,
  parseScoringStats,
  getLineLabel,
  getLengthLabel,
  LENGTH_BANDS,
  PITCH_PARAMS,
} from '../utils/pitch';

function showCopyToast(msg) {
  const existing = document.querySelector('.copy-toast-global');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'copy-toast-global';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

// Case-insensitive column lookup (CSV header is "inSwing", "deviation", etc.)
function findCol(colIdx, ...names) {
  const lower = {};
  Object.keys(colIdx).forEach((k) => {
    lower[k.toLowerCase()] = colIdx[k];
  });
  for (const n of names) {
    if (lower[n.toLowerCase()] !== undefined) return lower[n.toLowerCase()];
  }
  return undefined;
}

// Column has at least one non-empty value across the balls (0 counts as a value).
function colHasValues(balls, idx) {
  if (idx === undefined) return false;
  return balls.some((b) => b.row[idx] !== undefined && String(b.row[idx]).trim() !== '');
}

// Format a swing/deviation value with its direction. +ve In / Off Spin, -ve Out / Leg Spin.
function swingText(raw, kind) {
  if (raw === undefined || String(raw).trim() === '') return '-';
  const n = parseFloat(raw);
  if (isNaN(n)) return String(raw);
  if (n === 0) return '0';
  const dir = kind === 'inswing' ? (n > 0 ? 'In' : 'Out') : n > 0 ? 'Off' : 'Leg';
  return `${n > 0 ? '+' : ''}${n} ${dir}`;
}

function swingColor(raw) {
  const n = parseFloat(raw);
  if (isNaN(n) || n === 0) return 'var(--text)';
  return n > 0 ? '#2563eb' : '#dc2626';
}

// Colour a run value: boundaries stand out, dot balls muted.
function runColor(runs) {
  if (runs === 6) return '#7c3aed';
  if (runs === 4) return '#2563eb';
  if (runs === 0) return 'var(--text-dim)';
  return '#16a34a';
}

function RunBadge({ runs, out }) {
  if (out) {
    return <span className="run-badge wicket">W</span>;
  }
  if (runs === null || runs === undefined) return null;
  return (
    <span className="run-badge" style={{ color: runColor(runs), borderColor: runColor(runs) }}>
      {runs}
    </span>
  );
}

function Scoreboard({ summary }) {
  if (!summary) return null;
  const { balls, totalRuns, wickets, fours, sixes, dots, runRate } = summary;
  const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
  return (
    <div className="scoreboard">
      <div className="scoreboard-main">
        <div className="scoreboard-score">
          {totalRuns}
          <span className="scoreboard-slash">/</span>
          {wickets}
        </div>
        <div className="scoreboard-overs">{overs} ov</div>
      </div>
      <div className="scoreboard-chips">
        <div className="score-chip">
          <span className="score-chip-val">{balls}</span>
          <span className="score-chip-lbl">Balls</span>
        </div>
        <div className="score-chip">
          <span className="score-chip-val">{runRate.toFixed(1)}</span>
          <span className="score-chip-lbl">Run Rate</span>
        </div>
        <div className="score-chip">
          <span className="score-chip-val" style={{ color: '#2563eb' }}>
            {fours}
          </span>
          <span className="score-chip-lbl">Fours</span>
        </div>
        <div className="score-chip">
          <span className="score-chip-val" style={{ color: '#7c3aed' }}>
            {sixes}
          </span>
          <span className="score-chip-lbl">Sixes</span>
        </div>
        <div className="score-chip">
          <span className="score-chip-val">{dots}</span>
          <span className="score-chip-lbl">Dots</span>
        </div>
      </div>
    </div>
  );
}

function BallOutcome({ entry }) {
  if (!entry) return null;
  const outLabel = entry.out ? entry.dismissal || 'Wicket' : 'Not Out';
  return (
    <div className="pitch-detail-section">
      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />{' '}
        Ball Outcome
      </h4>
      <div className="pitch-info-grid">
        <div className="pitch-info-card">
          <div className="label">Runs</div>
          <div className="value" style={{ color: entry.out ? '#dc2626' : runColor(entry.runs ?? 0), fontSize: 20 }}>
            {entry.out ? 'OUT' : (entry.runs ?? '-')}
          </div>
        </div>
        <div className="pitch-info-card">
          <div className="label">Result</div>
          <div className="value" style={{ fontSize: 14, color: entry.out ? '#dc2626' : 'var(--text)' }}>
            {outLabel}
          </div>
        </div>
        {entry.direction && (
          <div className="pitch-info-card">
            <div className="label">Direction</div>
            <div className="value" style={{ fontSize: 13 }}>
              {entry.direction}
            </div>
          </div>
        )}
        {entry.fielder && (
          <div className="pitch-info-card">
            <div className="label">Fielder</div>
            <div className="value" style={{ fontSize: 13 }}>
              {entry.fielder}
            </div>
          </div>
        )}
        {entry.travel && (
          <div className="pitch-info-card">
            <div className="label">Travel</div>
            <div className="value" style={{ fontSize: 14 }}>
              {entry.travel} <span style={{ fontSize: 11, fontWeight: 400 }}>m</span>
            </div>
          </div>
        )}
        {entry.maxHeight && (
          <div className="pitch-info-card">
            <div className="label">Max Height</div>
            <div className="value" style={{ fontSize: 14 }}>
              {entry.maxHeight} <span style={{ fontSize: 11, fontWeight: 400 }}>m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PitchMapping({ csvText, scoringCsvText }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAll, setShowAll] = useState(true);
  const [pitchData, setPitchData] = useState({ balls: [], colIdx: {} });
  const [scoring, setScoring] = useState({ byBall: {}, summary: null });

  useEffect(() => {
    const data = parsePitchBalls(csvText);
    setPitchData(data);
    setSelectedIndex(0);
    setShowAll(true);
  }, [csvText]);

  useEffect(() => {
    setScoring(parseScoringStats(scoringCsvText));
  }, [scoringCsvText]);

  const { balls, colIdx } = pitchData;

  const handleSelectBall = useCallback((index) => {
    setSelectedIndex(index);
    setShowAll(false);
  }, []);

  const handleSelectAll = useCallback(() => {
    setShowAll(true);
  }, []);

  if (balls.length === 0) {
    return <div className="no-preview">No data rows in CSV</div>;
  }

  const selectedBall = balls[selectedIndex];

  return (
    <div className="pitch-mapping">
      {/* LEFT: Visual Pitch */}
      <div className="pitch-visual-wrap">
        <div className="pitch-line-labels">
          <span>Outside Off</span>
          <span>Inline</span>
          <span>Outside Leg</span>
        </div>
        <div className="pitch-canvas">
          <div className="pitch-lane-divider" style={{ left: '33.33%' }} />
          <div className="pitch-lane-divider" style={{ left: '66.66%' }} />

          {/* Length bands */}
          {
            LENGTH_BANDS.reduce(
              (acc, band) => {
                const top = acc.offset;
                acc.offset += band.height;
                acc.elements.push(
                  <div
                    key={band.id}
                    className="pitch-length-band"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: `${top}%`,
                      height: `${band.height}%`,
                      background: band.color,
                      opacity: 0.7,
                    }}
                  >
                    <span>{band.label}</span>
                  </div>,
                );
                return acc;
              },
              { offset: 0, elements: [] },
            ).elements
          }

          {/* Stumps */}
          <div
            className="pitch-stumps"
            style={{ position: 'absolute', top: '2%', left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}
          >
            <div className="stump" />
            <div className="stump" />
            <div className="stump" />
          </div>

          {/* Ball dots */}
          {balls.map((ball) => {
            const isSelected = !showAll && selectedIndex === ball.index;
            const showConfig = isSelected || false;
            const showActual = isSelected || showAll;

            return (
              <span key={ball.index}>
                {/* Config dot (red) */}
                {!isNaN(ball.x) && !isNaN(ball.y) && (
                  <div
                    className={`pitch-ball-dot config-ball ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${ball.x / 3}%`,
                      top: `${ball.y}%`,
                      display: showConfig ? '' : 'none',
                    }}
                    onClick={() => handleSelectBall(ball.index)}
                  >
                    <span className="ball-num">{String(ball.ballId)}</span>
                    <div className="ball-tooltip">Ball #{String(ball.ballId)} (Config)</div>
                  </div>
                )}
                {/* Actual dot (blue) */}
                {!isNaN(ball.actualX) && !isNaN(ball.actualY) && (
                  <div
                    className={`pitch-ball-dot actual-ball ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: `${ball.actualX / 3}%`,
                      top: `${ball.actualY}%`,
                      display: showActual ? '' : 'none',
                    }}
                    onClick={() => handleSelectBall(ball.index)}
                  >
                    <span className="ball-num">{String(ball.ballId)}</span>
                    <div className="ball-tooltip">Ball #{String(ball.ballId)} (Actual)</div>
                  </div>
                )}
              </span>
            );
          })}

          {/* Config "C" dot for All mode */}
          {showAll && balls.length > 0 && !isNaN(balls[0].x) && !isNaN(balls[0].y) && (
            <div
              className="pitch-ball-dot config-ball selected"
              style={{
                left: `${balls[0].x / 3}%`,
                top: `${balls[0].y}%`,
              }}
            >
              <span className="ball-num">C</span>
              <div className="ball-tooltip">Config (Set)</div>
            </div>
          )}

          {/* Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              zIndex: 6,
              display: 'flex',
              gap: 12,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
              <span
                style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}
              />{' '}
              Config
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>
              <span
                style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}
              />{' '}
              Actual
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Ball selector + detail */}
      <div className="pitch-detail-panel">
        <Scoreboard summary={scoring.summary} />
        <div className="ball-selector">
          <button className={`ball-selector-btn ${showAll ? 'active' : ''}`} onClick={handleSelectAll}>
            <span
              className="dot"
              style={{ background: '#3b82f6', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            />
            All
          </button>
          {balls.map((ball, i) => {
            const releaseSpd = parseFloat(ball.releaseSpeed) * 1.05;
            const spdText = !isNaN(releaseSpd) ? ` (${Math.round(releaseSpd)} km/h)` : '';
            const score = scoring.byBall[String(ball.ballId)];
            return (
              <button
                key={i}
                className={`ball-selector-btn ${!showAll && selectedIndex === i ? 'active' : ''}`}
                onClick={() => handleSelectBall(i)}
              >
                <span
                  className="dot"
                  style={{ background: '#ef4444', border: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                />
                Ball {String(ball.ballId)}
                {spdText}
                {score && <RunBadge runs={score.runs} out={score.out} />}
              </button>
            );
          })}
        </div>

        <div id="ball-detail">
          {showAll ? (
            <AllBallsDetail balls={balls} colIdx={colIdx} />
          ) : selectedBall ? (
            <BallDetail
              ball={selectedBall}
              colIdx={colIdx}
              scoringEntry={scoring.byBall[String(selectedBall.ballId)]}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BallDetail({ ball, colIdx, scoringEntry }) {
  const releaseSpd = parseFloat(ball.releaseSpeed) * 1.05;
  const spdVal = !isNaN(releaseSpd) ? Math.round(releaseSpd) : '-';
  const pitchSpd = parseFloat(ball.speed);
  const pitchSpdVal = !isNaN(pitchSpd) ? Math.round(pitchSpd) : '-';

  const isRPM = (label) => label === 'L-RPM' || label === 'R-RPM';

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      showCopyToast('Video URL copied successfully!');
    });
  };

  return (
    <>
      {/* Ball Outcome (from scoring_stats.csv) */}
      <BallOutcome entry={scoringEntry} />

      {/* Config (Set) */}
      <div className="pitch-detail-section">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}
          />{' '}
          Config (Set)
        </h4>
        <div className="pitch-info-grid">
          <div className="pitch-info-card">
            <div className="label">Speed</div>
            <div className="value speed-val">
              {pitchSpdVal}
              <span style={{ fontSize: 11, fontWeight: 400 }}> km/h</span>
            </div>
          </div>
          {!isNaN(ball.x) && (
            <>
              <div className="pitch-info-card">
                <div className="label">Line</div>
                <div className="value line-val" style={{ fontSize: 14 }}>
                  {getLineLabel(ball.x)}
                </div>
              </div>
              <div className="pitch-info-card">
                <div className="label">Length</div>
                <div className="value length-val" style={{ fontSize: 14 }}>
                  {getLengthLabel(ball.y)}
                </div>
              </div>
              <div className="pitch-info-card">
                <div className="label">X</div>
                <div className="value">{ball.x.toFixed(1)}</div>
              </div>
              <div className="pitch-info-card">
                <div className="label">Y</div>
                <div className="value">{ball.y.toFixed(1)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actual Pitching Point */}
      <div className="pitch-detail-section">
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}
          />{' '}
          Actual Pitching Point
        </h4>
        <div className="pitch-info-grid">
          <div className="pitch-info-card">
            <div className="label">Release Speed</div>
            <div className="value">
              {spdVal}
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-dim)' }}> km/h</span>
            </div>
          </div>
          {!isNaN(ball.actualX) ? (
            <>
              <div className="pitch-info-card">
                <div className="label">Line</div>
                <div className="value" style={{ fontSize: 15 }}>
                  {getLineLabel(ball.actualX)}
                </div>
              </div>
              <div className="pitch-info-card">
                <div className="label">Length</div>
                <div className="value" style={{ fontSize: 15 }}>
                  {getLengthLabel(ball.actualY)}
                </div>
              </div>
              <div className="pitch-info-card">
                <div className="label">X</div>
                <div className="value">
                  {ball.actualX.toFixed(1)}{' '}
                  <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-dim)' }}>
                    ({ball.pitchXcm.toFixed(1)} cm)
                  </span>
                </div>
              </div>
              <div className="pitch-info-card">
                <div className="label">Y</div>
                <div className="value">
                  {ball.actualY.toFixed(1)}{' '}
                  <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-dim)' }}>
                    ({ball.pitchZcm.toFixed(1)} cm)
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="pitch-info-card">
              <div className="label">Data</div>
              <div className="value" style={{ fontSize: 14, color: 'var(--text-dim)' }}>
                -
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pan / Tilt / RPM */}
      <div className="pitch-detail-section" style={{ marginTop: 24 }}>
        <div className="param-table-wrap">
          <table className="param-table">
            <thead>
              <tr>
                <th>Pan / Tilt / RPM</th>
                <th>Set</th>
                <th>Read</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {PITCH_PARAMS.map((param) => {
                const setIdx = colIdx[param.setCol];
                const readIdx = colIdx[param.readCol];
                if (setIdx === undefined && readIdx === undefined) return null;
                const setVal = setIdx !== undefined ? ball.row[setIdx] || '-' : '-';
                const readVal = readIdx !== undefined ? ball.row[readIdx] || '-' : '-';
                const rpm = isRPM(param.label);
                const setNum = parseFloat(setVal);
                const readNum = parseFloat(readVal);
                const hasDiff = !rpm && !isNaN(setNum) && !isNaN(readNum);
                const diff = hasDiff ? Math.abs(setNum - readNum) : 0;
                const diffClass = hasDiff ? (diff === 0 ? 'match' : diff <= 50 ? 'off' : 'bad') : '';
                const diffLabel = hasDiff
                  ? diff === 0
                    ? 'Match'
                    : (setNum > readNum ? '-' : '+') + diff.toFixed(0)
                  : '-';

                return (
                  <tr key={param.label}>
                    <td className="param-name">{param.label}</td>
                    <td>{setVal}</td>
                    <td>
                      {rpm ? (
                        <span
                          style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}
                          title="RPM read values are not accurate"
                        >
                          {readVal} <span style={{ fontSize: 10, color: '#ef4444' }}>*</span>
                        </span>
                      ) : (
                        readVal
                      )}
                    </td>
                    <td>{hasDiff ? <span className={`pitch-diff badge ${diffClass}`}>{diffLabel}</span> : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inswing & Deviation */}
      {(() => {
        const inswingCol = findCol(colIdx, 'inSwing', 'Inswing', 'INSWING', 'inswing');
        const deviationCol = findCol(colIdx, 'deviation', 'Deviation', 'DEVIATION');
        const inswingVal = inswingCol !== undefined ? ball.row[inswingCol] : undefined;
        const deviationVal = deviationCol !== undefined ? ball.row[deviationCol] : undefined;
        const showInswing = inswingVal !== undefined && String(inswingVal).trim() !== '';
        const showDeviation = deviationVal !== undefined && String(deviationVal).trim() !== '';
        if (!showInswing && !showDeviation) return null;
        return (
          <div className="pitch-detail-section">
            <div className="pitch-info-grid">
              {showInswing && (
                <div className="pitch-info-card" title="In = positive, Out = negative">
                  <div className="label">Swing</div>
                  <div className="value" style={{ fontSize: 15, color: swingColor(inswingVal) }}>
                    {swingText(inswingVal, 'inswing')}
                  </div>
                </div>
              )}
              {showDeviation && (
                <div className="pitch-info-card" title="Off Spin = positive, Leg Spin = negative">
                  <div className="label">Deviation</div>
                  <div className="value" style={{ fontSize: 15, color: swingColor(deviationVal) }}>
                    {swingText(deviationVal, 'deviation')}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Video */}
      <div className="pitch-detail-section">
        <h4>Video</h4>
        {ball.videoUrl && ball.videoUrl.trim() ? (
          <>
            <div className="pitch-video-wrap">
              <video controls src={ball.videoUrl.trim()} style={{ width: '100%', maxHeight: 280 }} />
            </div>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
              }}
              onClick={() => handleCopyUrl(ball.videoUrl.trim())}
              title="Click to copy video URL"
            >
              <Link size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {ball.videoUrl.trim()}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>
                Click to copy
              </span>
            </div>
          </>
        ) : (
          <div className="pitch-no-video">No video available for this ball</div>
        )}
      </div>
    </>
  );
}

function AllBallsDetail({ balls, colIdx }) {
  const isRPM = (label) => label === 'L-RPM' || label === 'R-RPM';

  const availableParams = PITCH_PARAMS.filter((p) => {
    return colIdx[p.setCol] !== undefined || colIdx[p.readCol] !== undefined;
  });

  const inswingCol = findCol(colIdx, 'inSwing', 'Inswing', 'INSWING', 'inswing');
  const deviationCol = findCol(colIdx, 'deviation', 'Deviation', 'DEVIATION');
  const hasInswing = colHasValues(balls, inswingCol);
  const hasDeviation = colHasValues(balls, deviationCol);

  return (
    <>
      <div className="pitch-detail-section">
        <h4>All Balls Overview</h4>
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          Showing all {balls.length} balls — config (red) vs actual (blue)
        </div>
        <div className="param-table-wrap">
          <table className="param-table">
            <thead>
              {/* Top header row with grouped columns */}
              <tr>
                <th rowSpan={2} style={{ verticalAlign: 'bottom' }}>
                  Ball
                </th>
                <th colSpan={3} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-solid)' }}>
                  Speed (km/h)
                </th>
                {availableParams.map((p) => (
                  <th
                    key={p.label}
                    colSpan={isRPM(p.label) ? 2 : 3}
                    style={{ textAlign: 'center', borderBottom: '1px solid var(--border-solid)' }}
                  >
                    {p.label}
                    {isRPM(p.label) && <span style={{ fontSize: 9, color: '#ef4444', marginLeft: 2 }}>*</span>}
                  </th>
                ))}
                {hasInswing && (
                  <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'bottom' }}>
                    Swing
                  </th>
                )}
                {hasDeviation && (
                  <th rowSpan={2} style={{ textAlign: 'center', verticalAlign: 'bottom' }}>
                    Deviation
                  </th>
                )}
              </tr>
              {/* Sub header row */}
              <tr>
                <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>Set</th>
                <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>Actual</th>
                <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>Diff</th>
                {availableParams.map((p) =>
                  isRPM(p.label) ? (
                    <React.Fragment key={p.label + '-sub'}>
                      <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>Set</th>
                      <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>Read</th>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={p.label + '-sub'}>
                      <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>Set</th>
                      <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>Read</th>
                      <th style={{ textAlign: 'center', fontSize: 10, fontWeight: 500, padding: '6px 8px' }}>Diff</th>
                    </React.Fragment>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {balls.map((ball) => {
                // Speed
                const releaseSpd = parseFloat(ball.releaseSpeed) * 1.05;
                const relVal = !isNaN(releaseSpd) ? Math.round(releaseSpd) : NaN;
                const cfgSpd = parseFloat(ball.speed);
                const cfgVal = !isNaN(cfgSpd) ? Math.round(cfgSpd) : NaN;
                const hasSpdDiff = !isNaN(relVal) && !isNaN(cfgVal);
                const spdDiff = hasSpdDiff ? relVal - cfgVal : 0;
                const absSpdDiff = Math.abs(spdDiff);
                const spdClass = hasSpdDiff ? (absSpdDiff === 0 ? 'match' : absSpdDiff <= 5 ? 'off' : 'bad') : '';
                const spdLabel = hasSpdDiff ? (absSpdDiff === 0 ? '0' : (spdDiff > 0 ? '+' : '') + spdDiff) : '-';

                return (
                  <tr key={ball.index}>
                    <td className="param-name">{String(ball.ballId)}</td>
                    {/* Speed cells */}
                    <td style={{ textAlign: 'center' }}>{!isNaN(cfgVal) ? cfgVal : '-'}</td>
                    <td style={{ textAlign: 'center' }}>{!isNaN(relVal) ? relVal : '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {hasSpdDiff ? <span className={`pitch-diff badge ${spdClass}`}>{spdLabel}</span> : '-'}
                    </td>
                    {/* Param cells */}
                    {availableParams.map((param) => {
                      const setIdx = colIdx[param.setCol];
                      const readIdx = colIdx[param.readCol];
                      const setVal = setIdx !== undefined ? ball.row[setIdx] || '-' : '-';
                      const readVal = readIdx !== undefined ? ball.row[readIdx] || '-' : '-';
                      const rpm = isRPM(param.label);
                      const setNum = parseFloat(setVal);
                      const readNum = parseFloat(readVal);
                      const hasDiff = !rpm && !isNaN(setNum) && !isNaN(readNum);
                      const diff = hasDiff ? Math.abs(setNum - readNum) : 0;
                      const diffClass = hasDiff ? (diff === 0 ? 'match' : diff <= 50 ? 'off' : 'bad') : '';
                      const diffLabel = hasDiff
                        ? diff === 0
                          ? '0'
                          : (setNum > readNum ? '-' : '+') + diff.toFixed(0)
                        : '-';

                      return rpm ? (
                        <React.Fragment key={param.label}>
                          <td style={{ textAlign: 'center' }}>{setVal}</td>
                          <td style={{ textAlign: 'center', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            {readVal}
                          </td>
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={param.label}>
                          <td style={{ textAlign: 'center' }}>{setVal}</td>
                          <td style={{ textAlign: 'center' }}>{readVal}</td>
                          <td style={{ textAlign: 'center' }}>
                            {hasDiff ? <span className={`pitch-diff badge ${diffClass}`}>{diffLabel}</span> : '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    {/* Inswing & Deviation */}
                    {hasInswing && (
                      <td style={{ textAlign: 'center', fontWeight: 600, color: swingColor(ball.row[inswingCol]) }}>
                        {swingText(ball.row[inswingCol], 'inswing')}
                      </td>
                    )}
                    {hasDeviation && (
                      <td style={{ textAlign: 'center', fontWeight: 600, color: swingColor(ball.row[deviationCol]) }}>
                        {swingText(ball.row[deviationCol], 'deviation')}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, fontStyle: 'italic' }}>
          * RPM read values may not be accurate — diff not computed
        </div>
        {(hasInswing || hasDeviation) && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            {hasInswing && (
              <>
                <strong>Swing:</strong> In = +, Out = −
              </>
            )}
            {hasInswing && hasDeviation && <span style={{ margin: '0 6px' }}>·</span>}
            {hasDeviation && (
              <>
                <strong>Deviation:</strong> Off Spin = +, Leg Spin = −
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
