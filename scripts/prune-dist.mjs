import { rm, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const posix = value => value.split(path.sep).join("/");

const removeDirs = [
  "mockv/Meshy_AI_Urban_Swagger_0515190027_texture_fbx",
  "Xtra/Meshy_AI_Leather_Rebel_Portrai_biped",
  "stages/da Bull/Meshy_AI_3d_render_of_downtown_0523195119_texture_fbx",
  "stages/WAFFLE HOUSE NEW/Meshy_AI_Waffle_House_Aftermat_0520231457_texture_fbx",
  "stages/WAFFLE HOUSE NEW/Meshy_AI_Waffle_House_Aftermat_0521004624_texture_fbx",
];

const removeFiles = new Set([
  "models/urban_noir_fighter.glb",
  "models/walking.glb",
  "skitz/.fbx",
  "stages/WAFFLE HOUSE NEW/wafflehouse_stage_optimized.glb",
  "stages/da Bull/Meshy_AI_Skybound_Bull_Plaza_0525000655_texture_fbx/da_bull_runtime.glb",
  "stages/da Bull/Meshy_AI_Skybound_Bull_Plaza_0525000655_texture_fbx/Meshy_AI_Skybound_Bull_Plaza_0525000655_texture.fbx",
  "stages/durhamskatebowl/Meshy_AI_Urban_Graffiti_Skate__0523184622_texture_fbx/skate_bowl_runtime.glb",
  "stages/durhamskatebowl/Meshy_AI_Urban_Graffiti_Skate__0523184622_texture_fbx/Meshy_AI_Urban_Graffiti_Skate__0523184622_texture.fbx",
  "stages/nc state graffiti/Meshy_AI_Night_at_the_Vintage__0523143540_texture_fbx/nc_graffiti_runtime.glb",
  "stages/nc state graffiti/Meshy_AI_Night_at_the_Vintage__0523143540_texture_fbx/Meshy_AI_Night_at_the_Vintage__0523143540_texture.fbx",
  "stages/redbulldys/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_fbx/redbull_dys_runtime.glb",
  "stages/redbulldys/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_fbx/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture.fbx",
]);

function shouldRemove(relativePath) {
  const rel = posix(relativePath);
  if (rel.toLowerCase().endsWith(".zip")) return true;
  if (rel.includes(".fbm/")) return true;
  if (removeFiles.has(rel)) return true;

  if (rel.startsWith("skitz/Meshy_AI_Urban_Noir_0514212211_texture_fbx/")) {
    return !rel.endsWith("Meshy_AI_Urban_Noir_0514212211_texture.png");
  }

  if (rel.includes("_texture_fbx/")) {
    if (/\.runtime\.(webp|png)$/i.test(rel)) return true;
  }

  return removeDirs.some(dir => rel === dir || rel.startsWith(`${dir}/`));
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

async function removeEmptyDirs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await removeEmptyDirs(path.join(dir, entry.name));
  }

  if (dir === dist) return;

  const remaining = await readdir(dir);
  if (remaining.length === 0) {
    await rm(dir, { recursive: true, force: true });
  }
}

let removedFiles = 0;
let removedBytes = 0;

try {
  await stat(dist);
} catch {
  console.error("[prune-dist] dist folder not found. Run vite build first.");
  process.exit(1);
}

for (const file of await walk(dist)) {
  const relativePath = path.relative(dist, file);
  if (!shouldRemove(relativePath)) continue;

  const info = await stat(file);
  await rm(file, { force: true });
  removedFiles += 1;
  removedBytes += info.size;
}

await removeEmptyDirs(dist);

console.log(`[prune-dist] Removed ${removedFiles} deploy-only source/archive files (${(removedBytes / 1024 / 1024).toFixed(2)} MB).`);
