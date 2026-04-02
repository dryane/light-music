const { createCanvas } = require('canvas');
const fs = require('fs');

const size = 1024;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Black background
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, size, size);

// White music note
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 600px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('♪', size/2, size/2 + 40);

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./assets/icon.png', buffer);
fs.writeFileSync('./assets/adaptive-icon.png', buffer);
fs.writeFileSync('./assets/splash.png', buffer);
console.log('Icons generated');