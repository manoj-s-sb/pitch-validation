import { Activity } from 'lucide-react';
import { facilities } from '../data';
import CentreCard from '../components/CentreCard';
import NOCHeader from '../../../components/NOCHeader';
import '../noc.css';

function getGlobalStats(facilityList) {
  const allDevices = facilityList.flatMap((f) => [...f.infrastructure, ...f.lanes.flatMap((l) => l.devices)]);
  return {
    centres: facilityList.length,
    totalLanes: facilityList.reduce((s, f) => s + f.lanes.length, 0),
    total: allDevices.length,
    online: allDevices.filter((d) => d.status === 'online').length,
    offline: allDevices.filter((d) => d.status === 'offline').length,
    warnings: allDevices.filter((d) => d.status === 'warning').length,
  };
}

export default function MultiCentreView() {
  const stats = getGlobalStats(facilities);

  return (
    <div className="noc-page">
      <NOCHeader title="Century Cricket — NOC Operations" icon={Activity} showTime={true} />

      {/* Global stats bar */}
      <div className="mc-stats-bar">
        <div className="mc-stat-cell">
          <div className="mc-stat-label">Centres</div>
          <div className="mc-stat-value">{stats.centres}</div>
          <div className="mc-stat-sub">Operational facilities</div>
        </div>
        <div className="mc-stat-cell">
          <div className="mc-stat-label">Total Lanes</div>
          <div className="mc-stat-value">{stats.totalLanes}</div>
          <div className="mc-stat-sub">Batting + Hybrid</div>
        </div>
        <div className="mc-stat-cell">
          <div className="mc-stat-label">Devices Online</div>
          <div className="mc-stat-value mc-val-green">{stats.online}</div>
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
          {facilities.map((f) => (
            <CentreCard key={f.id} facility={f} />
          ))}
        </div>
      </div>
    </div>
  );
}
