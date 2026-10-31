const fs = require('fs');
const filePath = 'web/components/MathNotebookColumnGrid.tsx';
let code = fs.readFileSync(filePath, 'utf8');

const oldRegex = 'const colBlockRegex = /(?:kg|km|l|m|किग्रा|लीटर|मीटर)[\\s\\|]+(?:g|m|ml|cm|ग्रा|मिली|सेमी)[\\s\\S]*?\\n\\s*(\\d+)[\\s\\|]+(\\d+)[\\s\\S]*?\\n\\s*([\\+\\-−])\\s*(\\d+)[\\s\\|]+(\\d+)/i;';
const newRegex = 'const colBlockRegex = /(kg|km|l|m|किग्रा|लीटर|मीटर)[\\s\\|]+(g|m|ml|cm|ग्रा|मिली|सेमी)[\\s\\S]*?\\n\\s*(\\d+)[\\s\\|]+(\\d+)[\\s\\S]*?\\n\\s*([\\+\\-−])\\s*(\\d+)[\\s\\|]+(\\d+)/i;';

const oldBlock = `  if (colBlockM) {
    top_u1 = parseInt(colBlockM[1], 10);
    top_u2 = parseInt(colBlockM[2], 10);
    isSubtraction = colBlockM[3] === '-' || colBlockM[3] === '−';
    bot_u1 = parseInt(colBlockM[4], 10);
    bot_u2 = parseInt(colBlockM[5], 10);
  }`;

const newBlock = `  if (colBlockM) {
    u1 = colBlockM[1].toLowerCase();
    u2 = colBlockM[2].toLowerCase();
    top_u1 = parseInt(colBlockM[3], 10);
    top_u2 = parseInt(colBlockM[4], 10);
    isSubtraction = colBlockM[5] === '-' || colBlockM[5] === '−';
    bot_u1 = parseInt(colBlockM[6], 10);
    bot_u2 = parseInt(colBlockM[7], 10);
  }`;

code = code.replace(/\r\n/g, '\n');
code = code.replace(oldRegex, newRegex);
code = code.replace(oldBlock, newBlock);
code = code.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated MathNotebookColumnGrid.tsx regex and captures!');

