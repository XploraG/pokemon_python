const fs = require('fs');
const https = require('https');
const path = require('path');

const outPath = path.join(__dirname, 'public', 'assets', 'entities', 'structures', 'battletower', 'battletower.png');

// The Spriters Resource direct image download URL pattern
// Sheet 5568 = Battle Frontier Buildings (Emerald)
// Sheet 5567 = Battle Frontier full sheet
const urls = [
    'https://www.spriters-resource.com/resources/sheets/5/5568.png',
    'https://www.spriters-resource.com/resources/sheets/5/5567.png',
    'https://www.spriters-resource.com/resources/sheets/0/5568.png',
];

function tryDownload(urlList, idx = 0) {
    if (idx >= urlList.length) {
        console.error('All URLs failed.');
        return;
    }
    const url = urlList[idx];
    console.log(`Trying [${idx + 1}/${urlList.length}]: ${url}`);
    const file = fs.createWriteStream(outPath);
    https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.spriters-resource.com/game_boy_advance/pokemonemerald/sheet/5568/'
        }
    }, (res) => {
        console.log(`HTTP ${res.statusCode} content-type: ${res.headers['content-type']}`);
        if (res.statusCode !== 200) {
            file.close();
            if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
            tryDownload(urlList, idx + 1);
            return;
        }
        res.pipe(file);
        file.on('finish', () => {
            file.close();
            const size = fs.statSync(outPath).size;
            console.log(`Downloaded! Size: ${size} bytes → ${outPath}`);
        });
    }).on('error', (e) => {
        console.log(`Error: ${e.message}`);
        file.close();
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
        tryDownload(urlList, idx + 1);
    });
}

tryDownload(urls);
