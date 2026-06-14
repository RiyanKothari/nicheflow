import fs from 'fs';

const content = fs.readFileSync('nicheflow-master-build-blueprint.md', 'utf8');
const lines = content.split('\n');

let currentFile = null;
let currentContent = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('-- supabase/migrations/')) {
    currentFile = line.replace('-- ', '').trim();
    currentContent = [line];
  } else if (currentFile && line.startsWith('```')) {
    const dir = currentFile.split('/').slice(0, -1).join('/');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(currentFile, currentContent.join('\n'));
    console.log('Wrote', currentFile);
    currentFile = null;
  } else if (currentFile) {
    currentContent.push(line);
  }
}

let funcFile = null;
let funcContent = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('// supabase/functions/')) {
    funcFile = line.replace('// ', '').trim();
    funcContent = [line];
  } else if (funcFile && line.startsWith('```')) {
    const dir = funcFile.split('/').slice(0, -1).join('/');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(funcFile, funcContent.join('\n'));
    console.log('Wrote', funcFile);
    funcFile = null;
  } else if (funcFile) {
    funcContent.push(line);
  }
}
