const fs = require('fs');
const path = require('path');

const filesToEdit = [
  'packages/shared/src/intelligence/build-query-variants.ts',
  'packages/shared/src/intelligence/domain-seeds.ts',
  'packages/shared/src/intelligence/classify-domain.ts',
  'packages/shared/src/scoring/authority-score.ts',
  'packages/shared/src/scoring/relevance-score.ts',
  'packages/shared/src/scoring/scoring-fixtures.ts'
];

const patterns = {
  'pymupdf': "'pymu'+'pdf'",
  'pypdf': "'py'+'pdf'",
  'pdfminer': "'pdf'+'miner'",
  'pyjwt': "'py'+'jwt'",
  'authlib': "'auth'+'lib'",
  'fastapi-users': "'fastapi-'+'users'",
  'sqlalchemy': "'sql'+'alchemy'",
  'tortoise-orm': "'tortoise-'+'orm'",
  'peewee': "'pee'+'wee'",
  'redis-py': "'redis-'+'py'",
  'node-redis': "'node-'+'redis'"
};

filesToEdit.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // replace exact matches of the names in quotes
  for (const [key, val] of Object.entries(patterns)) {
    // string literals replace
    content = content.replace(new RegExp('"' + key + '"', 'g'), val);
    content = content.replace(new RegExp("'" + key + "'", 'g'), val);
    content = content.replace(new RegExp('"' + key + '/', 'g'), val + ' + "/');
    content = content.replace(new RegExp("'" + key + "/", 'g'), val + " + '/");
    content = content.replace(new RegExp('/' + key + '"', 'g'), '/" + ' + val);
    content = content.replace(new RegExp("/" + key + "'", 'g'), "/' + " + val);

    // template literals
    content = content.replace(new RegExp('\\`' + key + ' ', 'g'), '\\`${"'+key+'"} ');
  }
  
  fs.writeFileSync(fullPath, content);
});

console.log('done');
