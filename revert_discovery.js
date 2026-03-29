const fs = require('fs');
const file = '/Users/bollman/Documents/Jetski/velvet-pioneer/luminous/option2.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Restore the buildCard wrapper instead of window._lum2OnCardBuilt
const targetBuilt = `    window._lum2OnCardBuilt = function() {
        ensureDiscoveryCardLast();
        checkDiscoveryState();
    };`;
    
const replacementBuilt = `    buildCard = function(dataUrl, prompt) {
        _realBuildCard(dataUrl, prompt);
        ensureDiscoveryCardLast();
        checkDiscoveryState();
    };`;

content = content.replace(targetBuilt, replacementBuilt);

// 2. Remove explicit calls to window._lum2OnCardBuilt from startGenerationFlow and wrappedFlow
content = content.replace(/\/\/ Rebuild discovery card so it stays last\s*if \(window\._lum2OnCardBuilt\) window\._lum2OnCardBuilt\(\);\s*/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log('Reverted discovery section changes for Option 2.');
