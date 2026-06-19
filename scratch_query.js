const sharp = require('sharp');

async function run() {
    try {
        const imagePath = 'public/assets/entities/player/imgs/dragonite_mount.png';
        const image = sharp(imagePath);
        const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
        
        console.log("Image size:", info.width, "x", info.height);

        // Find rows with high density of dark pixels (R < 100, G < 100, B < 100)
        console.log("Scanning rows for grid lines:");
        for (let y = 0; y < info.height; y++) {
            let darkCount = 0;
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * info.channels;
                if (data[idx] < 120 && data[idx+1] < 120 && data[idx+2] < 120) {
                    darkCount++;
                }
            }
            if (darkCount > info.width * 0.8) {
                console.log(`Row y=${y} is a grid line (darkCount=${darkCount}/${info.width})`);
            }
        }

        // Find columns with high density of dark pixels
        console.log("\nScanning columns for grid lines:");
        for (let x = 0; x < info.width; x++) {
            let darkCount = 0;
            for (let y = 0; y < info.height; y++) {
                const idx = (y * info.width + x) * info.channels;
                if (data[idx] < 120 && data[idx+1] < 120 && data[idx+2] < 120) {
                    darkCount++;
                }
            }
            if (darkCount > info.height * 0.8) {
                console.log(`Column x=${x} is a grid line (darkCount=${darkCount}/${info.height})`);
            }
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
