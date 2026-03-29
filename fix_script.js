const fs = require('fs');

function fixup(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const startStr = "    async function generateFashionImage(promptMsg, style, signal) {";
    const endStr = "    function startGenerationFlow(prompt, style) {";
    
    const startIdx = content.indexOf(startStr);
    const endIdx = content.indexOf(endStr);
    
    if (startIdx !== -1 && endIdx !== -1) {
        let newContent = content.slice(0, startIdx) + 
                         "    const generateFashionImage = (...args) => window.generateFashionImage(...args);\n\n" + 
                         content.slice(endIdx);
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log("Fixed " + filePath);
    } else {
        console.log("Could not find bounds in " + filePath);
    }
}

fixup('/Users/bollman/Documents/Jetski/velvet-pioneer/luminous/option2.js');
fixup('/Users/bollman/Documents/Jetski/velvet-pioneer/luminous/option3.js');
