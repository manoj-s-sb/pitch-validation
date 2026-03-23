import { Folder, Image, Video, Music, FileText, FileCode, Archive, File, FolderOpen } from 'lucide-react';
import { getFileType } from '../utils/files';

const iconMap = {
  folder: { Icon: Folder, color: 'var(--folder)' },
  image: { Icon: Image, color: 'var(--image)' },
  video: { Icon: Video, color: 'var(--video)' },
  audio: { Icon: Music, color: 'var(--doc)' },
  doc: { Icon: FileText, color: 'var(--doc)' },
  code: { Icon: FileCode, color: 'var(--accent)' },
  archive: { Icon: Archive, color: 'var(--other)' },
  other: { Icon: File, color: 'var(--other)' },
};

function FileIcon({ name, isDir }) {
  if (isDir) {
    const { Icon, color } = iconMap.folder;
    return <Icon size={32} style={{ color, strokeWidth: 1.5 }} />;
  }
  const type = getFileType(name);
  const { Icon, color } = iconMap[type] || iconMap.other;
  return <Icon size={32} style={{ color, strokeWidth: 1.5 }} />;
}

export default function FileList({ items, viewMode, currentPath, onNavigate, onOpenFile }) {
  if (items.length === 0) {
    return (
      <div className="status">
        <FolderOpen size={48} style={{ marginBottom: 16, color: 'var(--text-dim)' }} />
        <div style={{ color: 'var(--text-dim)' }}>This directory is empty</div>
      </div>
    );
  }

  return (
    <div className={`file-list ${viewMode}`}>
      {items.map((item, i) => (
        <div
          key={item.name + i}
          className={`file-item ${item.isDir ? 'dir-item' : ''}`}
          onClick={() => {
            if (item.isDir) {
              onNavigate(currentPath + item.href);
            } else {
              onOpenFile(item.name, currentPath + item.href);
            }
          }}
        >
          <div className="icon">
            <FileIcon name={item.name} isDir={item.isDir} />
          </div>
          <div className="name">{item.name}</div>
          {item.size && <div className="meta">{item.size}</div>}
        </div>
      ))}
    </div>
  );
}
