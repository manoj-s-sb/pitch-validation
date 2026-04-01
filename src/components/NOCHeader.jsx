import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import '../pages/noc/noc.css';

function useSyncAgo() {
  const syncedAt = useRef(new Date());
  const [label, setLabel] = useState('just now');

  useEffect(() => {
    const tick = () => {
      const secs = Math.floor((Date.now() - syncedAt.current) / 1000);
      if (secs < 60)       setLabel(`${secs}s ago`);
      else if (secs < 3600) setLabel(`${Math.floor(secs / 60)} min ago`);
      else                   setLabel(`${Math.floor(secs / 3600)} hr ago`);
    };
    tick();
    const t = setInterval(tick, 10000);
    return () => clearInterval(t);
  }, []);

  return label;
}

export default function NOCHeader({ title, subtitle, subtitleUppercase = false, logo, icon: Icon, backPath, showTime = false, showSync = false }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const syncLabel = useSyncAgo();

  useEffect(() => {
    if (!showTime) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [showTime]);

  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="noc-topbar">
      <div className="noc-topbar-left">
        {backPath && (
          <button className="noc-back-btn" onClick={() => navigate(backPath)}>
            <ArrowLeft size={16} />
          </button>
        )}
        {logo}
        {Icon && <Icon size={20} className="noc-topbar-icon" />}
        <div>
          <div className="noc-topbar-title">{title}</div>
          {subtitle && (
            <div className={`noc-topbar-sub${subtitleUppercase ? ' noc-topbar-sub-upper' : ''}`}>
              {subtitle}
            </div>
          )}
        </div>
        {showSync && (
          <div className="noc-sync-badge">
            <RefreshCw size={11} />
            Synced {syncLabel}
          </div>
        )}
      </div>

      {showTime && (
        <div className="noc-topbar-right">
          <div className="noc-live-pill">
            <span className="noc-live-dot" />
            LIVE
          </div>
          <div className="noc-topbar-time">
            <span>{timeStr}</span>
            <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
            <span>{dateStr}</span>
          </div>
        </div>
      )}
    </div>
  );
}
