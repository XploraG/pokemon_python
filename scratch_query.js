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

console.log("sprites.png dimensions:", getPngDimensions('public/assets/entities/player/imgs/sprites.png'));
console.log("Bicycle (32x32).png dimensions:", getPngDimensions('public/assets/entities/player/imgs/Bicycle (32x32).png'));
console.log("Fishing (32x32).png dimensions:", getPngDimensions('public/assets/entities/player/imgs/Fishing (32x32).png'));
console.log("lapras_mount.png dimensions:", getPngDimensions('public/assets/entities/player/imgs/lapras_mount.png'));
