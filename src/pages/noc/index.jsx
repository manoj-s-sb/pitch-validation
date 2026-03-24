import { useState, useEffect } from 'react';
import { Flag } from 'lucide-react';
import LaneCard from './components/LaneCard';
import { facilities } from './data';
import './noc.css';

function getFacilityStats(facility) {
  let online = 0;
  let offline = 0;
  let warning = 0;
  facility.lanes.forEach((lane) => {
    const hasOffline = lane.devices.some((d) => d.status === 'offline');
    const hasWarning = lane.devices.some((d) => d.status === 'warning');
    if (hasOffline) offline++;
    else if (hasWarning) warning++;
    else online++;
  });
  return { total: facility.lanes.length, online, offline, warning };
}

export default function NocPage() {
  const [activeTab, setActiveTab] = useState(facilities[0]?.id || '');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh timestamp every 30s
  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = lastUpdated.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="noc-page">
      {/* Page header */}
      <div className="noc-page-header">
        <div>
          <h1 className="noc-title">Network Operations Center</h1>
          <p className="noc-subtitle">Cricket Facility Monitoring — All Systems</p>
        </div>
        <div className="noc-live-badge">
          <span className="noc-live-dot" />
          <span className="noc-live-text">LIVE</span>
          <span className="noc-live-time">Last updated: {timeStr}</span>
        </div>
      </div>

      {/* Facility tabs */}
      <div className="noc-tabs">
        {facilities.map((f) => (
          <button
            key={f.id}
            className={`noc-tab ${activeTab === f.id ? 'active' : ''}`}
            onClick={() => setActiveTab(f.id)}
          >
            <Flag size={14} />
            {f.name}
          </button>
        ))}
      </div>

      {/* Facility content */}
      {facilities
        .filter((f) => f.id === activeTab)
        .map((facility) => {
          const stats = getFacilityStats(facility);
          return (
            <div key={facility.id} className="noc-facility">
              <div className="noc-facility-header">
                <h2 className="noc-facility-name">{facility.name}</h2>
                <div className="noc-facility-stats">
                  <span>{stats.total} Lanes</span>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{stats.online} Online</span>
                  {stats.offline > 0 && (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{stats.offline} Offline</span>
                  )}
                  {stats.warning > 0 && (
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>{stats.warning} Warning</span>
                  )}
                </div>
              </div>

              <div className="noc-lane-grid">
                {facility.lanes.map((lane) => (
                  <LaneCard key={lane.id} lane={lane} />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
