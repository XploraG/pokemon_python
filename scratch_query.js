const fs = require('fs');

function getPngDimensions(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const width = buffer.readInt32BE(16);
        const height = buffer.readInt32BE(20);
        return { width, height };
    } catch (e) {
        return { error: e.message };
    }
}

console.log("Flying (32x32).png dimensions:", getPngDimensions('public/assets/entities/player/imgs/Flying (32x32).png'));
