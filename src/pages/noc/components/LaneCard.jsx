import { Zap, Camera, Monitor, Tablet } from 'lucide-react';

const iconMap = {
  zap: Zap,
  camera: Camera,
  monitor: Monitor,
  tablet: Tablet,
};

const statusColor = {
  online: '#22c55e',
  offline: '#ef4444',
  warning: '#f59e0b',
};

function getLaneStatus(devices) {
  const hasOffline = devices.some((d) => d.status === 'offline');
  const hasWarning = devices.some((d) => d.status === 'warning');
  if (hasOffline) return 'offline';
  if (hasWarning) return 'warning';
  return 'online';
}

function getLaneStatusLabel(devices) {
  const offline = devices.filter((d) => d.status === 'offline').length;
  const warning = devices.filter((d) => d.status === 'warning').length;
  if (offline === 0 && warning === 0) return { text: 'All Systems Online', color: '#22c55e' };
  const parts = [];
  if (offline > 0) parts.push({ text: `${offline} Offline`, color: '#ef4444' });
  if (warning > 0) parts.push({ text: `${warning} Warning`, color: '#f59e0b' });
  return parts;
}

export default function LaneCard({ lane }) {
  const laneStatus = getLaneStatus(lane.devices);
  const statusLabel = getLaneStatusLabel(lane.devices);
  const isAllGood = !Array.isArray(statusLabel);

  return (
    <div className={`noc-lane-card noc-lane-${laneStatus}`}>
      <div className="noc-lane-header">
        <div className="noc-lane-title">
          <span className="noc-lane-name">{lane.name}</span>
          <span className="noc-lane-type">{lane.type}</span>
        </div>
        <div className="noc-lane-status-label">
          {isAllGood ? (
            <span style={{ color: statusLabel.color, fontSize: 12, fontWeight: 600 }}>
              <span className="noc-dot" style={{ background: statusLabel.color }} />
              {statusLabel.text}
            </span>
          ) : (
            statusLabel.map((s, i) => (
              <span key={i} style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>
                <span className="noc-dot" style={{ background: s.color }} />
                {s.text}
              </span>
            ))
          )}
        </div>
      </div>
      <div className="noc-device-grid">
        {lane.devices.map((device, i) => {
          const Icon = iconMap[device.icon] || Monitor;
          return (
            <div key={i} className="noc-device">
              <Icon size={14} strokeWidth={1.6} className="noc-device-icon" />
              <span className="noc-device-name">{device.name}</span>
              <span className="noc-dot" style={{ background: statusColor[device.status] }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
