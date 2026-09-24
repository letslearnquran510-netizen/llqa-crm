const fs = require('fs');

// 1. Inject NativeSelectWrapper into common.js
let commonCode = fs.readFileSync('src/core/common.js', 'utf8');

const wrapperCode = `
const NativeSelectWrapper = ({ children, onChange, ...props }) => {
  let finalOptions = [];
  if (children) {
    const childArray = Array.isArray(children) ? children : [children];
    const flatChildren = childArray.flat(Infinity).filter(Boolean);
    finalOptions = flatChildren.map(child => {
      if (child && child.props) {
        let label = child.props.children;
        if (Array.isArray(label)) label = label.join("");
        return {
          value: child.props.value !== undefined ? child.props.value : "",
          label: label || child.props.value || ""
        };
      }
      return null;
    }).filter(Boolean);
  }
  
  const handleChange = (val) => {
    if (onChange) {
      // Simulate native event
      onChange({ target: { value: val } });
    }
  };

  return React.createElement(CustomSelect, {
    ...props,
    options: finalOptions,
    onChange: handleChange
  });
};
`;

if (!commonCode.includes('const NativeSelectWrapper =')) {
  commonCode = commonCode + '\n' + wrapperCode + '\n';
  fs.writeFileSync('src/core/common.js', commonCode);
  console.log('NativeSelectWrapper injected into common.js');
}

// 2. Globally replace React.createElement("select" with React.createElement(NativeSelectWrapper
const glob = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = glob.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (glob.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let code = glob.readFileSync(fullPath, 'utf8');
      if (code.includes('React.createElement("select"')) {
        code = code.replace(/React\.createElement\("select"/g, 'React.createElement(NativeSelectWrapper');
        glob.writeFileSync(fullPath, code);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInDir('src/components');

