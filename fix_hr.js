const fs = require('fs');
let content = fs.readFileSync('src/components/HRMod.js', 'utf8');

// Find the handleCVUpload function correctly by balancing brackets
let start = content.indexOf('const handleCVUpload = async (e) => {');
if (start !== -1) {
    let braceCount = 0;
    let end = -1;
    for (let i = start; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                end = i + 1;
                break;
            }
        }
    }
    
    const newFunc = \  const handleCVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setForm({ isParsing: true, parsingStatus: "Uploading CV..." });
    setModal("interview");

    let cvUrl = "";
    try {
      if (window.firebase) {
        const storageRef = window.firebase.storage().ref();
        const fileRef = storageRef.child("hiring/cvs/" + Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.]/g, ""));
        await fileRef.put(file);
        cvUrl = await fileRef.getDownloadURL();
      }
    } catch (err) {
      console.warn("Storage upload failed, likely Firebase Storage not enabled.", err);
    }

    try {
      setForm({ isParsing: true, parsingStatus: "AI reading PDF..." });
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
            resolve();
          };
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) { 
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\\n";
      }

      const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z0-9_-]+)/);
      const phoneMatch = text.match(/(\\+?\\d[\\d -]{8,14}\\d)/);
      const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 2);
      let extractedName = "";
      if (lines.length > 0) {
        const potentialName = lines[0].replace(/[^a-zA-Z ]/g, "").trim();
        if (potentialName.split(" ").length <= 4) {
          extractedName = potentialName;
        }
      }

      setForm({
        name: extractedName,
        email: emailMatch ? emailMatch[1] : "",
        phone: phoneMatch ? phoneMatch[1] : "",
        notes: "Parsed from CV: " + file.name + "\\nExtracted Email: " + (emailMatch ? emailMatch[1] : 'None') + "\\nExtracted Phone: " + (phoneMatch ? phoneMatch[1] : 'None'),
        isParsing: false,
        parsingStatus: "",
        cvFile: cvUrl || file.name,
        roleApplied: "Quran Teacher",
        date: todayPK(),
        interviewer: "",
        score: "5",
        decision: "Pending"
      });
      
    } catch (err) {
      console.error(err);
      alert("Failed to parse CV. Ensure it is a valid PDF.");
      setForm({ isParsing: false, parsingStatus: "" });
    }
  }\;
  
    content = content.substring(0, start) + newFunc + content.substring(end);
}

fs.writeFileSync('src/components/HRMod.js', content);
console.log('Fixed handleCVUpload');
