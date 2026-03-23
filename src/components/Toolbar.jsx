import { LayoutGrid, List } from 'lucide-react';

export default function Toolbar({ dirs, files, viewMode, onSetView }) {
  return (
    <div className="toolbar">
      <div className="info">
        {dirs} folder{dirs !== 1 ? 's' : ''}, {files} file{files !== 1 ? 's' : ''}
      </div>
      <div className="view-toggle">
        <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => onSetView('grid')} title="Grid view">
          <LayoutGrid size={18} />
        </button>
        <button className={viewMode === 'list' ? 'active' : ''} onClick={() => onSetView('list')} title="List view">
          <List size={18} />
        </button>
      </div>
    </div>
  );
}
