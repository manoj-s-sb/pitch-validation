import { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Network, Server, Wifi, Monitor, Tv, Zap, Tablet, Camera } from 'lucide-react';
import { facilities } from '../data';
import NOCHeader from '../../../components/NOCHeader';
import '../noc.css';

const typeConfig = {
  switch: { bg: '#e0f2fe', color: '#0369a1', icon: Network },
  server: { bg: '#f3e8ff', color: '#7e22ce', icon: Server },
  router: { bg: '#f1f5f9', color: '#475569', icon: Wifi },
  poeswitch: { bg: '#d1fae5', color: '#065f46', icon: Network },
  pc: { bg: '#dcfce7', color: '#15803d', icon: Monitor },
  display: { bg: '#ffedd5', color: '#c2410c', icon: Tv },
  bowling: { bg: '#fee2e2', color: '#b91c1c', icon: Zap },
  tablet: { bg: '#ede9fe', color: '#5b21b6', icon: Tablet },
  camera: { bg: '#cffafe', color: '#0e7490', icon: Camera },
};

const ifaceConfig = {
  ETH: { bg: '#dbeafe', color: '#1d4ed8' },
  WIFI: { bg: '#ede9fe', color: '#5b21b6' },
  HDMI: { bg: '#fef3c7', color: '#92400e' },
};

const statusConfig = {
  online: { color: '#22c55e', label: 'Online' },
  offline: { color: '#ef4444', label: 'Offline' },
  warning: { color: '#f59e0b', label: 'Warning' },
};

function calcStats(facility) {
  const all = [...facility.infrastructure, ...facility.lanes.flatMap((l) => l.devices)];
  const batting = facility.lanes.filter((l) => l.type === 'Batting').length;
  const hybrid = facility.lanes.filter((l) => l.type === 'Hybrid').length;
  const onlineLanes = facility.lanes.filter((l) => l.devices.every((d) => d.status === 'online')).length;
  return {
    total: all.length,
    online: all.filter((d) => d.status === 'online').length,
    offline: all.filter((d) => d.status === 'offline').length,
    warnings: all.filter((d) => d.status === 'warning').length,
    totalLanes: facility.lanes.length,
    onlineLanes,
    batting,
    hybrid,
  };
}

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
      onMouseMove={(e) => setTooltip({ device, x: e.clientX + 16, y: e.clientY + 16 })}
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
          <span className="noc-status-dot" style={{ background: sc.color }} />
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
      <td>
        <span className="noc-ip">{device.ip}</span>
      </td>
      <td>
        <span className="noc-location">{device.loc}</span>
      </td>
      <td>
        <span className="noc-uptime">{device.uptime}</span>
      </td>
    </tr>
  );
}

export default function CentreDevicesView() {
  const { facilityCode } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [tooltip, setTooltip] = useState(null);

  const facility = facilities.find((f) => f.id === facilityCode);
  const stats = facility ? calcStats(facility) : null;

  useEffect(() => {
    document.title = facility
      ? `Century Cricket — ${facility.name} Centre Overview`
      : 'Century Cricket';
  }, [facility]);

  function matchesFilter(device) {
    if (filter === 'online' && device.status !== 'online') return false;
    if (filter === 'offline' && device.status !== 'offline') return false;
    if (filter === 'warnings' && device.status !== 'warning') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!device.name.toLowerCase().includes(q) && !device.ip.toLowerCase().includes(q)) return false;
    }
    return true;
  }

  if (!facility)
    return (
      <div className="noc-page" style={{ padding: 40 }}>
        Facility not found.
      </div>
    );

  return (
    <div className="noc-page">
      <NOCHeader title={facility.name} subtitle={facility.location} backPath="/noc" showTime={false} />
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
            {stats.batting} batting · {stats.hybrid} hybrid
          </div>
        </div>
      </div>

      <div className="noc-facility-content">
        {/* Stats bar */}

        {/* Devices table */}
        <div className="noc-devices-section">
          <div className="noc-devices-header">
            <h2 className="noc-devices-title">All Devices</h2>
            <div className="noc-devices-controls">
              <div className="noc-search">
                <Search size={14} />
                <input placeholder="Search device / IP..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
              {/* Infrastructure */}
              {(() => {
                const rows = facility.infrastructure.filter(matchesFilter);
                if (rows.length === 0) return null;
                return (
                  <>
                    <tr className="noc-group-header">
                      <td colSpan={7}>Infrastructure &amp; Servers — {facility.infrastructure.length} Devices</td>
                    </tr>
                    {rows.map((device, i) => (
                      <DeviceRow key={i} device={device} setTooltip={setTooltip} />
                    ))}
                  </>
                );
              })()}

              {/* Lanes */}
              {facility.lanes.map((lane) => {
                const rows = lane.devices.filter(matchesFilter);
                if (rows.length === 0) return null;
                return (
                  <Fragment key={lane.id}>
                    <tr
                      className="noc-group-header noc-group-lane"
                      onClick={() => navigate(`/noc/${facility.id}/${lane.id}`)}
                    >
                      <td colSpan={7}>
                        {lane.name} — {lane.type} — {lane.devices.length} Devices
                        <span className="noc-group-arrow">↗</span>
                      </td>
                    </tr>
                    {rows.map((device, i) => (
                      <DeviceRow
                        key={i}
                        device={device}
                        setTooltip={setTooltip}
                        onClick={() => navigate(`/noc/${facility.id}/${lane.id}`)}
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
            <span className="noc-tooltip-label">IP</span>
            <span className="noc-tooltip-val">{tooltip.device.ip}</span>
          </div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Interface</span>
            <span className="noc-tooltip-val">{tooltip.device.iface.toLowerCase()}</span>
          </div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Location</span>
            <span className="noc-tooltip-val">{tooltip.device.loc}</span>
          </div>
          <div className="noc-tooltip-row">
            <span className="noc-tooltip-label">Uptime</span>
            <span className="noc-tooltip-val">{tooltip.device.uptime}</span>
          </div>
        </div>
      )}
    </div>
  );
}
