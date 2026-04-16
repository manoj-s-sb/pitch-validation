import { useState, useEffect, useCallback, Fragment } from 'react';
// import { useNavigate } from 'react-router-dom';
import { Search, Network, Server, Wifi, Monitor, Tv, Zap, Tablet, Camera } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import NOCHeader from '../../../components/NOCHeader';
import { checkStatus } from '../../../store/noc/api';
import '../noc.css';

// ─── Config maps ──────────────────────────────────────────────────────────────

const typeConfig = {
  switch:    { bg: '#e0f2fe', color: '#0369a1', icon: Network },
  server:    { bg: '#f3e8ff', color: '#7e22ce', icon: Server },
  router:    { bg: '#f1f5f9', color: '#475569', icon: Wifi },
  poeswitch: { bg: '#d1fae5', color: '#065f46', icon: Network },
  pc:        { bg: '#dcfce7', color: '#15803d', icon: Monitor },
  display:   { bg: '#ffedd5', color: '#c2410c', icon: Tv },
  bowling:   { bg: '#fee2e2', color: '#b91c1c', icon: Zap },
  tablet:    { bg: '#ede9fe', color: '#5b21b6', icon: Tablet },
  camera:    { bg: '#cffafe', color: '#0e7490', icon: Camera },
};

const ifaceConfig = {
  ETH:  { bg: '#dbeafe', color: '#1d4ed8' },
  WIFI: { bg: '#ede9fe', color: '#5b21b6' },
  HDMI: { bg: '#fef3c7', color: '#92400e' },
};

const statusConfig = {
  online:  { color: '#22c55e', label: 'Online' },
  offline: { color: '#ef4444', label: 'Offline' },
  warning: { color: '#f59e0b', label: 'Warning' },
};

// ─── Resource key → device metadata ──────────────────────────────────────────

const RESOURCE_META = {
  bowlingMC:  { type: 'bowling', iface: 'ETH',  name: 'Bowling MC'   },
  display:    { type: 'display', iface: 'HDMI', name: 'Display'      },
  lbaCamera:  { type: 'camera',  iface: 'ETH',  name: 'LBA Camera'   },
  rbaCamera:  { type: 'camera',  iface: 'ETH',  name: 'RBA Camera'   },
  lboCamera:  { type: 'camera',  iface: 'ETH',  name: 'LBO Camera'   },
  rboCamera:  { type: 'camera',  iface: 'ETH',  name: 'RBO Camera'   },
  miniPC:     { type: 'pc',      iface: 'ETH',  name: 'Mini PC'      },
  tablet:     { type: 'tablet',  iface: 'WIFI', name: 'Tablet'       },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcUptime(since) {
  if (!since) return '—';
  const ms = Date.now() - new Date(since).getTime();
  if (ms < 0) return '—';
  const days  = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return `${days}d ${hours}h`;
}

// Converts API resource map → device rows CentreDevicesView can render
function resourceToDevices(resources, laneName) {
  return Object.entries(resources).map(([key, resource]) => {
    const meta = RESOURCE_META[key] ?? { type: 'server', iface: 'ETH', name: key };
    return {
      key,
      name:   meta.name,
      id:     resource.description || key,
      type:   meta.type,
      iface:  '-',
      ip:     '—',
      loc:    laneName,
      uptime: calcUptime(resource.since),
      status: resource.status,
      checkedAt: resource.checkedAt,
      since:  resource.since,
    };
  });
}

// Converts /status API response → facility shape
function statusToFacility(status) {
  if (!status) return null;

  const match     = status.facility.match(/^(.+?)\s*\(([^)]+)\)$/);
  const name      = match ? match[1].trim() : status.facility;
  const shortCode = match ? match[2].trim() : 'FAC';

  const lanes = Object.entries(status.lanes).map(([laneName, lane]) => ({
    id:      lane.laneId || laneName,
    name:    laneName,
    type:    /b$/i.test(laneName.trim()) ? 'Bowling' : 'Batting',
    healthy: lane.healthy,
    devices: resourceToDevices(lane.resources, laneName),
  }));

  return {
    id:             shortCode,
    name:           status.facility,
    shortCode,
    location:       name,
    infrastructure: [],
    lanes,
    lastSummary:    status.lastSummary,
    timestamp:      status.timestamp,
  };
}

