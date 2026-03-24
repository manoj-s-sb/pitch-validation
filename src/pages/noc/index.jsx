import { useState, useEffect } from 'react';
import { Flag, Activity, Server, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import LaneCard from './components/LaneCard';
import { facilities } from './data';
import './noc.css';

function getAllStats(facilityList) {
  let totalLanes = 0;
  let online = 0;
  let offline = 0;
  let warning = 0;
  let totalDevices = 0;
  let onlineDevices = 0;

  facilityList.forEach((f) => {
    f.lanes.forEach((lane) => {
      totalLanes++;
      const hasOff = lane.devices.some((d) => d.status === 'offline');
      const hasWarn = lane.devices.some((d) => d.status === 'warning');
      if (hasOff) offline++;
      else if (hasWarn) warning++;
      else online++;
      lane.devices.forEach((d) => {
        totalDevices++;
        if (d.status === 'online') onlineDevices++;
      });
    });
  });

  return { totalLanes, online, offline, warning, totalDevices, onlineDevices };
}

function getFacilityStats(facility) {
  let online = 0;
  let offline = 0;
  let warning = 0;
  facility.lanes.forEach((lane) => {
    const hasOff = lane.devices.some((d) => d.status === 'offline');
    const hasWarn = lane.devices.some((d) => d.status === 'warning');
    if (hasOff) offline++;
    else if (hasWarn) warning++;
    else online++;
  });
  return { total: facility.lanes.length, online, offline, warning };
}

export default function NocPage() {
  const [activeTab, setActiveTab] = useState(facilities[0]?.id || '');
  const [lastUpdated, setLastUpdated] = useState(new Date());

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

  const global = getAllStats(facilities);

  return (
    <div className="noc-page">
      {/* Top bar */}
      <div className="noc-topbar">
        <div className="noc-topbar-left">
          <Activity size={22} className="noc-topbar-icon" />
          <div>
            <h1 className="noc-topbar-title">Network Operations Center</h1>
            <p className="noc-topbar-sub">Cricket Facility Monitoring</p>
          </div>
        </div>
        <div className="noc-topbar-right">
          <div className="noc-live-pill">
            <span className="noc-live-dot" />
            LIVE
          </div>
          <span className="noc-topbar-time">{timeStr}</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="noc-summary">
        <div className="noc-summary-card">
          <Server size={18} className="noc-summary-icon" />
          <div className="noc-summary-info">
            <span className="noc-summary-value">{global.totalLanes}</span>
            <span className="noc-summary-label">Total Lanes</span>
          </div>
        </div>
        <div className="noc-summary-card noc-summary-online">
          <Wifi size={18} className="noc-summary-icon" />
          <div className="noc-summary-info">
            <span className="noc-summary-value">{global.online}</span>
            <span className="noc-summary-label">Online</span>
          </div>
        </div>
        <div className="noc-summary-card noc-summary-offline">
          <WifiOff size={18} className="noc-summary-icon" />
          <div className="noc-summary-info">
            <span className="noc-summary-value">{global.offline}</span>
            <span className="noc-summary-label">Offline</span>
          </div>
        </div>
        <div className="noc-summary-card noc-summary-warning">
          <AlertTriangle size={18} className="noc-summary-icon" />
          <div className="noc-summary-info">
            <span className="noc-summary-value">{global.warning}</span>
            <span className="noc-summary-label">Warning</span>
          </div>
        </div>
      </div>

      {/* Facility tabs */}
      <div className="noc-tabs-bar">
        {facilities.map((f) => {
          const stats = getFacilityStats(f);
          return (
            <button
              key={f.id}
              className={`noc-tab ${activeTab === f.id ? 'active' : ''}`}
              onClick={() => setActiveTab(f.id)}
            >
              <Flag size={14} />
              <span className="noc-tab-name">{f.name}</span>
              <span className="noc-tab-count">{stats.total} lanes</span>
              {stats.offline > 0 && <span className="noc-tab-badge noc-tab-badge-red">{stats.offline}</span>}
              {stats.warning > 0 && <span className="noc-tab-badge noc-tab-badge-yellow">{stats.warning}</span>}
            </button>
          );
        })}
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
                  <span className="noc-stat">{stats.total} Lanes</span>
                  <span className="noc-stat noc-stat-green">{stats.online} Online</span>
                  {stats.offline > 0 && <span className="noc-stat noc-stat-red">{stats.offline} Offline</span>}
                  {stats.warning > 0 && <span className="noc-stat noc-stat-yellow">{stats.warning} Warning</span>}
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
