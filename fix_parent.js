const fs = require('fs');
let content = fs.readFileSync('src/components/ParentMod.js', 'utf8');

// 1. Add appSettings to props
content = content.replace(
  '  teacherFeedback,\n  setTeacherFeedback,\n}) => {',
  '  teacherFeedback,\n  setTeacherFeedback,\n  appSettings,\n}) => {'
);

// 2. Replace Logo and Academy Name in printInvoice
const headerPattern = /<div class="header"><div><div class="brand">LLQA Academy<\/div>.*?<\/div>.*?<div style="text-align:right;"><h1 style="margin:0;border:none;padding:0;">INVOICE<\/h1><div class="meta">Invoice #: INV-'/g;
content = content.replace(headerPattern, \
      <div class="header">
        <div>
          ' + ((appSettings && appSettings.logoDataUrl) 
            ? '<img src="' + appSettings.logoDataUrl + '" style="max-height: 60px; max-width: 200px; margin-bottom: 10px;" />' 
            : '<div class="brand">' + escHTML((appSettings && appSettings.academyName) || "LLQA Academy") + '</div>') + '
          <div class="meta">' + escHTML((appSettings && appSettings.tagline) || "Let's Learn Quran") + '</div>
          <div class="meta">' + escHTML((appSettings && appSettings.address) || "Rawalpindi, Pakistan") + '</div>
          <div class="meta">' + escHTML((appSettings && appSettings.website) || "letslearnquran.net") + '</div>
        </div>
        <div style="text-align:right;">
          <h1 style="margin:0;border:none;padding:0;">INVOICE</h1>
          <div class="meta">Invoice #: INV-'\);

// 3. Replace Bill To section
const billToPattern = /<div style="background:#f9fafb;padding:15px;border-radius:8px;margin-bottom:20px;"><strong>Bill To:<\/strong><br>'.*?<\/span><\/div>"/s;
content = content.replace(billToPattern, \<div style="background:#f9fafb;padding:15px;border-radius:8px;margin-bottom:20px;"><div style="font-size:15px;margin-bottom:8px;"><strong>Bill To:</strong><br>' +
          escHTML(stu.parent || "-") + '</div><div style="color:#444;line-height:1.6;font-size:13px;"><strong>Student:</strong> <span style="color:#000;">' + escHTML(stu.name) + '</span><br><strong>Age:</strong> ' + escHTML(stu.age || "-") + '<br><strong>Course:</strong> ' + escHTML(stu.course || "-") + '<br><strong>Country:</strong> ' + escHTML(stu.country || "-") + " &middot; " + escHTML(stu.state || "") + '</div></div>"\);


// 4. Replace Row Description
const rowPattern = /"<tr><td>" \+\s*escHTML\(stu\.course \|\| "Quran Class"\) \+\s*" - " \+\s*escHTML\(stu\.teacher \|\| "Unassigned"\) \+\s*"<\/td><td>"/s;
content = content.replace(rowPattern, \"<tr><td><strong>Monthly Tuition Fee - " + escHTML(stu.course || "Quran") + "</strong><br><span style='font-size:12px;color:#666;'>Assigned Teacher: " + escHTML(stu.teacher || "Pending") + "</span></td><td>"\);

fs.writeFileSync('src/components/ParentMod.js', content);
console.log("Updated ParentMod.js");
