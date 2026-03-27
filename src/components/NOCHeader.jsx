import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../pages/noc/noc.css';

export default function NOCHeader({ title, subtitle, icon: Icon, backPath, showTime = false }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

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
        {Icon && <Icon size={20} className="noc-topbar-icon" />}
        <div>
          <div className="noc-topbar-title">{title}</div>
          {subtitle && <div className="noc-topbar-sub">{subtitle}</div>}
        </div>
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
