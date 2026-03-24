import { Copy } from 'lucide-react';
import { parseCSV } from '../../../utils/csv';

function showCopyToast(msg) {
  const existing = document.querySelector('.copy-toast-global');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'copy-toast-global';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

export default function CSVTable({ csvText }) {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return <div className="no-preview">Empty CSV file</div>;

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const handleCopyUrl = (value) => {
    navigator.clipboard.writeText(value).then(() => {
      showCopyToast('Video URL copied successfully!');
    });
  };

  return (
    <div className="csv-table-wrap">
      <table className="csv-table">
        <thead>
          <tr>
            <th className="csv-row-num">#</th>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri}>
              <td className="csv-row-num">{ri + 1}</td>
              {headers.map((_, ci) => {
                const val = row[ci] !== undefined ? row[ci] : '';
                const isUrl = /^https?:\/\//i.test(val);
                if (isUrl) {
                  return (
                    <td key={ci} title={val} className="csv-url-cell" onClick={() => handleCopyUrl(val)}>
                      <span className="csv-url-text">{val}</span>
                      <span className="csv-url-icon">
                        <Copy size={12} />
                      </span>
                    </td>
                  );
                }
                return (
                  <td key={ci} title={val}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
