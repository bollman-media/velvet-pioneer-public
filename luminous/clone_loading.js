const fs = require('fs');
const path = require('path');

const root = '/Users/bollman/Documents/Jetski/velvet-pioneer/luminous';
const htmlPath = path.join(root, 'index.html');
const css2Path = path.join(root, 'option2.css');
const js2Path = path.join(root, 'option2.js');
const cssLoadPath = path.join(root, 'loading.css');
const jsLoadPath = path.join(root, 'loading.js');

let html = fs.readFileSync(htmlPath, 'utf8');

if (!html.includes('id="nav-tab-loading"')) {
    const tabOpt3 = `<button class="prototype-nav__tab" id="nav-tab-option3" data-tab="option3">
                <span class="material-symbols-outlined">looks_3</span>
                Hscroll
            </button>`;
    const tabLoading = `<button class="prototype-nav__tab" id="nav-tab-loading" data-tab="loading">
                <span class="material-symbols-outlined">hourglass_empty</span>
                Loading State
            </button>`;
    html = html.replace(tabOpt3, tabOpt3 + '\n            ' + tabLoading);
}

if (!html.includes('id="phone-shell-loading"')) {
    const opt2StartMarker = '<!-- Option 2 phone shell (hidden by default, placeholder for future content) -->';
    const opt3StartMarker = '<!-- Option 3 phone shell (Z-Space Lens paradigm) -->';
    const opt2StartIdx = html.indexOf(opt2StartMarker);
    const opt3StartIdx = html.indexOf(opt3StartMarker);

    let opt2Block = html.substring(opt2StartIdx, opt3StartIdx);
    let loadingBlock = opt2Block.replace(/option2/g, 'loading').replace(/lum2-/g, 'lum-loading-').replace(/Option 2/g, 'Loading State').replace(/id="phone-shell-loading"/, 'id="phone-shell-loading" style="display:none;"');
    
    html = html.replace(opt3StartMarker, loadingBlock + opt3StartMarker);
}

if (!html.includes('<link href="loading.css" rel="stylesheet">')) {
    html = html.replace('<link href="option3.css" rel="stylesheet">', '<link href="option3.css" rel="stylesheet">\n    <link href="loading.css" rel="stylesheet">');
}

if (!html.includes('<script src="loading.js"></script>')) {
    html = html.replace('<script src="option3.js"></script>', '<script src="option3.js"></script>\n    <script src="loading.js"></script>');
}

if (html.includes("const shell3 = document.getElementById('phone-shell-option3');") && !html.includes("const shellLoading")) {
    html = html.replace(
        "const shell3 = document.getElementById('phone-shell-option3');",
        "const shell3 = document.getElementById('phone-shell-option3');\n        const shellLoading = document.getElementById('phone-shell-loading');"
    );
}

if (!html.includes("tabId === 'loading'")) {
    const jsUpdateRegex = /(if\s*\(tabId === 'option1'\) \{[\s\S]*?\} else if\s*\(tabId === 'option2'\) \{[\s\S]*?\} else if\s*\(tabId === 'option3'\) \{[\s\S]*?\})/;
    html = html.replace(jsUpdateRegex, function(match) {
        let updatedBlock = match;
        // Insert shellLoading toggle inside each existing block
        updatedBlock = updatedBlock.replace(/if\(shell3\) shell3.style.display = 'none';/g, "if(shell3) shell3.style.display = 'none';\n                    if(shellLoading) shellLoading.style.display = 'none';");
        updatedBlock = updatedBlock.replace(/if\(shell3\) shell3.style.display = '';/, "if(shell3) shell3.style.display = '';\n                    if(shellLoading) shellLoading.style.display = 'none';");
        
        const loadingBlock = ` else if (tabId === 'loading') {
                    shell1.style.display = 'none';
                    shell2.style.display = 'none';
                    if(shell3) shell3.style.display = 'none';
                    if(shellLoading) shellLoading.style.display = '';
                }`;
        return updatedBlock + loadingBlock;
    });
}
fs.writeFileSync(htmlPath, html);

let css2 = fs.readFileSync(css2Path, 'utf8');
let cssLoad = css2.replace(/lum2-/g, 'lum-loading-').replace(/option2/g, 'loading').replace(/Option 2/g, 'Loading State');
fs.writeFileSync(cssLoadPath, cssLoad);

let js2 = fs.readFileSync(js2Path, 'utf8');
let jsLoad = js2.replace(/lum2-/g, 'lum-loading-').replace(/option2/g, 'loading').replace(/Option 2/g, 'Loading State');
fs.writeFileSync(jsLoadPath, jsLoad);

console.log("Loading State scaffolding created successfully!");
