const fs = require('fs');
let code = fs.readFileSync('src/components/ParentMod.js', 'utf8');

// 1. Add Transaction # to header
const headerMatch = /'<\/div><div class="meta">Status: <strong style="color:' \+\s*\(inv\.status === "paid"\s*\?\s*"#10b981"\s*:\s*inv\.status === "overdue"\s*\?\s*"#ef4444"\s*:\s*"#f59e0b"\) \+\s*'">'\s*\+\s*escHTML\(inv\.status\.toUpperCase\(\)\)\s*\+\s*"<\/strong><\/div><\/div><\/div>"/;

const headerReplacement = \'</div><div class="meta">Status: <strong style="color:' +
          (inv.status === "paid"
            ? "#10b981"
            : inv.status === "overdue"
              ? "#ef4444"
              : "#f59e0b") +
          '">' +
          escHTML(inv.status.toUpperCase()) +
          "</strong></div>" +
          (inv.receipt ? '<div class="meta">Transaction #: ' + escHTML(inv.receipt) + '</div>' : '') +
          "</div></div>"\;

code = code.replace(headerMatch, headerReplacement);

// 2. Change Description row
const rowMatch = /"<strong>Monthly Tuition Fee - " \+\s*escHTML\(stu\.course \|\| "Quran"\) \+\s*"<\/strong><br>" \+\s*"<span style='font-size:12px;color:#666;'>Assigned Teacher: " \+\s*escHTML\(stu\.teacher \|\| "Pending"\) \+\s*"<\/span>"/;

const rowReplacement = \"<strong>Monthly Tuition Fee</strong><br>" +
          "<span style='color:#444;font-size:13px;'>Course: " + escHTML(stu.course || "Quran") + "</span><br>" +
          "<span style='color:#666;font-size:12px;'>Assigned Teacher: " + escHTML(stu.teacher || "Pending") + "</span>"\;

code = code.replace(rowMatch, rowReplacement);

fs.writeFileSync('src/components/ParentMod.js', code);
console.log("Updated ParentMod.js");
