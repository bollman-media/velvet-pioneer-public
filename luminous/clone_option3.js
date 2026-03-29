const fs = require('fs');
const path = require('path');

const root = '/Users/bollman/Documents/Jetski/velvet-pioneer/luminous';
const htmlPath = path.join(root, 'index.html');
const css2Path = path.join(root, 'option2.css');
const js2Path = path.join(root, 'option2.js');
const css3Path = path.join(root, 'option3.css');
const js3Path = path.join(root, 'option3.js');

let html = fs.readFileSync(htmlPath, 'utf8');

if (!html.includes('id="phone-shell-option3"')) {
    const opt2StartMarker = '<!-- Option 2 phone shell (hidden by default, placeholder for future content) -->';
    const opt2EndMarker = '    </div><!-- /phone-shell option2 -->';
    const opt2StartIdx = html.indexOf(opt2StartMarker);
    const opt2EndIdx = html.indexOf(opt2EndMarker) + opt2EndMarker.length;

    let opt2Block = html.substring(opt2StartIdx, opt2EndIdx);
    let opt3Block = opt2Block.replace(/option2/g, 'option3').replace(/lum2-/g, 'lum3-').replace(/Option 2/g, 'Option 3');
    
    html = html.slice(0, opt2EndIdx) + '\n\n' + opt3Block + html.slice(opt2EndIdx);
}

if (!html.includes('<link rel="stylesheet" href="option3.css">')) {
    html = html.replace('<link rel="stylesheet" href="option2.css">', '<link rel="stylesheet" href="option2.css">\n    <link rel="stylesheet" href="option3.css">');
}

if (!html.includes('<script src="option3.js" defer></script>')) {
    html = html.replace('<script src="option2.js" defer></script>', '<script src="option2.js" defer></script>\n    <script src="option3.js" defer></script>');
}

if (html.includes("tabId === 'option2'")) {
    html = html.replace("const shell2 = document.getElementById('phone-shell-option2');", "const shell2 = document.getElementById('phone-shell-option2');\n        const shell3 = document.getElementById('phone-shell-option3');");
    
    html = html.replace(
        "if (tabId === 'option1') {\n                    shell1.style.display = '';\n                    shell2.style.display = 'none';\n                } else if (tabId === 'option2') {\n                    shell1.style.display = 'none';\n                    shell2.style.display = '';\n                }",
        "if (tabId === 'option1') {\n                    shell1.style.display = '';\n                    shell2.style.display = 'none';\n                    if(shell3) shell3.style.display = 'none';\n                } else if (tabId === 'option2') {\n                    shell1.style.display = 'none';\n                    shell2.style.display = '';\n                    if(shell3) shell3.style.display = 'none';\n                } else if (tabId === 'option3') {\n                    shell1.style.display = 'none';\n                    shell2.style.display = 'none';\n                    if(shell3) shell3.style.display = '';\n                }"
    );
}

fs.writeFileSync(htmlPath, html);

let css2 = fs.readFileSync(css2Path, 'utf8');
let css3 = css2.replace(/lum2-/g, 'lum3-').replace(/option2/g, 'option3').replace(/Option 2/g, 'Option 3');
fs.writeFileSync(css3Path, css3);

let js2 = fs.readFileSync(js2Path, 'utf8');
let js3 = js2.replace(/lum2-/g, 'lum3-').replace(/option2/g, 'option3').replace(/Option 2/g, 'Option 3');
fs.writeFileSync(js3Path, js3);

console.log("Option 3 scaffolding created successfully.");
