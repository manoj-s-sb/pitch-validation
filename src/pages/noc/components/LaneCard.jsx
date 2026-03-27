import {  CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';


const statusConfig = {
  online:  { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   icon: CheckCircle2, label: 'Online'  },
  offline: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   icon: XCircle,      label: 'Offline' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  icon: AlertTriangle, label: 'Warning' },
};

function getLaneOverall(devices) {
  if (devices.some(d => d.status === 'offline')) return 'offline';
  if (devices.some(d => d.status === 'warning')) return 'warning';
  return 'online';
}

export default function LaneCard({ lane, onClick }) {
  const overall = getLaneOverall(lane.devices);
  const cfg = statusConfig[overall];
  const onlineCount = lane.devices.filter(d => d.status === 'online').length;
  const issueDevices = lane.devices.filter(d => d.status !== 'online');

  return (
    <div className="noc-card" onClick={onClick}>
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
              : `${issueDevices.filter(d => d.status === overall).length} ${cfg.label}`}
          </div>
        </div>

        {/* Health bar */}
        <div className="noc-card-healthbar">
          <div
            className="noc-card-healthbar-fill"
            style={{ width: `${(onlineCount / lane.devices.length) * 100}%`, background: cfg.color }}
          />
        </div>
        <div className="noc-card-health-label">
          {onlineCount}/{lane.devices.length} systems operational
        </div>


      </div>
    </div>
  );
}
