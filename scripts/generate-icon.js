const fs = require('fs');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="256" height="256" rx="56" fill="url(#grad)" filter="url(#shadow)"/>
  <rect x="48" y="76" width="160" height="120" rx="20" fill="none" stroke="#ffffff" stroke-width="14"/>
  <path d="M72 76 L96 46 L160 46 L184 76 Z" fill="#ffffff"/>
  <circle cx="128" cy="136" r="38" fill="none" stroke="#ffffff" stroke-width="14"/>
  <circle cx="178" cy="104" r="8" fill="#ffffff"/>
</svg>`;

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(path.join(assetsDir, 'icon.svg'), svg);
console.log('Icon generated at assets/icon.svg');
