import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const projectRoot = path.resolve(process.cwd());
const sourceDir = path.join(
  projectRoot,
  "public",
  "stages",
  "WAFFLE HOUSE NEW",
  "Meshy_AI_Waffle_House_Aftermat_0521004624_texture_fbx",
);
const sourceFbx = path.join(sourceDir, "Meshy_AI_Waffle_House_Aftermat_0521004624_texture.fbx");
const outputGlb = path.join(projectRoot, "public", "stages", "WAFFLE HOUSE NEW", "wafflehouse_stage_optimized.glb");

const MAX_TRIANGLES = 85000;

function installBrowserPolyfills() {
  globalThis.window = globalThis;
  globalThis.self = globalThis;
  globalThis.ProgressEvent ??= class ProgressEvent {
    constructor(type, init = {}) {
      this.type = type;
      Object.assign(this, init);
    }
  };
  globalThis.FileReader ??= class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.({ target: this });
      }).catch((error) => this.onerror?.(error));
    }

    readAsDataURL(blob) {
      blob.arrayBuffer().then((buffer) => {
        const base64 = Buffer.from(buffer).toString("base64");
        this.result = `data:${blob.type || "application/octet-stream"};base64,${base64}`;
        this.onloadend?.({ target: this });
      }).catch((error) => this.onerror?.(error));
    }
  };
}

async function importNodeFbxLoader() {
  const loaderPath = path.join(projectRoot, "node_modules", "three", "examples", "jsm", "loaders", "FBXLoader.js");
  const patchedPath = path.join(os.tmpdir(), `FBXLoader.node-patched-${Date.now()}.mjs`);
  const threeUrl = pathToFileURL(path.join(projectRoot, "node_modules", "three", "build", "three.module.js")).href;
  const fflateUrl = pathToFileURL(path.join(projectRoot, "node_modules", "three", "examples", "jsm", "libs", "fflate.module.js")).href;
  const nurbsUrl = pathToFileURL(path.join(projectRoot, "node_modules", "three", "examples", "jsm", "curves", "NURBSCurve.js")).href;

  let source = await fs.readFile(loaderPath, "utf8");
  source = source
    .replace(/from 'three';/, `from '${threeUrl}';`)
    .replace(/from '\.\.\/libs\/fflate\.module\.js';/, `from '${fflateUrl}';`)
    .replace(/from '\.\.\/curves\/NURBSCurve\.js';/, `from '${nurbsUrl}';`)
    .replace(
      "const texture = loader.load( fileName );",
      "const texture = new Texture(); texture.name = fileName;",
    );
  source = "const window = globalThis;\n" + source;

  await fs.writeFile(patchedPath, source, "utf8");
  return import(pathToFileURL(patchedPath).href);
}

function buildSampledGeometry(sourceGeometry, targetTriangles) {
  const geometry = sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone();
  const position = geometry.getAttribute("position");
  if (!position) return null;

  const uv = geometry.getAttribute("uv");
  const normal = geometry.getAttribute("normal");
  const triangleCount = Math.floor(position.count / 3);
  const stride = Math.max(1, Math.ceil(triangleCount / targetTriangles));
  const sampledTriangles = Math.ceil(triangleCount / stride);

  const positions = new Float32Array(sampledTriangles * 9);
  const uvs = uv ? new Float32Array(sampledTriangles * 6) : null;
  const normals = normal ? new Float32Array(sampledTriangles * 9) : null;

  let writeTriangle = 0;
  for (let triangle = 0; triangle < triangleCount; triangle += stride) {
    const outPosition = writeTriangle * 9;
    const outUv = writeTriangle * 6;
    for (let corner = 0; corner < 3; corner += 1) {
      const sourceIndex = triangle * 3 + corner;
      const positionIndex = outPosition + corner * 3;
      positions[positionIndex] = position.getX(sourceIndex);
      positions[positionIndex + 1] = position.getY(sourceIndex);
      positions[positionIndex + 2] = position.getZ(sourceIndex);

      if (uvs) {
        const uvIndex = outUv + corner * 2;
        uvs[uvIndex] = uv.getX(sourceIndex);
        uvs[uvIndex + 1] = uv.getY(sourceIndex);
      }

      if (normals) {
        normals[positionIndex] = normal.getX(sourceIndex);
        normals[positionIndex + 1] = normal.getY(sourceIndex);
        normals[positionIndex + 2] = normal.getZ(sourceIndex);
      }
    }
    writeTriangle += 1;
  }

  const sampled = new THREE.BufferGeometry();
  sampled.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  if (uvs) sampled.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  if (normals) sampled.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  else sampled.computeVertexNormals();
  sampled.computeBoundingBox();
  sampled.computeBoundingSphere();
  geometry.dispose();
  return sampled;
}

function summarize(object) {
  const stats = { meshes: 0, vertices: 0, triangles: 0 };
  object.traverse((child) => {
    if (!child.isMesh) return;
    const position = child.geometry?.getAttribute("position");
    stats.meshes += 1;
    stats.vertices += position?.count ?? 0;
    stats.triangles += Math.floor((position?.count ?? 0) / 3);
  });
  return stats;
}

async function exportGlb(object) {
  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      object,
      (result) => resolve(result),
      (error) => reject(error),
      { binary: true, onlyVisible: true, trs: false },
    );
  });
}

installBrowserPolyfills();
const { FBXLoader } = await importNodeFbxLoader();

const buffer = await fs.readFile(sourceFbx);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const raw = new FBXLoader().parse(arrayBuffer, pathToFileURL(`${sourceDir}${path.sep}`).href);
raw.updateMatrixWorld(true);

const rawStats = summarize(raw);
const sampledRoot = new THREE.Group();
const meshes = [];
raw.traverse((child) => {
  if (child.isMesh && child.geometry) meshes.push(child);
});

const trianglesPerMesh = Math.max(8000, Math.floor(MAX_TRIANGLES / Math.max(1, meshes.length)));
for (const mesh of meshes) {
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(mesh.matrixWorld);
  const sampledGeometry = buildSampledGeometry(geometry, trianglesPerMesh);
  geometry.dispose();
  if (!sampledGeometry) continue;

  const sampledMesh = new THREE.Mesh(
    sampledGeometry,
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  sampledMesh.name = `${mesh.name || "wafflehouse"}_optimized`;
  sampledRoot.add(sampledMesh);
}

const glb = await exportGlb(sampledRoot);
await fs.writeFile(outputGlb, Buffer.from(glb));

const optimizedStats = summarize(sampledRoot);
console.log(JSON.stringify({
  sourceFbx,
  outputGlb,
  rawBytes: buffer.byteLength,
  outputBytes: (await fs.stat(outputGlb)).size,
  rawStats,
  optimizedStats,
}, null, 2));
