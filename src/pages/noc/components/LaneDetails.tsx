import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, AlertTriangle, Monitor, Tablet, Camera, Zap } from 'lucide-react';
import './LaneDetails.css';
import { facilities } from '../data';

const LaneDetials = () => {
  const { facilityCode, laneId } = useParams();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const facility = facilities.find(f => f.id === facilityCode);
  const lane = facility?.lanes.find(l => l.id.toString() === laneId);

  return (
    <div className="lane-details-page">
      {/* Header Info */}
      <div className="ld-header-top">
        <button className="ld-back-btn" onClick={() => navigate('/noc')}>
          <ArrowLeft size={16} />
          <span>{facility?.name || 'India Facility'} / <strong>{lane?.name || 'Lane 7'}</strong></span>
        </button>
        <div className="ld-live-indicator">
          <span className="ld-live-dot"></span>
          LIVE <span>{timeStr}</span>
        </div>
      </div>

      {/* Main Title */}
      <div className="ld-title-row">
        <div className="ld-title-left">
          <h1>{lane?.name || 'Lane 7'}</h1>
          <span className="ld-tag-hybrid">{lane?.type || 'Hybrid'}</span>
        </div>
        <div className="ld-issues-btn">
          <span className="ld-issues-dot"></span>
          2 Issues Detected
        </div>
      </div>

      {/* Metric Cards */}
      <div className="ld-metrics-grid">
        <div className="ld-metric-card">
          <div className="ld-metric-label">Uptime</div>
          <div className="ld-metric-value">98.7%</div>
          <div className="ld-metric-sub">Last 30 days</div>
        </div>
        <div className="ld-metric-card">
          <div className="ld-metric-label">Sessions Today</div>
          <div className="ld-metric-value">24</div>
          <div className="ld-metric-sub ld-text-green">+3 vs yesterday</div>
        </div>
        <div className="ld-metric-card">
          <div className="ld-metric-label">Avg Session</div>
          <div className="ld-metric-value">42 min</div>
          <div className="ld-metric-sub">Normal range</div>
        </div>
        <div className="ld-metric-card ld-metric-issues">
          <div className="ld-metric-label ld-text-red">Active Issues</div>
          <div className="ld-metric-value ld-text-red">2</div>
          <div className="ld-metric-sub ld-text-red">Bowling Machine</div>
        </div>
      </div>

      {/* Server Details */}
      <div className="ld-section">
        <h2 className="ld-section-title">Server Details</h2>
        <div className="ld-server-card">
          <div className="ld-server-header">
            <div className="ld-server-title">
              <Server size={18} /> Lane Server
            </div>
            <div className="ld-status-green"><span className="ld-status-dot"></span> ONLINE</div>
          </div>
          <div className="ld-server-stats">
            <div className="ld-stat-row"><span>IP Address</span><strong>192.168.1.10</strong></div>
            <div className="ld-stat-row"><span>CPU Usage</span><strong className="ld-text-green">34%</strong></div>
            <div className="ld-stat-row"><span>Memory</span><strong>12.4 / 32 GB (39%)</strong></div>
            <div className="ld-stat-row"><span>Disk</span><strong>186 / 500 GB (37%)</strong></div>
            <div className="ld-stat-row"><span>Uptime</span><strong className="ld-text-green">14d 7h 32m</strong></div>
            <div className="ld-stat-row"><span>OS Version</span><strong>Ubuntu 22.04 LTS</strong></div>
            <div className="ld-stat-row"><span>Network</span><strong className="ld-text-green">1 Gbps (eth0)</strong></div>
            <div className="ld-stat-row"><span>Active Services</span><strong className="ld-text-green">7 / 7 running</strong></div>
            <div className="ld-stat-row"><span>Last Restart</span><strong>2026-03-10 02:00</strong></div>
          </div>
        </div>
      </div>

      {/* Equipment Details */}
      <div className="ld-section">
        <h2 className="ld-section-title">Equipment Details</h2>
        <div className="ld-equipment-grid">

          <div className="ld-eq-card">
            <div className="ld-eq-header ld-eq-offline">
              <div className="ld-eq-title"><Zap size={16}/> Bowling Machine</div>
              <div className="ld-status-red"><span className="ld-status-dot"></span> OFFLINE</div>
            </div>
            <div className="ld-eq-body">
              <div className="ld-eq-row"><span>IP Address</span><strong>192.168.1.107</strong></div>
              <div className="ld-eq-row"><span>Last Calibrated</span><strong>2026-03-20 09:15</strong></div>
              <div className="ld-eq-row"><span>Angles</span><strong>Pitch: 12° / Yaw: 3°</strong></div>
              <div className="ld-eq-row"><span>Model</span><strong>BM-Pro 3000</strong></div>
              <div className="ld-eq-row"><span>Speed Range</span><strong>60-150 km/h</strong></div>
              <div className="ld-eq-alert">
                <AlertTriangle size={14}/>
                <div>Motor overheating -<br/>shutdown triggered at 14:28:03</div>
              </div>
            </div>
          </div>

          <div className="ld-eq-card">
            <div className="ld-eq-header">
              <div className="ld-eq-title"><Camera size={16}/> CV Left Camera</div>
              <div className="ld-status-green"><span className="ld-status-dot"></span> ONLINE</div>
            </div>
            <div className="ld-eq-body">
              <div className="ld-eq-row"><span>IP Address</span><strong>192.168.1.121</strong></div>
              <div className="ld-eq-row"><span>Last Calibrated</span><strong>2026-03-22 11:30</strong></div>
              <div className="ld-eq-row"><span>Angles</span><strong>Pan: -5° / Tilt: 15°</strong></div>
              <div className="ld-eq-row"><span>Resolution</span><strong>1920x1080 @ 60fps</strong></div>
              <div className="ld-eq-row"><span>FPS Current</span><strong className="ld-text-green">58.4</strong></div>
            </div>
          </div>

          <div className="ld-eq-card">
            <div className="ld-eq-header">
              <div className="ld-eq-title"><Camera size={16}/> CV Right Camera</div>
              <div className="ld-status-green"><span className="ld-status-dot"></span> ONLINE</div>
            </div>
            <div className="ld-eq-body">
              <div className="ld-eq-row"><span>IP Address</span><strong>192.168.1.122</strong></div>
              <div className="ld-eq-row"><span>Last Calibrated</span><strong>2026-03-22 11:32</strong></div>
              <div className="ld-eq-row"><span>Angles</span><strong>Pan: 5° / Tilt: 15°</strong></div>
              <div className="ld-eq-row"><span>Resolution</span><strong>1920x1080 @ 60fps</strong></div>
              <div className="ld-eq-row"><span>FPS Current</span><strong className="ld-text-green">59.1</strong></div>
            </div>
          </div>

          <div className="ld-eq-card">
            <div className="ld-eq-header">
              <div className="ld-eq-title"><Monitor size={16}/> Display</div>
              <div className="ld-status-green"><span className="ld-status-dot"></span> ONLINE</div>
            </div>
            <div className="ld-eq-body">
              <div className="ld-eq-row"><span>IP Address</span><strong>192.168.1.130</strong></div>
              <div className="ld-eq-row"><span>Resolution</span><strong>3840x2160</strong></div>
              <div className="ld-eq-row"><span>Brightness</span><strong>85%</strong></div>
              <div className="ld-eq-row"><span>Content Source</span><strong>CV Feed + Overlay</strong></div>
              <div className="ld-eq-row"><span>Uptime</span><strong className="ld-text-green">47h 22m</strong></div>
            </div>
          </div>

          <div className="ld-eq-card">
            <div className="ld-eq-header">
              <div className="ld-eq-title"><Tablet size={16}/> Tablets</div>
              <div className="ld-status-green"><span className="ld-status-dot"></span> ONLINE</div>
            </div>
            <div className="ld-eq-body">
              <div className="ld-eq-row"><span>IP Address</span><strong>192.168.1.151</strong></div>
              <div className="ld-eq-row"><span>Connected Devices</span><strong className="ld-text-green">2 / 2</strong></div>
              <div className="ld-eq-row"><span>Battery</span><strong>78% / 91%</strong></div>
              <div className="ld-eq-row"><span>App Version</span><strong>v2.8.0</strong></div>
              <div className="ld-eq-row"><span>Last Sync</span><strong>2 min ago</strong></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LaneDetials;
