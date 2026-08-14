const fs = require('fs');
const content = fs.readFileSync('src/utils/initialData.ts', 'utf8');
const index = content.indexOf('export const INITIAL_PERMITS: Permit[] = [');
if (index !== -1) {
  const newContent = content.substring(0, index) + 'export const INITIAL_PERMITS: Permit[] = [];\n';
  fs.writeFileSync('src/utils/initialData.ts', newContent);
  console.log('Modified initialData.ts');
} else {
  console.log('Could not find INITIAL_PERMITS');
}