function calcStats(facility) {
  const allDevices = [...facility.infrastructure, ...facility.lanes.flatMap((l) => l.devices)];
  const batting    = facility.lanes.filter((l) => l.type === 'Batting').length;
  const bowling    = facility.lanes.filter((l) => l.type === 'Bowling').length;
  const onlineLanes = facility.lanes.filter((l) => l.devices.every((d) => d.status === 'online')).length;
  return {
    total:      allDevices.length,
    online:     allDevices.filter((d) => d.status === 'online').length,
    offline:    allDevices.filter((d) => d.status === 'offline').length,
    warnings:   allDevices.filter((d) => d.status === 'warning').length,
    totalLanes: facility.lanes.length,
    onlineLanes,
    batting,
    bowling,
  };
}

// ─── DeviceRow ────────────────────────────────────────────────────────────────

function DeviceRow({ device, setTooltip, onClick }) {
  const tc = typeConfig[device.type] || { bg: '#f1f5f9', color: '#475569', icon: Server };
  const ic = ifaceConfig[device.iface] || { bg: '#f1f5f9', color: '#475569' };
  const sc = statusConfig[device.status] || statusConfig.online;
  const TypeIcon = tc.icon;
  return (
    <tr
      className={`noc-table-row${onClick ? ' noc-table-row-link' : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => setTooltip({ device, x: e.clientX + 16, y: e.clientY + 16 })}
      onMouseMove={(e)  => setTooltip({ device, x: e.clientX + 16, y: e.clientY + 16 })}
      onMouseLeave={() => setTooltip(null)}
    >
      <td>
        <div className="noc-dev-cell">
          <div className="noc-dev-icon" style={{ background: tc.bg, color: tc.color }}>
            <TypeIcon size={14} strokeWidth={1.8} />
          </div>
          <div>
            <div className="noc-dev-name">{device.name}</div>
            <div className="noc-dev-id">{device.id}</div>
          </div>
        </div>
      </td>
      <td>
        <div className="noc-status-badge" style={{ color: sc.color }}>
          <span
            className={`noc-status-dot${device.status === 'offline' ? ' noc-status-dot--offline' : device.status === 'warning' ? ' noc-status-dot--warning' : ''}`}
            style={{ background: sc.color }}
          />
          {sc.label}
        </div>
      </td>
      <td>
        <span className="noc-type-badge" style={{ background: tc.bg, color: tc.color }}>
          {device.type}
        </span>
      </td>
      <td>
        <span className="noc-iface-badge" style={{ background: ic.bg, color: ic.color }}>
          {device.iface}
        </span>
      </td>
      <td><span className="noc-ip">{device.ip}</span></td>
      <td><span className="noc-location">{device.loc}</span></td>
      <td><span className="noc-uptime">{device.uptime}</span></td>
    </tr>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

const AUTO_REFRESH_MS = 2 * 60 * 1000; // 2 minutes

export default function CentreDevicesView() {
  const dispatch = useDispatch();
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [tooltip, setTooltip] = useState(null);
  const [lastSynced, setLastSynced] = useState(new Date());

  const { status, loading } = useSelector((state) => state.noc);
  const facility = statusToFacility(status);
  const stats    = facility ? calcStats(facility) : null;

  const refresh = useCallback(() => {
    dispatch(checkStatus()).then(() => setLastSynced(new Date()));
  }, [dispatch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const t = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    document.title = facility
      ? `Century Cricket — ${facility.name} Centre Overview`
      : 'Century Cricket';
  }, [facility]);

  function matchesFilter(device) {
    if (filter === 'online'   && device.status !== 'online')  return false;
    if (filter === 'offline'  && device.status !== 'offline') return false;
    if (filter === 'warnings' && device.status !== 'warning') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!device.name.toLowerCase().includes(q) && !device.id.toLowerCase().includes(q)) return false;
    }
    return true;
  }

  if (loading || !facility) {
    return (
      <div className="noc-page" style={{ padding: 40, color: '#6b7280' }}>
        {loading ? 'Loading facility data…' : 'No facility data available.'}
      </div>
    );
  }
  return (
    <div className="noc-page">
      <NOCHeader
        title={facility.name}
        subtitle={facility.location}
        backPath="/noc"
        showTime={false}
        showSync={true}
        lastSynced={lastSynced}
        onRefresh={refresh}
        refreshing={loading}
      />

      {/* Stats bar */}
      <div className="noc-stats-bar">
        <div className="noc-stat-cell">
          <div className="noc-stat-label">Total Devices</div>
          <div className="noc-stat-value">{stats.total}</div>
          <div className="noc-stat-sub">All lanes + infra</div>
        </div>
        <div className="noc-stat-cell">
          <div className="noc-stat-label">Online</div>
          <div className="noc-stat-value noc-val-green">{stats.online}</div>
          <div className="noc-stat-sub">Responding</div>
        </div>
        <div className="noc-stat-cell">
          <div className="noc-stat-label">Offline</div>
          <div className="noc-stat-value noc-val-red">{stats.offline}</div>
          <div className="noc-stat-sub">No response</div>
        </div>
        <div className="noc-stat-cell">
          <div className="noc-stat-label">Warnings</div>
          <div className="noc-stat-value noc-val-orange">{stats.warnings}</div>
          <div className="noc-stat-sub">Issues</div>
        </div>
        <div className="noc-stat-cell">
          <div className="noc-stat-label">Lanes</div>
          <div className="noc-stat-value">
            <span className="noc-val-blue">{stats.onlineLanes}</span>
            <span className="noc-val-total">/{stats.totalLanes}</span>
          </div>
          <div className="noc-stat-sub">
            {stats.batting} batting · {stats.bowling} bowling
          </div>
        </div>
      </div>

      <div className="noc-facility-content">
        <div className="noc-devices-section">
          <div className="noc-devices-header">
            <h2 className="noc-devices-title">All Devices</h2>
            <div className="noc-devices-controls">
              <div className="noc-search">
                <Search size={14} />
                <input
                  placeholder="Search device / description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="noc-filter-tabs">
                {['all', 'online', 'offline', 'warnings'].map((f) => (
                  <button
                    key={f}
                    className={`noc-filter-tab ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <table className="noc-table">
            <thead>
              <tr className="noc-table-head">
                <th style={{ width: '28%' }}>Device</th>
                <th style={{ width: '11%' }}>Status</th>
                <th style={{ width: '11%' }}>Type</th>
                <th style={{ width: '10%' }}>Interface</th>
                <th style={{ width: '14%' }}>IP Address</th>
                <th style={{ width: '13%' }}>Location</th>
                <th style={{ width: '13%' }}>Uptime</th>
              </tr>
            </thead>
            <tbody>
              {/* Lanes */}
              {facility.lanes.map((lane) => {
                const rows = lane.devices.filter(matchesFilter);
                if (rows.length === 0) return null;
                return (
                  <Fragment key={lane.id}>
                    <tr
                      className="noc-group-header noc-group-lane"
                      // onClick={() => navigate(`/noc/${facility.id}/${lane.id}`)}
                    >
                      <td colSpan={7}>
                        {lane.name} — {lane.type} — {lane.devices.length} Devices
                        {lane.healthy
                          ? <span style={{ color: '#22c55e', marginLeft: 8, fontSize: 11 }}>● Healthy</span>
                          : <span style={{ color: '#ef4444', marginLeft: 8, fontSize: 11 }}>● Issues</span>
                        }
                        <span className="noc-group-arrow">↗</span>
                      </td>
                    </tr>
                    {rows.map((device, i) => (
                      <DeviceRow
                        key={i}
                        device={device}
                        setTooltip={setTooltip}
                        // onClick={() => navigate(`/noc/${facility.id}/${lane.id}`)}
                      />
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="noc-tooltip" style={{ top: tooltip.y, left: tooltip.x }}>
          <div className="noc-tooltip-title">{tooltip.device.name}</div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Status</span>
            <span style={{ color: statusConfig[tooltip.device.status]?.color, fontWeight: 600 }}>
              {statusConfig[tooltip.device.status]?.label.toUpperCase()}
            </span>
          </div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Description</span>
            <span className="noc-tooltip-val">{tooltip.device.id}</span>
          </div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Interface</span>
            <span className="noc-tooltip-val">{tooltip.device.iface}</span>
          </div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Location</span>
            <span className="noc-tooltip-val">{tooltip.device.loc}</span>
          </div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Uptime</span>
            <span className="noc-tooltip-val">{tooltip.device.uptime}</span>
          </div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Checked</span>
            <span className="noc-tooltip-val">
              {tooltip.device.checkedAt
                ? new Date(tooltip.device.checkedAt).toLocaleTimeString()
                : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
