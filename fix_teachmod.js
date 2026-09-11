const fs = require('fs');
let code = fs.readFileSync('src/components/TeachMod.js', 'utf8');

const target = \              React.createElement(Inp, {
                label: "Shift *",
                value: form.shift || "Night",
                onChange: (v) =>
                  setForm({
                    ...form,
                    shift: v,
                  }),
                options: ["Morning", "Evening", "Night", "Weekend"],
              }),\;

const replacement = \              React.createElement(
                "div",
                { style: { marginBottom: 12 } },
                React.createElement(
                  "label",
                  {
                    style: {
                      display: "block",
                      color: c.textSec,
                      fontSize: 10,
                      marginBottom: 6,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    },
                  },
                  "Shifts *"
                ),
                React.createElement(
                  "div",
                  { style: { display: "flex", flexWrap: "wrap", gap: 6 } },
                  ["Morning", "Evening", "Night", "Weekend"].map((s) => {
                    const currentShifts = (form.shift || "Night").split(",").map(x => x.trim());
                    const selected = currentShifts.includes(s);
                    return React.createElement(
                      "div",
                      {
                        key: s,
                        onClick: () => {
                           let cur = [...currentShifts];
                           if (cur.includes(s)) {
                             cur = cur.filter(x => x !== s);
                           } else {
                             cur.push(s);
                           }
                           if (cur.length === 0) cur = ["Night"]; // prevent empty
                           setForm({ ...form, shift: cur.join(", ") });
                        },
                        style: {
                          padding: "6px 12px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "1px solid " + (selected ? c.accent : c.border),
                          background: selected ? c.accent + "22" : c.bgInput,
                          color: selected ? c.accent : c.textSec,
                        }
                      },
                      s
                    );
                  })
                )
              ),\;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/TeachMod.js', code);
console.log("TeachMod updated");
