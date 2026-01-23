import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.join(__dirname, 'tree.txt');

async function printTree(dirPath, prefix = '', output = []) {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const filteredItems = items.filter(
    (item) => item.name !== 'node_modules' && item.name !== '.git',
  );

  // tampung semua promise rekursi
  const promises = filteredItems.map(async (item, index) => {
    const isLast = index === filteredItems.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    const line = prefix + pointer + item.name;

    console.log(line);
    output.push(line);

    if (item.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      return printTree(path.join(dirPath, item.name), newPrefix, output);
    }
    return null;
  });

  // jalankan paralel
  await Promise.all(promises);

  return output;
}

async function main() {
  const rootDir = path.resolve(__dirname, '../../'); // root project
  const output = [`${rootDir}`].concat(await printTree(rootDir));

  await fs.writeFile(outputFile, output.join('\n'), 'utf-8');
  console.log(`\nTree structure saved to ${outputFile}`);
}

// ✅ di sini fungsi printTree kepakai
main().catch((err) => console.error(err));
