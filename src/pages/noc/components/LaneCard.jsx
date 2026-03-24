import { Zap, Camera, Monitor, Tablet, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const iconMap = {
  zap: Zap,
  camera: Camera,
  monitor: Monitor,
  tablet: Tablet,
};

const statusConfig = {
  online: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', icon: CheckCircle2, label: 'Online' },
  offline: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', icon: XCircle, label: 'Offline' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: AlertTriangle, label: 'Warning' },
};

function getLaneOverall(devices) {
  const off = devices.filter((d) => d.status === 'offline').length;
  const warn = devices.filter((d) => d.status === 'warning').length;
  if (off > 0) return 'offline';
  if (warn > 0) return 'warning';
  return 'online';
}

export default function LaneCard({ lane }) {
  const overall = getLaneOverall(lane.devices);
  const cfg = statusConfig[overall];
  const onlineCount = lane.devices.filter((d) => d.status === 'online').length;

  return (
    <div className="noc-card">
      {/* Card top accent */}
      <div className="noc-card-accent" style={{ background: cfg.color }} />

      <div className="noc-card-body">
        {/* Header */}
        <div className="noc-card-header">
          <div className="noc-card-title-row">
            <h3 className="noc-card-name">{lane.name}</h3>
            <span className="noc-card-type">{lane.type}</span>
          </div>
          <div className="noc-card-status" style={{ color: cfg.color, background: cfg.bg }}>
            <cfg.icon size={13} />
            {overall === 'online'
              ? 'All Online'
              : `${lane.devices.filter((d) => d.status === overall).length} ${cfg.label}`}
          </div>
        </div>

        {/* Health bar */}
        <div className="noc-card-healthbar">
          <div className="noc-card-healthbar-fill" style={{ width: `${(onlineCount / lane.devices.length) * 100}%` }} />
        </div>
        <div className="noc-card-health-label">
          {onlineCount}/{lane.devices.length} systems operational
        </div>

        {/* Devices */}
        <div className="noc-card-devices">
          {lane.devices.map((device, i) => {
            const Icon = iconMap[device.icon] || Monitor;
            const st = statusConfig[device.status];
            return (
              <div key={i} className={`noc-card-device noc-card-device-${device.status}`}>
                <div className="noc-card-device-left">
                  <div className="noc-card-device-indicator" style={{ background: st.color }} />
                  <Icon size={15} strokeWidth={1.7} />
                  <span className="noc-card-device-name">{device.name}</span>
                </div>
                <span className="noc-card-device-badge" style={{ color: st.color, background: st.bg }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
