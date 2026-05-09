import fs from 'fs';

let c = fs.readFileSync('src/components/admin/CreateNewCampaign.tsx', 'utf8');

// Find the modal's JSX starting point
let start = c.indexOf('{/* ===== MODAL ===== */}');
// Find the next major section after modal
let end = c.indexOf('{/* ===== TASK LIST ===== */}', start);

let modal = c.substring(start, end);

// Now extract key sections with line numbers
let lines = modal.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (line.startsWith('<') || line.startsWith('</') || line.startsWith('{') || line.includes('className=') || line.includes('label') || line.includes('<h2') || line.includes('<select') || line.includes('<button') || line.includes('<input')) {
    console.log(`${i}: ${line.substring(0, 140)}`);
  }
}
