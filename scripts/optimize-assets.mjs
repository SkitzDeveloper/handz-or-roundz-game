import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const publicRoot = path.join(projectRoot, "public");
const backupRoot = path.join(projectRoot, "asset-backups");
const dryRun = process.argv.includes("--dry-run");

const imageJobs = [
  { label: "portrait", dir: "portraits", pattern: /-thumbnail\.png$/i, max: 768 },
  { label: "crowd", dir: path.join("stages", "crowds"), pattern: /\.png$/i, max: 1600 },
  { label: "large png texture", dir: ".", pattern: /\.png$/i, minBytes: 2 * 1024 * 1024, max: 2048 },
  { label: "large jpg texture", dir: ".", pattern: /\.(jpe?g)$/i, minBytes: 2 * 1024 * 1024, max: 2048 },
];

const videoJobs = [
  {
    label: "opening menu video",
    file: path.join(publicRoot, "menu", "0527.mp4"),
    crf: 28,
  },
];

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function toPublicRelative(file) {
  return path.relative(projectRoot, file).replaceAll(path.sep, "/");
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function backupFile(file) {
  const rel = path.relative(projectRoot, file);
  const backup = path.join(backupRoot, rel);
  if (await fileExists(backup)) return;
  await fs.mkdir(path.dirname(backup), { recursive: true });
  await fs.copyFile(file, backup);
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

async function replaceIfSmaller(original, candidate, label) {
  const [before, after] = await Promise.all([fs.stat(original), fs.stat(candidate)]);
  if (after.size >= before.size) {
    await fs.rm(candidate, { force: true });
    console.log(`kept ${label}: ${toPublicRelative(original)} (${formatBytes(before.size)})`);
    return { before: before.size, after: before.size, changed: false };
  }

  if (!dryRun) {
    await backupFile(original);
    await fs.rename(candidate, original);
  } else {
    await fs.rm(candidate, { force: true });
  }

  const saved = before.size - after.size;
  console.log(`optimized ${label}: ${toPublicRelative(original)} ${formatBytes(before.size)} -> ${formatBytes(after.size)} saved ${formatBytes(saved)}`);
  return { before: before.size, after: after.size, changed: true };
}

async function optimizeImage(file, job) {
  const stat = await fs.stat(file);
  if (job.minBytes && stat.size < job.minBytes) return null;

  const metadata = await sharp(file, { limitInputPixels: false }).metadata();
  if (!metadata.width || !metadata.height) return null;

  const longestSide = Math.max(metadata.width, metadata.height);
  const shouldResize = longestSide > job.max;
  const temp = `${file}.optimized-${Date.now()}${path.extname(file)}`;

  let pipeline = sharp(file, { limitInputPixels: false });
  if (shouldResize) {
    pipeline = pipeline.resize({
      width: metadata.width >= metadata.height ? job.max : undefined,
      height: metadata.height > metadata.width ? job.max : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (/\.png$/i.test(file)) {
    pipeline = pipeline.png({
      adaptiveFiltering: true,
      compressionLevel: 9,
      effort: 10,
      palette: job.label === "portrait" || job.label === "crowd",
      quality: 92,
    });
  } else {
    pipeline = pipeline.jpeg({
      mozjpeg: true,
      progressive: true,
      quality: 84,
    });
  }

  await pipeline.toFile(temp);
  return replaceIfSmaller(file, temp, job.label);
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `ffmpeg exited with ${code}`));
    });
  });
}

async function optimizeVideo(job) {
  if (!(await fileExists(job.file))) return null;
  const temp = `${job.file}.optimized-${Date.now()}.mp4`;
  await runFfmpeg([
    "-y",
    "-i", job.file,
    "-map", "0:v:0",
    "-map", "0:a?",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", String(job.crf),
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "96k",
    "-movflags", "+faststart",
    temp,
  ]);
  return replaceIfSmaller(job.file, temp, job.label);
}

async function main() {
  console.log(dryRun ? "asset optimization dry run" : "asset optimization");
  const allFiles = await listFiles(publicRoot);
  const touched = new Set();
  const results = [];

  for (const job of imageJobs) {
    const base = path.join(publicRoot, job.dir);
    const files = job.dir === "." ? allFiles : (await fileExists(base) ? await listFiles(base) : []);
    for (const file of files) {
      if (touched.has(file) || !job.pattern.test(file)) continue;
      const result = await optimizeImage(file, job);
      if (result) {
        touched.add(file);
        results.push(result);
      }
    }
  }

  for (const job of videoJobs) {
    const result = await optimizeVideo(job);
    if (result) results.push(result);
  }

  const before = results.reduce((sum, result) => sum + result.before, 0);
  const after = results.reduce((sum, result) => sum + result.after, 0);
  const changed = results.filter(result => result.changed).length;
  console.log(`optimized ${changed} files, considered ${results.length}; saved ${formatBytes(before - after)}`);
  if (!dryRun) {
    console.log(`originals backed up under ${path.relative(projectRoot, backupRoot)}`);
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
