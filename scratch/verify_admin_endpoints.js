const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log("=== Testing Backend APIs ===");
    const collRes = await get('http://localhost:5010/api/collections');
    console.log(`GET /api/collections: Status ${collRes.statusCode}`);
    const collectionsPayload = JSON.parse(collRes.body);
    const collections = collectionsPayload.data;
    const mainCols = collections.filter(c => !c.parent);
    const subCols = collections.filter(c => c.parent);
    console.log(`Total Collections: ${collections.length}, Main: ${mainCols.length}, Subs: ${subCols.length}`);
    console.log("Main Collections:");
    mainCols.forEach(c => console.log(`  - ${c.name} (${c.slug}) [image: ${c.image}]`));

    const occRes = await get('http://localhost:5010/api/occasions');
    console.log(`\nGET /api/occasions: Status ${occRes.statusCode}`);
    const occasionsPayload = JSON.parse(occRes.body);
    const occasions = occasionsPayload.data;
    const mainOccs = occasions.filter(o => !o.parent);
    const subOccs = occasions.filter(o => o.parent);
    console.log(`Total Occasions: ${occasions.length}, Main: ${mainOccs.length}, Subs: ${subOccs.length}`);
    console.log("Main Occasions:");
    mainOccs.forEach(o => console.log(`  - ${o.name} (${o.slug}) [image: ${o.image}]`));

    console.log("\n=== Testing Frontend Pages ===");
    const nextCols = await get('http://localhost:3000/admin/collections');
    console.log(`GET http://localhost:3000/admin/collections: Status ${nextCols.statusCode}`);
    
    const nextOccs = await get('http://localhost:3000/admin/occasions');
    console.log(`GET http://localhost:3000/admin/occasions: Status ${nextOccs.statusCode}`);
}

main().catch(err => {
    console.error("Test error:", err);
    process.exit(1);
});
