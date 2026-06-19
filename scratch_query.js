const sharp = require('sharp');

async function run() {
    try {
        const imagePath = 'public/assets/entities/player/imgs/lapras_mount.png';
        const image = sharp(imagePath);
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
        
        console.log("Top-left pixel RGB:", data[0], data[1], data[2]);
        console.log("Pixel at (10, 10) RGB:", 
            data[(10 * info.width + 10) * info.channels], 
            data[(10 * info.width + 10) * info.channels + 1], 
            data[(10 * info.width + 10) * info.channels + 2]
        );
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
