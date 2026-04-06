import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AlertTriangle, Music, Download as DownloadIcon } from 'lucide-react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import FileList from './components/FileList';
import Modal from './components/Modal';
import CSVTable from './components/CSVTable';
import PitchMapping from './components/PitchMapping';
import BulkUpload from './components/BulkUpload';
import { SERVER, getExt, getFileType, parseDirectoryListing } from './utils/files';
import { generateSessionReportCSV, generateBulkReportCSV, downloadCSV } from './utils/reports';

const BASE_PATH = '/';

export default function App() {
  const [currentPath, setCurrentPath] = useState(BASE_PATH);
  const [allItems, setAllItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  const [currentCsvData, setCurrentCsvData] = useState(null);
  const [modalView, setModalView] = useState(null); // 'image' | 'video' | 'audio' | 'csv-table' | 'csv-pitchmap' | 'text' | 'pdf' | 'no-preview' | 'bulk-upload' | 'bulk-view'
  const [modalContent, setModalContent] = useState(null); // for text/other content

  // Bulk state
  const [bulkCsvFiles, setBulkCsvFiles] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [activeBulkIndex, setActiveBulkIndex] = useState(0);

  // Drag & drop
  const contentRef = useRef(null);

  // Fetch directory
  const navigate = useCallback(async (path) => {
    setCurrentPath(path);
    setSearchQuery('');
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.get(SERVER + path);
      const items = parseDirectoryListing(resp.data);
      setAllItems(items);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const goBack = useCallback(() => {
    let path = currentPath.replace(/\/$/, '');
    const lastSlash = path.lastIndexOf('/');
    path = lastSlash > 0 ? path.substring(0, lastSlash + 1) : '/';
    navigate(path);
  }, [currentPath, navigate]);

  // CSV upload (single)
  const handleCsvFileUpload = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      setCurrentCsvData(csvText);
      setCurrentFileUrl('');
      setModalTitle(file.name);
      setModalView('csv-pitchmap');
      setModalContent(csvText);
      setBulkMode(false);
      setModalOpen(true);
    };
    reader.readAsText(file);
  }, []);

  // Init
  useEffect(() => {
    navigate(BASE_PATH);
  }, [navigate]);

  // Drag & drop on main content
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const prevent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const dragOver = (e) => {
      prevent(e);
      content.classList.add('drag-over');
    };
    const dragLeave = (e) => {
      prevent(e);
      content.classList.remove('drag-over');
    };
    const drop = (e) => {
      prevent(e);
      content.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (!file || !file.name.toLowerCase().endsWith('.csv')) return;
      handleCsvFileUpload(file);
    };
    content.addEventListener('dragenter', dragOver);
    content.addEventListener('dragover', dragOver);
    content.addEventListener('dragleave', dragLeave);
    content.addEventListener('drop', drop);
    return () => {
      content.removeEventListener('dragenter', dragOver);
      content.removeEventListener('dragover', dragOver);
      content.removeEventListener('dragleave', dragLeave);
      content.removeEventListener('drop', drop);
    };
  }, [handleCsvFileUpload]);

  // File items
  const filteredItems = searchQuery
    ? allItems.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allItems;

  const dirs = filteredItems.filter((i) => i.isDir).length;
  const files = filteredItems.length - dirs;

  // Open file
  const openFile = useCallback(async (name, path) => {
    const url = SERVER + path;
    setCurrentFileUrl(url);
    setModalTitle(name);
    setCurrentCsvData(null);
    setBulkMode(false);

    const type = getFileType(name);
    const ext = getExt(name);

    if (type === 'image') {
      setModalView('image');
      setModalContent(url);
    } else if (type === 'video') {
      setModalView('video');
      setModalContent({ url, ext });
    } else if (type === 'audio') {
      setModalView('audio');
      setModalContent(url);
    } else if (ext === 'csv') {
      setModalView('csv-table');
      setModalContent('loading');
      setModalOpen(true);
      try {
        const resp = await axios.get(url, { responseType: 'text', transformResponse: [(d) => d] });
        setCurrentCsvData(resp.data);
        setModalContent(resp.data);
      } catch {
        setModalContent('error');
      }
      return;
    } else if (
      ['doc', 'code'].includes(type) &&
      [
        'txt',
        'log',
        'json',
        'xml',
        'md',
        'yaml',
        'yml',
        'py',
        'js',
        'html',
        'css',
        'sh',
        'sql',
        'java',
        'cpp',
        'c',
        'go',
        'rs',
      ].includes(ext)
    ) {
      setModalView('text');
      setModalContent('loading');
      setModalOpen(true);
      try {
        const resp = await axios.get(url);
        const text = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data, null, 2);
        setModalContent(text);
      } catch {
        setModalContent('error');
      }
      return;
    } else if (ext === 'pdf') {
      setModalView('pdf');
      setModalContent(url);
    } else {
      setModalView('no-preview');
      setModalContent(name);
    }

    setModalOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setCurrentCsvData(null);
    setBulkMode(false);
    setModalView(null);
    setModalContent(null);
  }, []);

  // Download
  const downloadFile = useCallback(() => {
    if (!currentFileUrl) return;
    const a = document.createElement('a');
    a.href = currentFileUrl;
    a.download = '';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [currentFileUrl]);

  const handleCsvUpload = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) return;
      handleCsvFileUpload(file);
      event.target.value = '';
    },
    [handleCsvFileUpload],
  );

  // Switch views for CSV
  const showPitchMapping = useCallback(() => {
    if (modalView === 'bulk-csv-table') {
      setModalView('bulk-view');
    } else if (currentCsvData) {
      setModalView('csv-pitchmap');
      setModalContent(currentCsvData);
    }
  }, [modalView, currentCsvData]);

  const showCsvTable = useCallback(() => {
    if (modalView === 'bulk-view') {
      setModalView('bulk-csv-table');
    } else if (currentCsvData) {
      setModalView('csv-table');
      setModalContent(currentCsvData);
    }
  }, [modalView, currentCsvData]);

  const showBulkCsvTable = useCallback(() => {
    const firstChecked = bulkCsvFiles.find((f) => f.checked);
    if (!firstChecked) return;
    setActiveBulkIndex(bulkCsvFiles.indexOf(firstChecked));
    setCurrentCsvData(firstChecked.data);
    setModalView('bulk-csv-table');
  }, [bulkCsvFiles]);

  // Session report
  const handleGenerateReport = useCallback(() => {
    const csv = generateSessionReportCSV(bulkMode, bulkCsvFiles, currentCsvData, modalTitle);
    if (csv) downloadCSV(csv, 'pitching_validation_report.csv');
  }, [bulkMode, bulkCsvFiles, currentCsvData, modalTitle]);

  // Bulk upload
  const openBulkUploadModal = useCallback(() => {
    setBulkCsvFiles([]);
    setBulkMode(true);
    setCurrentFileUrl('');
    setModalTitle('Bulk CSV Upload');
    setModalView('bulk-upload');
    setModalContent(null);
    setModalOpen(true);
  }, []);

  const addBulkFiles = useCallback((fileList) => {
    const files = Array.from(fileList);

    files.forEach((file) => {
      // Check for duplicates using current state via functional update
      setBulkCsvFiles((prev) => {
        if (prev.some((f) => f.name === file.name)) return prev;
        // Read file outside state updater
        const reader = new FileReader();
        reader.onload = (e) => {
          setBulkCsvFiles((prev2) => [...prev2, { name: file.name, data: e.target.result, checked: true }]);
        };
        reader.readAsText(file);
        return prev;
      });
    });
  }, []);

  const toggleBulkFile = useCallback((index, checked) => {
    setBulkCsvFiles((prev) => prev.map((f, i) => (i === index ? { ...f, checked } : f)));
  }, []);

  const toggleBulkSelectAll = useCallback((checked) => {
    setBulkCsvFiles((prev) => prev.map((f) => ({ ...f, checked })));
  }, []);

  const removeBulkFile = useCallback((index) => {
    setBulkCsvFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const startBulkView = useCallback(() => {
    if (bulkCsvFiles.length === 0) return;
    setModalView('bulk-view');
    setActiveBulkIndex(0);
    const file = bulkCsvFiles[0];
    setCurrentCsvData(file.data);
    setCurrentFileUrl('');
  }, [bulkCsvFiles]);

  const selectBulkCsv = useCallback(
    (index) => {
      setActiveBulkIndex(index);
      const file = bulkCsvFiles[index];
      if (file) {
        setCurrentCsvData(file.data);
        setCurrentFileUrl('');
      }
    },
    [bulkCsvFiles],
  );

  const toggleBulkFileCheck = useCallback((index, checked) => {
    setBulkCsvFiles((prev) => prev.map((f, i) => (i === index ? { ...f, checked } : f)));
  }, []);

  const handleBulkReport = useCallback(() => {
    const csv = generateBulkReportCSV(bulkCsvFiles);
    if (csv) downloadCSV(csv, 'pitching_validation_report.csv');
  }, [bulkCsvFiles]);

  // Compute modal button visibility
  const showPitchMapBtn = (modalView === 'csv-table' && currentCsvData && currentCsvData !== 'loading') || modalView === 'bulk-csv-table';
  const showCsvTableBtn = modalView === 'csv-pitchmap' || modalView === 'bulk-view';
  const showReportBtn = modalView === 'csv-pitchmap' || modalView === 'bulk-view' || modalView === 'bulk-csv-table';
  const showDownloadBtn = !bulkMode && modalView !== 'bulk-upload' && modalView !== 'bulk-view' && modalView !== 'bulk-csv-table' && currentFileUrl;

  const checkedCount = bulkCsvFiles.filter((f) => f.checked).length;
  const reportBtnLabel = (modalView === 'bulk-view' || modalView === 'bulk-csv-table') ? `Generate Report (${checkedCount})` : 'Generate Report';
  const reportBtnDisabled = (modalView === 'bulk-view' || modalView === 'bulk-csv-table') && checkedCount === 0;

  // Build bulk tabs title content
  const bulkTitleContent =
    (modalView === 'bulk-view' || modalView === 'bulk-csv-table') ? (
      <span
        style={{ display: 'flex', gap: 6, alignItems: 'center', overflowX: 'auto', maxWidth: '100%', paddingBottom: 4 }}
      >
        {bulkCsvFiles.map((file, i) => {
          const shortName = file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name;
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={file.checked}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleBulkFileCheck(i, !file.checked);
                }}
                style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <button
                className={`bulk-tab ${i === activeBulkIndex ? 'active' : ''}`}
                onClick={() => selectBulkCsv(i)}
                title={file.name}
              >
                {shortName}
              </button>
            </span>
          );
        })}
      </span>
    ) : null;

  // Render modal body content
  const renderModalBody = () => {
    switch (modalView) {
      case 'image':
        return (
          <img
            src={modalContent}
            alt={modalTitle}
            onError={(e) => {
              e.target.outerHTML = '<div class="no-preview">Failed to load image</div>';
            }}
          />
        );

      case 'video':
        return (
          <video controls autoPlay>
            <source
              src={modalContent.url}
              type={`video/${modalContent.ext === 'mkv' ? 'x-matroska' : modalContent.ext}`}
            />
            Your browser does not support this video format.
          </video>
        );

      case 'audio':
        return (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Music size={60} style={{ marginBottom: 20, color: 'var(--doc)' }} />
            <audio controls autoPlay src={modalContent} style={{ width: '100%', maxWidth: 400 }}>
              Your browser does not support audio playback.
            </audio>
          </div>
        );

      case 'csv-table':
        if (modalContent === 'loading') {
          return (
            <div className="no-preview">
              <div className="spinner" />
              <p style={{ marginTop: 12 }}>Loading CSV...</p>
            </div>
          );
        }
        if (modalContent === 'error') {
          return <div className="no-preview">Failed to load CSV file</div>;
        }
        return <CSVTable csvText={modalContent} />;

      case 'csv-pitchmap':
        return <PitchMapping csvText={modalContent} />;

      case 'text':
        if (modalContent === 'loading') {
          return (
            <div className="no-preview">
              <div className="spinner" />
              <p style={{ marginTop: 12 }}>Loading text content...</p>
            </div>
          );
        }
        if (modalContent === 'error') {
          return <div className="no-preview">Failed to load file content</div>;
        }
        return (
          <pre
            style={{
              background: 'var(--bg)',
              padding: 16,
              borderRadius: 8,
              overflow: 'auto',
              maxHeight: '70vh',
              maxWidth: '80vw',
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {modalContent}
          </pre>
        );

      case 'pdf':
        return <iframe src={modalContent} style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 8 }} />;

      case 'no-preview':
        return (
          <div className="no-preview">
            <p>
              <strong>{modalContent}</strong>
            </p>
            <p style={{ marginTop: 8 }}>No preview available for this file type</p>
            <button
              onClick={downloadFile}
              className="primary-btn"
              style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <DownloadIcon size={16} /> Download File
            </button>
          </div>
        );

      case 'bulk-upload':
        return (
          <BulkUpload
            files={bulkCsvFiles}
            onToggleFile={toggleBulkFile}
            onToggleSelectAll={toggleBulkSelectAll}
            onRemoveFile={removeBulkFile}
            onAddFiles={addBulkFiles}
            onStartView={startBulkView}
            onGenerateReport={handleBulkReport}
            onTableView={showBulkCsvTable}
          />
        );

      case 'bulk-view':
        return (
          <div style={{ width: '100%', alignSelf: 'stretch' }}>
            {currentCsvData && <PitchMapping csvText={currentCsvData} />}
          </div>
        );

      case 'bulk-csv-table': {
        const activeFile = bulkCsvFiles[activeBulkIndex];
        return activeFile ? <CSVTable csvText={activeFile.data} /> : null;
      }

      default:
        return null;
    }
  };

  return (
    <>
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        onGoBack={goBack}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCsvUpload={handleCsvUpload}
        onBulkUpload={openBulkUploadModal}
      />

      <Toolbar dirs={dirs} files={files} viewMode={viewMode} onSetView={setViewMode} />

      <div id="content" ref={contentRef}>
        {loading ? (
          <div className="status">
            <div className="spinner" />
            <div>{error ? 'Error' : 'Loading directory...'}</div>
          </div>
        ) : error ? (
          <div className="status">
            <AlertTriangle size={48} style={{ marginBottom: 16, color: 'var(--video)' }} />
            <div className="error">
              <p>
                <strong>Failed to load directory</strong>
              </p>
              <p style={{ marginTop: 8 }}>{error}</p>
              <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-dim)' }}>
                If you see a CORS error, serve this HTML from the same server
                <br />
                or configure the server to allow cross-origin requests.
              </p>
              <p style={{ marginTop: 12 }}>
                <button
                  onClick={() => navigate(currentPath)}
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Retry
                </button>
              </p>
            </div>
          </div>
        ) : (
          <FileList
            items={filteredItems}
            viewMode={viewMode}
            currentPath={currentPath}
            onNavigate={navigate}
            onOpenFile={openFile}
          />
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        title={modalTitle}
        titleContent={bulkTitleContent}
        onClose={closeModal}
        showPitchMapBtn={showPitchMapBtn}
        showCsvTableBtn={showCsvTableBtn}
        showReportBtn={showReportBtn}
        showDownloadBtn={!!showDownloadBtn}
        reportBtnLabel={reportBtnLabel}
        reportBtnDisabled={reportBtnDisabled}
        onPitchMap={showPitchMapping}
        onCsvTable={showCsvTable}
        onReport={handleGenerateReport}
        onDownload={downloadFile}
      >
        {renderModalBody()}
      </Modal>
    </>
  );
}
