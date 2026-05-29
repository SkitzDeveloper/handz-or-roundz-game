import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const publicRoot = path.join(projectRoot, "public");

const dryRun = process.argv.includes("--dry-run");

const stageModels = [
  {
    label: "Skitz combat GLB",
    input: path.join(publicRoot, "models", "urban_noir_fighter.glb"),
    output: path.join(publicRoot, "models", "urban_noir_fighter.runtime.glb"),
    textureSize: 2048,
  },
  {
    label: "Red Bull DYS stage GLB",
    input: path.join(publicRoot, "stages", "redbulldys", "Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_fbx", "redbull_dys_runtime.glb"),
    output: path.join(publicRoot, "stages", "redbulldys", "Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_fbx", "redbull_dys_runtime.mobile.glb"),
    textureSize: 2048,
  },
  {
    label: "Skate Bowl stage GLB",
    input: path.join(publicRoot, "stages", "durhamskatebowl", "Meshy_AI_Urban_Graffiti_Skate__0523184622_texture_fbx", "skate_bowl_runtime.glb"),
    output: path.join(publicRoot, "stages", "durhamskatebowl", "Meshy_AI_Urban_Graffiti_Skate__0523184622_texture_fbx", "skate_bowl_runtime.mobile.glb"),
    textureSize: 2048,
  },
  {
    label: "NC Graffiti stage GLB",
    input: path.join(publicRoot, "stages", "nc state graffiti", "Meshy_AI_Night_at_the_Vintage__0523143540_texture_fbx", "nc_graffiti_runtime.glb"),
    output: path.join(publicRoot, "stages", "nc state graffiti", "Meshy_AI_Night_at_the_Vintage__0523143540_texture_fbx", "nc_graffiti_runtime.mobile.glb"),
    textureSize: 2048,
  },
  {
    label: "Da Bull stage GLB",
    input: path.join(publicRoot, "stages", "da Bull", "Meshy_AI_Skybound_Bull_Plaza_0525000655_texture_fbx", "da_bull_runtime.glb"),
    output: path.join(publicRoot, "stages", "da Bull", "Meshy_AI_Skybound_Bull_Plaza_0525000655_texture_fbx", "da_bull_runtime.mobile.glb"),
    textureSize: 2048,
  },
  {
    label: "Waffle House stage GLB",
    input: path.join(publicRoot, "stages", "WAFFLE HOUSE NEW", "wafflehouse_stage_optimized.glb"),
    output: path.join(publicRoot, "stages", "WAFFLE HOUSE NEW", "wafflehouse_stage_optimized.mobile.glb"),
    textureSize: 2048,
  },
];

const textureJobs = [
  {
    label: "Skitz combat texture",
    input: path.join(publicRoot, "skitz", "Meshy_AI_Urban_Noir_0514212211_texture_fbx", "Meshy_AI_Urban_Noir_0514212211_texture.png"),
    output: path.join(publicRoot, "skitz", "Meshy_AI_Urban_Noir_0514212211_texture_fbx", "Meshy_AI_Urban_Noir_0514212211_texture.runtime.webp"),
    max: 2048,
    format: "webp",
    quality: 88,
  },
  ...stageTextureJobs("redbulldys", "Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_fbx", "Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture"),
  ...stageTextureJobs("durhamskatebowl", "Meshy_AI_Urban_Graffiti_Skate__0523184622_texture_fbx", "Meshy_AI_Urban_Graffiti_Skate__0523184622_texture"),
  ...stageTextureJobs("nc state graffiti", "Meshy_AI_Night_at_the_Vintage__0523143540_texture_fbx", "Meshy_AI_Night_at_the_Vintage__0523143540_texture"),
  ...stageTextureJobs("da Bull", "Meshy_AI_Skybound_Bull_Plaza_0525000655_texture_fbx", "Meshy_AI_Skybound_Bull_Plaza_0525000655_texture"),
];

