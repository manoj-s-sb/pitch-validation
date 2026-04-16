import { useEffect, useState, useCallback } from 'react';
import CentreCard from '../components/CentreCard';
import NOCHeader from '../../../components/NOCHeader';
import '../noc.css';
import { useDispatch, useSelector } from 'react-redux';
import { checkHealth, checkStatus } from '../../../store/noc/api';

// Maps API resource keys to the icon names CentreCard understands
const RESOURCE_ICON = {
  bowlingMC:  'zap',
  display:    'monitor',
  lbaCamera:  'camera',
  rbaCamera:  'camera',
  lboCamera:  'camera',
  rboCamera:  'camera',
  miniPC:     'server',
  tablet:     'tablet',
};

// Transforms /status API response → facility object shape that CentreCard expects
function statusToFacility(status) {
  if (!status) return null;

  // Parse "Houston (HOU01)" → name="Houston", shortCode="HOU01", id="HOU01"
  const match = status.facility.match(/^(.+?)\s*\(([^)]+)\)$/);
  const name      = status.facility;
  const shortCode = match ? match[2].trim() : 'FAC';
  const id        = shortCode;
  const location = 'USA';

  const lanes = Object.entries(status.lanes).map(([laneName, lane]) => ({
    id:   lane.laneId,
    name: laneName,
    type: /b$/i.test(laneName.trim()) ? 'Bowling' : 'Batting',
    devices: Object.entries(lane.resources).map(([key, resource]) => ({
      key,
      name:   key,
      status: resource.status,
      icon:   RESOURCE_ICON[key] ?? 'server',
      iface:  'ETH',
      ip:     '—',
      loc:    laneName,
      uptime: resource.since
        ? `since ${new Date(resource.since).toLocaleDateString()}`
        : '—',
    })),
  }));

  return {
    id,
    name,
    shortCode,
    location:     location,
    avatarColor:  '#3b82f6',
    infrastructure: [],
    lanes,
  };
}

function getStatsFromStatus(status) {
  if (!status) return { centres: 0, totalLanes: 0, total: 0, online: 0, offline: 0, warnings: 0 };

  const allResources = Object.values(status.lanes).flatMap((lane) =>
    Object.values(lane.resources)
  );

  return {
    centres:    status.facility ? 1 : 0,
    totalLanes: Object.keys(status.lanes).length,
    battinglanes: Object.keys(status.lanes).filter((l) => l.includes('b') === false).length,
    bowlinglanes: Object.keys(status.lanes).filter((l) => l.includes('b') === true).length,
    total:      allResources.length,
    online:     allResources.filter((r) => r.status === 'online').length,
    offline:    allResources.filter((r) => r.status === 'offline').length,
    warnings:   allResources.filter((r) => r.status === 'warning').length,
  };
}

const AUTO_REFRESH_MS = 2 * 60 * 1000; // 2 minutes

export default function MultiCentreView() {
  const dispatch = useDispatch();
  const { status, loading } = useSelector((state) => state.noc);
  const [lastSynced, setLastSynced] = useState(new Date());

  const stats    = getStatsFromStatus(status);
  const facility = statusToFacility(status);

  const refresh = useCallback(() => {
    Promise.all([
      dispatch(checkHealth()),
      dispatch(checkStatus()),
    ]).then(() => setLastSynced(new Date()));
  }, [dispatch]);

  // Initial load
  useEffect(() => {
    document.title = 'Century Cricket — NOC Overview';
    refresh();
  }, [refresh]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const t = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <div className="noc-page">
      <NOCHeader
        title="Century Cricket"
        subtitle="NOC · Multi-Centre Overview"
        subtitleUppercase={true}
        logo={
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontStyle: 'italic', letterSpacing: '-0.5px' }}>
              cc
            </span>
          </div>
        }
        showTime={true}
        showSync={true}
        lastSynced={lastSynced}
        onRefresh={refresh}
        refreshing={loading}
      />

      {/* Global stats bar */}
      <div className="mc-stats-bar">
        <div className="mc-stat-cell">
          <div className="mc-stat-label">Centres</div>
          <div className="mc-stat-value">{stats.centres}</div>
          <div className="mc-stat-sub">Operational facilities</div>
        </div>
        <div className="mc-stat-cell">
          <div className="mc-stat-label">Total Lanes</div>
          <div className="mc-stat-value">{stats.totalLanes || '—'}</div>
          <div className="mc-stat-sub">
            <span style={{ color: '#3b82f6' }}>{stats.battinglanes} Batting</span>
            {' · '}
            <span style={{ color: '#8b5cf6' }}>{stats.bowlinglanes} Bowling</span>
          </div>
        </div>
        <div className="mc-stat-cell">
          <div className="mc-stat-label">Devices Online</div>
          <div className="mc-stat-value mc-val-green">{stats.online || '—'}</div>
          <div className="mc-stat-sub">of {stats.total} total</div>
        </div>
        <div className="mc-stat-cell">
          <div className="mc-stat-label">Offline</div>
          <div className="mc-stat-value mc-val-red">{stats.offline}</div>
          <div className="mc-stat-sub">Need attention</div>
        </div>
        <div className="mc-stat-cell">
          <div className="mc-stat-label">Warnings</div>
          <div className="mc-stat-value mc-val-orange">{stats.warnings}</div>
          <div className="mc-stat-sub">Performance alerts</div>
        </div>
      </div>

      {/* Centres grid */}
      <div className="mc-body">
        <div className="mc-section-label">Cricket Centres</div>
        <div className="mc-grid">
          {facility ? (
            <CentreCard key={facility.id} facility={facility} />
          ) : (
            <div className="mc-stat-sub">Loading facility data…</div>
          )}
        </div>
      </div>
    </div>
  );
}
