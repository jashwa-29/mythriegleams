const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const outputFile = path.join(rootDir, 'full_codebase_for_ai.md');

const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'uploads', 'assets', '.gemini', '.next', 'package-lock.json'];
const ignoreExts = ['.webp', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.mp4', '.pdf', '.woff', '.woff2', '.ttf'];

let markdownContent = `# Mythris Gleams E-commerce Full Stack Codebase\n\n`;

function traverseDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (ignoreDirs.some(ignore => fullPath.includes(path.sep + ignore) || file === ignore)) {
            continue;
        }

        if (stat.isDirectory()) {
            traverseDirectory(fullPath);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (ignoreExts.includes(ext)) continue;
            
            // Limit to useful extensions if needed, but let's just grab everything else
            
            try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
                
                // Try to infer language
                let lang = '';
                if (ext === '.js' || ext === '.jsx' || ext === '.mjs') lang = 'javascript';
                else if (ext === '.ts' || ext === '.tsx') lang = 'typescript';
                else if (ext === '.html') lang = 'html';
                else if (ext === '.css') lang = 'css';
                else if (ext === '.json') lang = 'json';
                
                markdownContent += `## File: \`${relativePath}\`\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
            } catch (err) {
                // Ignore unreadable/binary files
            }
        }
    }
}

console.log('Gathering codebase...');
['backend', 'frontend'].forEach(folder => {
    const folderPath = path.join(rootDir, folder);
    if (fs.existsSync(folderPath)) {
        traverseDirectory(folderPath);
    }
});

fs.writeFileSync(outputFile, markdownContent);
console.log(`Codebase successfully exported to: ${outputFile}`);
