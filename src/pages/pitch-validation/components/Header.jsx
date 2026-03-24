import { useRef } from 'react';
import { Target, ArrowLeft, Home, ArrowRight, Search, Upload, Files } from 'lucide-react';

export default function Header({
  currentPath,
  onNavigate,
  onGoBack,
  searchQuery,
  onSearchChange,
  onCsvUpload,
  onBulkUpload,
}) {
  const inputRef = useRef(null);

  const displayPath = currentPath === '/' ? '' : currentPath;

  const handleNavigateToInput = () => {
    let path = (inputRef.current?.value || '').trim();
    if (!path) path = '/';
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path += '/';
    onNavigate(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleNavigateToInput();
  };

  return (
    <div className="header">
      <h1>
        <Target size={22} />
        <span>Pitching</span> Validation
      </h1>
      <nav className="breadcrumb">
        <a className="root-btn" onClick={onGoBack} title="Go back">
          <ArrowLeft size={18} />
        </a>
        <a className="root-btn" onClick={() => onNavigate('/')} title="Go to root">
          <Home size={18} />
        </a>
        <input
          ref={inputRef}
          type="text"
          id="pathInput"
          className="path-input"
          defaultValue={displayPath}
          key={displayPath}
          placeholder="userId / bookingId / sessionId"
          onKeyDown={handleKeyDown}
        />
        <button className="go-btn" onClick={handleNavigateToInput}>
          <ArrowRight size={16} />
        </button>
      </nav>
      <div className="search-box">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          id="searchInput"
          placeholder="Filter files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <button
        className="upload-csv-btn"
        onClick={() => document.getElementById('csvUploadInput').click()}
        title="Upload CSV"
      >
        <Upload size={16} /> Upload CSV
      </button>
      <input type="file" id="csvUploadInput" accept=".csv" style={{ display: 'none' }} onChange={onCsvUpload} />
      <button className="upload-csv-btn" onClick={onBulkUpload} title="Bulk Upload CSVs">
        <Files size={16} /> Bulk Upload
      </button>
    </div>
  );
}
