const fs = require('fs');

const header = fs.readFileSync('src/header.html', 'utf8');
const footer = fs.readFileSync('src/footer.html', 'utf8');
const buildOrder = JSON.parse(fs.readFileSync('build_order.json', 'utf8'));

let html = header + '\n';

// Add script tags for each module
buildOrder.forEach(file => {
  html += `<script src="${file}?v=${Date.now()}"></script>\n`;
});

// Add the boot logic
html += `<script>
  try {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
    setTimeout(() => {
      const loader = document.getElementById('initial-loader');
      if (loader) {
        loader.classList.add('hide');
        setTimeout(() => loader.remove(), 350);
      }
    }, 50);
  } catch(err) {
    console.error("App init failed:", err);
    var errMsg = (err && err.message) || String(err);
    document.getElementById("root").innerHTML = '<div style="padding:40px;color:#ef4444;font-family:monospace;font-size:13px"><b>Error:</b> ' + errMsg + '<br><br><a href="javascript:location.reload()" style="color:#4a7aff">Reload</a></div>';
    var l = document.getElementById("initial-loader");
    if (l) l.classList.add("hide");
  }
</script>\n`;

html += footer;

fs.writeFileSync('index.html', html);
console.log('Successfully built index.html!');
