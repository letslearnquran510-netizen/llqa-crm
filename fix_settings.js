const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsMod.js', 'utf8');

code = code.replace(/\[\["Hafiz Suleman's Phone"[\s\S]*?"flagged"\]\]/g, '[]');

fs.writeFileSync('src/components/SettingsMod.js', code);
console.log('SettingsMod data wiped attempt 2');
