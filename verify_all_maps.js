const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');

// Recursively find files with a given extension
function getFilesRecursively(dir, ext, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getFilesRecursively(filePath, ext, fileList);
        } else if (file.endsWith(ext)) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

function verifyMaps() {
    console.log('🔍 Starting full verification of all game maps and assets...');
    const mapsDir = path.join(PUBLIC_DIR, 'assets', 'maps');
    if (!fs.existsSync(mapsDir)) {
        console.error(`❌ Maps directory not found at: ${mapsDir}`);
        return;
    }

    const mapFiles = getFilesRecursively(mapsDir, '.json');
    console.log(`📋 Found ${mapFiles.length} map files to verify.`);
    console.log('--------------------------------------------------');

    let errorsFound = 0;

    for (const mapFile of mapFiles) {
        const relativeMapPath = path.relative(PUBLIC_DIR, mapFile).replace(/\\/g, '/');
        
        try {
            const mapContent = fs.readFileSync(mapFile, 'utf8');
            const mapJson = JSON.parse(mapContent);

            // 1. Verify grid text file
            if (mapJson.map) {
                const gridPath = mapJson.map.replace('src/assets/', 'assets/').replace(/^\//, '');
                const absoluteGridPath = path.join(PUBLIC_DIR, gridPath);
                if (!fs.existsSync(absoluteGridPath)) {
                    console.log(`❌ Map [/${relativeMapPath}] references missing grid file: "${mapJson.map}" (resolved: ${gridPath})`);
                    errorsFound++;
                }
            } else {
                console.log(`⚠️ Map [/${relativeMapPath}] does not define a grid map path.`);
            }

            // 2. Verify component images
            if (mapJson.components) {
                for (const comp of mapJson.components) {
                    if (comp.image && !comp.image.startsWith('data:')) {
                        const compImgPath = comp.image.replace('src/assets/', 'assets/').replace(/^\//, '');
                        const absoluteImgPath = path.join(PUBLIC_DIR, compImgPath);
                        if (!fs.existsSync(absoluteImgPath)) {
                            console.log(`❌ Map [/${relativeMapPath}] component "${comp.type}" references missing image: "${comp.image}"`);
                            errorsFound++;
                        }
                    }
                }
            }

            // 3. Verify entities and their sprites
            if (mapJson.entities) {
                for (const ent of mapJson.entities) {
                    if (ent.location) {
                        const entLoc = ent.location.replace('src/assets/', 'assets/').replace(/^\//, '');
                        const absoluteEntPath = path.join(PUBLIC_DIR, entLoc);
                        
                        if (!fs.existsSync(absoluteEntPath)) {
                            console.log(`❌ Map [/${relativeMapPath}] references missing entity: "${ent.location}"`);
                            errorsFound++;
                            continue;
                        }

                        // Read entity config to check its sprite
                        try {
                            const entContent = fs.readFileSync(absoluteEntPath, 'utf8');
                            const entJson = JSON.parse(entContent);

                            if (entJson.img) {
                                const entImgPath = entJson.img.replace('src/assets/', 'assets/').replace(/^\//, '');
                                const absoluteEntImgPath = path.join(PUBLIC_DIR, entImgPath);
                                if (!fs.existsSync(absoluteEntImgPath)) {
                                    console.log(`❌ Entity [/${entLoc}] references missing sprite image: "${entJson.img}"`);
                                    errorsFound++;
                                }
                            }
                        } catch (entErr) {
                            console.log(`❌ Failed to parse entity JSON [/${entLoc}]:`, entErr.message);
                            errorsFound++;
                        }
                    }
                }
            }

        } catch (mapErr) {
            console.log(`❌ Failed to parse map JSON [/${relativeMapPath}]:`, mapErr.message);
            errorsFound++;
        }
    }

    console.log('--------------------------------------------------');
    if (errorsFound === 0) {
        console.log('✅ ALL MAPS AND REFERENCED ASSETS ARE VALID! No missing assets detected.');
    } else {
        console.log(`🚨 Found ${errorsFound} issues with game maps/assets!`);
    }
}

verifyMaps();
