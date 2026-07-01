// Remove unused default React imports (React 19 automatic JSX runtime).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'src');

const walk = (dir, files = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (/\.(jsx|js)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
};

const IMPORT_REACT_ONLY = /^import React from ['"]react['"];\r?\n/m;
const IMPORT_REACT_COMMA = /^import React, (\{[^}]+\}) from ['"]react['"];\r?\n/m;

let changed = 0;

for (const file of walk(ROOT)) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('React.')) {
    continue;
  }

  let updated = text.replace(IMPORT_REACT_COMMA, "import $1 from 'react';\n");
  updated = updated.replace(IMPORT_REACT_ONLY, '');

  if (updated !== text) {
    writeFileSync(file, updated, 'utf8');
    changed += 1;
  }
}

console.log(`Updated ${changed} files`);
