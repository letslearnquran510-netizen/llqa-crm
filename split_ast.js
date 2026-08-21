const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;

const code = fs.readFileSync('formatted_crm.js', 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

let statements = [];

traverse(ast, {
  FunctionExpression(path) {
    if (path.node.id && path.node.id.name === 'bootApp') {
      const tryStmt = path.node.body.body.find(stmt => stmt.type === 'TryStatement');
      if (tryStmt) {
        statements = tryStmt.block.body;
      }
    }
  }
});

console.log(`Found ${statements.length} top-level statements in bootApp try-block.`);

if (!fs.existsSync('src')) fs.mkdirSync('src');
if (!fs.existsSync('src/components')) fs.mkdirSync('src/components');
if (!fs.existsSync('src/core')) fs.mkdirSync('src/core');

let commonCode = '';
let buildOrder = [];

statements.forEach((stmt, index) => {
  const generated = generator(stmt).code;
  
  if (stmt.type === 'VariableDeclaration') {
    const decl = stmt.declarations[0];
    if (decl.id && decl.id.name && decl.init) {
      const name = decl.id.name;
      const isComponent = name[0] === name[0].toUpperCase() && !name.includes('_') && (decl.init.type === 'ArrowFunctionExpression' || decl.init.type === 'FunctionExpression');
      
      if (isComponent && name !== 'App' && name !== 'CC' && name !== 'STATE_TZ') {
        fs.writeFileSync(`src/components/${name}.js`, generated + '\n\n');
        buildOrder.push(`src/components/${name}.js`);
      } else if (name === 'App') {
        fs.writeFileSync(`src/App.js`, generated + '\n\n');
        buildOrder.push(`src/App.js`);
      } else {
        commonCode += generated + '\n\n';
      }
    } else {
      commonCode += generated + '\n\n';
    }
  } else if (stmt.type === 'FunctionDeclaration') {
    const name = stmt.id.name;
    const isComponent = name[0] === name[0].toUpperCase() && !name.includes('_');
    if (isComponent) {
      fs.writeFileSync(`src/components/${name}.js`, generated + '\n\n');
      buildOrder.push(`src/components/${name}.js`);
    } else {
      commonCode += generated + '\n\n';
    }
  } else {
    commonCode += generated + '\n\n';
  }
});

fs.writeFileSync('src/core/common.js', commonCode);
buildOrder.unshift('src/core/common.js');

fs.writeFileSync('build_order.json', JSON.stringify(buildOrder, null, 2));
console.log('Successfully split files into src/ directory!');
