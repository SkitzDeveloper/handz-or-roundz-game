import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const maxAssetBytes = 25 * 1024 * 1024;

function posix(value) {
  return value.split(path.sep).join("/");
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

let files;
try {
  files = await walk(dist);
} catch {
  console.error("[cloudflare-limits] dist folder not found. Run vite build first.");
  process.exit(1);
}

const oversized = [];
let totalBytes = 0;

for (const file of files) {
  const info = await stat(file);
  totalBytes += info.size;
  if (info.size > maxAssetBytes) {
    oversized.push({ file, size: info.size });
  }
}

console.log(`[cloudflare-limits] dist size: ${formatBytes(totalBytes)} across ${files.length} files`);

if (oversized.length) {
  console.error("[cloudflare-limits] Cloudflare Pages rejects files over 25 MiB:");
  for (const item of oversized.sort((a, b) => b.size - a.size)) {
    console.error(`  ${formatBytes(item.size)}  ${posix(path.relative(dist, item.file))}`);
  }
  process.exit(1);
}

console.log("[cloudflare-limits] OK: no dist files exceed 25 MiB");
