import { useCallback, useEffect, useRef } from 'react';
import { FilePlus, Trash2, FileText, Plus, Play, Download, Table } from 'lucide-react';

export default function BulkUpload({
  files,
  onToggleFile,
  onToggleSelectAll,
  onRemoveFile,
  onAddFiles,
  onStartView,
  onGenerateReport,
  onTableView,
}) {
  const dropZoneRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.remove('drag-over');
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => f.name.toLowerCase().endsWith('.csv'));
      if (droppedFiles.length > 0) onAddFiles(droppedFiles);
    },
    [onAddFiles],
  );

  useEffect(() => {
    const zone = dropZoneRef.current;
    if (!zone) return;
    zone.addEventListener('dragenter', handleDragOver);
    zone.addEventListener('dragover', handleDragOver);
    zone.addEventListener('dragleave', handleDragLeave);
    zone.addEventListener('drop', handleDrop);
    return () => {
      zone.removeEventListener('dragenter', handleDragOver);
      zone.removeEventListener('dragover', handleDragOver);
      zone.removeEventListener('dragleave', handleDragLeave);
      zone.removeEventListener('drop', handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  const allChecked = files.length > 0 && files.every((f) => f.checked);
  const checkedCount = files.filter((f) => f.checked).length;

  const handleFileInput = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) onAddFiles(selected);
    e.target.value = '';
  };

  return (
    <div ref={dropZoneRef} style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        {files.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--surface)', border: '2px dashed var(--border-solid)',
            borderRadius: 16, color: 'var(--text-dim)',
          }}>
            <FilePlus size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>No files added yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Drag &amp; drop CSV files here or click &quot;Add Files&quot;</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', marginBottom: 12 }}>
              <input
                type="checkbox" checked={allChecked}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dim)', cursor: 'pointer' }}>
                Select All
              </label>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-dim)' }}>
                {checkedCount} of {files.length} selected
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
              {files.map((file, i) => {
                const shortName = file.name.replace(/\.csv$/i, '');
                return (
                  <div
                    key={file.name + i}
                    style={{
                      position: 'relative', background: 'var(--surface)',
                      border: `2px solid ${file.checked ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 16, padding: '20px 12px 14px', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)',
                      ...(file.checked ? { boxShadow: '0 0 0 3px var(--accent-glow)' } : {}),
                    }}
                    onClick={() => onToggleFile(i, !file.checked)}
                  >
                    <input
                      type="checkbox" checked={file.checked}
                      onChange={(e) => { e.stopPropagation(); onToggleFile(i, !file.checked); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', top: 10, left: 10, width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveFile(i); }}
                      style={{
                        position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
                        cursor: 'pointer', color: 'var(--text-dim)', padding: 4, borderRadius: 6,
                        transition: 'all 0.2s', lineHeight: 0,
                      }}
                      title="Remove"
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-dim)'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <div style={{
                      width: 52, height: 52, margin: '0 auto 10px', background: 'var(--surface2)',
                      borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border)',
                    }}>
                      <FileText size={26} style={{ color: 'var(--doc)' }} />
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-word',
                      lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }} title={file.name}>
                      {shortName}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="upload-csv-btn"
          onClick={() => document.getElementById('bulkFileInput').click()}
          style={{ padding: '10px 24px' }}>
          <Plus size={16} /> Add Files
        </button>
        <input type="file" id="bulkFileInput" accept=".csv" multiple style={{ display: 'none' }} onChange={handleFileInput} />

        {files.length > 0 && (
          <>
            <button className="upload-csv-btn" onClick={onStartView}
              style={{ padding: '10px 24px', background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }}>
              <Play size={16} /> Show Pitch Map
            </button>
            <button className="upload-csv-btn" onClick={onGenerateReport}
              style={{ padding: '10px 24px', ...(checkedCount === 0 ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
              disabled={checkedCount === 0}>
              <Download size={16} /> Generate Report ({checkedCount})
            </button>
            <button className="upload-csv-btn" onClick={onTableView}
              style={{ padding: '10px 24px', ...(checkedCount === 0 ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
              disabled={checkedCount === 0}>
              <Table size={16} /> Table View ({checkedCount})
            </button>
          </>
        )}
      </div>
    </div>
  );
}