function stageTextureJobs(stageDir, assetDir, stem) {
  const base = path.join(publicRoot, "stages", stageDir, assetDir);
  return [
    {
      label: `${stageDir} base color`,
      input: path.join(base, `${stem}.png`),
      output: path.join(base, `${stem}.runtime.webp`),
      max: 2048,
      format: "webp",
      quality: 86,
    },
    {
      label: `${stageDir} emissive`,
      input: path.join(base, `${stem}_emit.png`),
      output: path.join(base, `${stem}_emit.runtime.webp`),
      max: 2048,
      format: "webp",
      quality: 86,
    },
    {
      label: `${stageDir} metallic`,
      input: path.join(base, `${stem}_metallic.png`),
      output: path.join(base, `${stem}_metallic.runtime.png`),
      max: 2048,
      format: "png",
    },
    {
      label: `${stageDir} roughness`,
      input: path.join(base, `${stem}_roughness.png`),
      output: path.join(base, `${stem}_roughness.runtime.png`),
      max: 2048,
      format: "png",
    },
    {
      label: `${stageDir} normal`,
      input: path.join(base, `${stem}_normal.png`),
      output: path.join(base, `${stem}_normal.runtime.png`),
      max: 2048,
      format: "png",
    },
  ];
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function rel(file) {
  return path.relative(projectRoot, file).replaceAll(path.sep, "/");
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"], shell: false });
    let stderr = "";
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function runGltfTransform(command, input, output, args = []) {
  const cli = path.join(projectRoot, "node_modules", "@gltf-transform", "cli", "bin", "cli.js");
  await run(process.execPath, [cli, command, input, output, ...args]);
}

async function replaceCopyIfSmaller(input, output, temp, label) {
  const [before, after] = await Promise.all([fs.stat(input), fs.stat(temp)]);
  if (after.size >= before.size) {
    await fs.rm(temp, { force: true });
    console.log(`kept original target for ${label}: ${rel(input)} (${formatBytes(before.size)})`);
    return { label, before: before.size, after: before.size, output, changed: false };
  }

  if (!dryRun) {
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.rename(temp, output);
  } else {
    await fs.rm(temp, { force: true });
  }

  console.log(`optimized ${label}: ${formatBytes(before.size)} -> ${formatBytes(after.size)} (${rel(output)})`);
  return { label, before: before.size, after: after.size, output, changed: true };
}

async function optimizeStageModel(job) {
  if (!(await exists(job.input))) {
    console.warn(`missing ${job.label}: ${rel(job.input)}`);
    return null;
  }

  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const resized = `${job.output}.${suffix}.resize.glb`;
  const pruned = `${job.output}.${suffix}.prune.glb`;
  const deduped = `${job.output}.${suffix}.dedup.glb`;
  const optimized = `${job.output}.${suffix}.optimized.glb`;

  await runGltfTransform("resize", job.input, resized, ["--width", String(job.textureSize), "--height", String(job.textureSize)]);
  await runGltfTransform("prune", resized, pruned, ["--keep-attributes", "true", "--keep-indices", "true", "--keep-leaves", "true", "--keep-solid-textures", "true"]);
  await fs.rm(resized, { force: true });
  await runGltfTransform("dedup", pruned, deduped);
  await fs.rm(pruned, { force: true });
  await fs.rename(deduped, optimized);

  return replaceCopyIfSmaller(job.input, job.output, optimized, job.label);
}

async function optimizeTexture(job) {
  if (!(await exists(job.input))) {
    console.warn(`missing ${job.label}: ${rel(job.input)}`);
    return null;
  }

  const metadata = await sharp(job.input, { limitInputPixels: false }).metadata();
  const temp = `${job.output}.${Date.now()}-${Math.random().toString(16).slice(2)}${path.extname(job.output)}`;

  let image = sharp(job.input, { limitInputPixels: false });
  if (metadata.width && metadata.height && Math.max(metadata.width, metadata.height) > job.max) {
    image = image.resize({
      width: metadata.width >= metadata.height ? job.max : undefined,
      height: metadata.height > metadata.width ? job.max : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (job.format === "webp") {
    image = image.webp({ quality: job.quality ?? 86, effort: 6 });
  } else {
    image = image.png({ adaptiveFiltering: true, compressionLevel: 9, effort: 10 });
  }

  await image.toFile(temp);
  return replaceCopyIfSmaller(job.input, job.output, temp, job.label);
}

async function main() {
  console.log(dryRun ? "conservative runtime asset optimization dry run" : "conservative runtime asset optimization");
  const results = [];

  for (const job of stageModels) {
    const result = await optimizeStageModel(job);
    if (result) results.push(result);
  }

  for (const job of textureJobs) {
    const result = await optimizeTexture(job);
    if (result) results.push(result);
  }

  const before = results.reduce((sum, result) => sum + result.before, 0);
  const after = results.reduce((sum, result) => sum + result.after, 0);
  const changed = results.filter(result => result.changed).length;
  console.log(`optimized ${changed}/${results.length} runtime copies; saved ${formatBytes(before - after)} from loaded runtime asset paths`);
  console.log("original source files were left in place");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
