import { useEffect, useCallback, useRef } from 'react';
import { Map, Table, FileDown, Download, X } from 'lucide-react';

export default function Modal({
  isOpen,
  title,
  titleContent,
  children,
  onClose,
  showPitchMapBtn,
  showCsvTableBtn,
  showReportBtn,
  showDownloadBtn,
  reportBtnLabel,
  reportBtnDisabled,
  onPitchMap,
  onCsvTable,
  onReport,
  onDownload,
}) {
  const modalBodyRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Pause video/audio when modal closes (matches vanilla behavior)
  useEffect(() => {
    if (!isOpen && modalBodyRef.current) {
      const video = modalBodyRef.current.querySelector('video');
      const audio = modalBodyRef.current.querySelector('audio');
      if (video) video.pause();
      if (audio) audio.pause();
    }
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={handleOverlayClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title">{titleContent || title}</div>
          <div className="actions">
            {showPitchMapBtn && (
              <button onClick={onPitchMap}>
                <Map size={16} /> Pitch Mapping
              </button>
            )}
            {showCsvTableBtn && (
              <button onClick={onCsvTable}>
                <Table size={16} /> Table View
              </button>
            )}
            {showReportBtn && (
              <button onClick={onReport} style={reportBtnDisabled ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
                <FileDown size={16} /> {reportBtnLabel || 'Generate Report'}
              </button>
            )}
            {showDownloadBtn && (
              <button onClick={onDownload}>
                <Download size={16} /> Download
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="modal-body" ref={modalBodyRef}>
          {children}
        </div>
      </div>
    </div>
  );
}
