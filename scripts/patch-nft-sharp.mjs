// Removes sharp/@img entries from Next.js NFT traces to keep the Netlify
// function bundle under 250 MB. On Linux (Netlify), @img/sharp-libvips-linux-x64
// is ~150-200 MB and alone exceeds the limit. Sharp is never needed at runtime
// because @netlify/plugin-nextjs handles /_next/image via Netlify's image CDN.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const EXCLUDE = ['/sharp/', '/@img/'];

function findNftFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findNftFiles(full));
    else if (entry.name.endsWith('.nft.json')) results.push(full);
  }
  return results;
}

function patchNft(filePath) {
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const before = data.files?.length ?? 0;
  data.files = (data.files ?? []).filter(f => !EXCLUDE.some(p => f.includes(p)));
  const removed = before - data.files.length;
  if (removed > 0) {
    writeFileSync(filePath, JSON.stringify(data));
    console.log(`  ${filePath}: removed ${removed} entries`);
  }
  return removed;
}

const nftFiles = findNftFiles('.next');
let total = 0;
for (const f of nftFiles) total += patchNft(f);
console.log(`patch-nft-sharp: ${total} entries removed across ${nftFiles.length} NFT files`);
