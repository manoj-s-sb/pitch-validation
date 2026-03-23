export function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  const lines = text.split('\n');

  for (const line of lines) {
    if (!line.trim() && !inQuotes) continue;
    current += (current ? '\n' : '') + line;
    const quoteCount = (current.match(/"/g) || []).length;
    inQuotes = quoteCount % 2 !== 0;
    if (!inQuotes) {
      const row = [];
      let cell = '';
      let q = false;
      for (let i = 0; i < current.length; i++) {
        const ch = current[i];
        if (ch === '"') {
          if (q && current[i + 1] === '"') {
            cell += '"';
            i++;
          } else q = !q;
        } else if (ch === ',' && !q) {
          row.push(cell.trim());
          cell = '';
        } else {
          cell += ch;
        }
      }
      row.push(cell.trim());
      rows.push(row);
      current = '';
    }
  }
  return rows;
}
