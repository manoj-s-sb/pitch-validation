import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, Network, Server, Wifi, Monitor, Zap, Tablet, Camera } from 'lucide-react';
import './CentreCard.css';

const iconMap = {
  switch: Network,
  server: Server,
  router: Wifi,
  monitor: Monitor,
  zap: Zap,
  tablet: Tablet,
  camera: Camera,
};

const statusDot = { online: '#22c55e', offline: '#ef4444', warning: '#f59e0b' };

function getCentreStatus(facility) {
  const all = [...facility.infrastructure, ...facility.lanes.flatMap((l) => l.devices)];
  const offline = all.filter((d) => d.status === 'offline').length;
  const warning = all.filter((d) => d.status === 'warning').length;
  if (offline > 0) return { label: 'Has Issues', color: '#ef4444', badgeBg: '#fef2f2', border: '#ef4444' };
  if (warning > 0) return { label: 'Warning', color: '#f59e0b', badgeBg: '#fffbeb', border: '#f59e0b' };
  return { label: 'Operational', color: '#16a34a', badgeBg: '#f0fdf4', border: '#22c55e' };
}

export default function CentreCard({ facility }) {
  const navigate = useNavigate();
  const status = getCentreStatus(facility);

  const allDevices = [...facility.infrastructure, ...facility.lanes.flatMap((l) => l.devices)];
  const online = allDevices.filter((d) => d.status === 'online').length;
  const offline = allDevices.filter((d) => d.status === 'offline').length;
  const warnings = allDevices.filter((d) => d.status === 'warning').length;

  const alertParts = [
    offline > 0 && `${offline} device${offline > 1 ? 's' : ''} offline`,
    warnings > 0 && `${warnings} warning${warnings > 1 ? 's' : ''} detected`,
  ].filter(Boolean);

  return (
    <div className="cc-card" style={{ borderLeftColor: status.border }} onClick={() => navigate(`/noc/${facility.id}`)}>
      {/* Header */}
      <div className="cc-header">
        <div className="cc-avatar" style={{ background: facility.avatarColor + '22', color: facility.avatarColor }}>
          {facility.shortCode}
        </div>
        <div className="cc-info">
          <div className="cc-name">{facility.name}</div>
          <div className="cc-location">
            <MapPin size={11} />
            {facility.location}
          </div>
        </div>
        <div className="cc-status-badge" style={{ color: status.color, background: status.badgeBg }}>
          {status.label}
        </div>
      </div>

      {/* Stats row */}
      <div className="cc-stats">
        <div className="cc-stat">
          <div className="cc-stat-val">{facility.lanes.length}</div>
          <div className="cc-stat-lbl">Lanes</div>
        </div>
        <div className="cc-stat">
          <div className="cc-stat-val">{allDevices.length}</div>
          <div className="cc-stat-lbl">Devices</div>
        </div>
        <div className="cc-stat">
          <div className="cc-stat-val cc-val-green">{online}</div>
          <div className="cc-stat-lbl">Online</div>
        </div>
        <div className="cc-stat">
          <div className={`cc-stat-val${offline > 0 ? ' cc-val-red' : ''}`}>{offline}</div>
          <div className="cc-stat-lbl">Offline</div>
        </div>
        <div className="cc-stat">
          <div className={`cc-stat-val${warnings > 0 ? ' cc-val-orange' : ''}`}>{warnings}</div>
          <div className="cc-stat-lbl">Warnings</div>
        </div>
      </div>

      {/* Alert strip */}
      {alertParts.length > 0 && (
        <div className="cc-alert">
          <AlertCircle size={13} />
          {alertParts.join(' · ')}
        </div>
      )}

      {/* Lane rows */}
      <div className="cc-lanes">
        {facility.lanes.map((lane) => {
          const up = lane.devices.filter((d) => d.status === 'online').length;
          const down = lane.devices.filter((d) => d.status === 'offline').length;
          const warn = lane.devices.filter((d) => d.status === 'warning').length;
          return (
            <div
              key={lane.id}
              className="cc-lane-row"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/noc/${facility.id}`);
              }}
            >
              <span className={`cc-lane-type cc-lane-${lane.type.toLowerCase()}`}>{lane.type}</span>
              <span className="cc-lane-name">{lane.name}</span>
              <div className="cc-lane-counts">
                {up > 0 && <span className="cc-up">• {up} up</span>}
                {down > 0 && <span className="cc-down">• {down} down</span>}
                {warn > 0 && <span className="cc-warn">• {warn} warn</span>}
              </div>
              <div className="cc-lane-icons">
                {lane.devices.map((d, i) => {
                  const Icon = iconMap[d.icon] || Monitor;
                  return (
                    <div key={i} className="cc-dev-icon" title={d.name}>
                      <Icon size={13} strokeWidth={1.8} />
                      <span className="cc-dev-dot" style={{ background: statusDot[d.status] }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {/* <div className="cc-footer">
        <button
          className="cc-topology-btn"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          View Topology →
        </button>
        <span className="cc-updated">Updated just now</span>
      </div> */}
    </div>
  );
}
