import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import "./style.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

THREE.Cache.enabled = true;

// IMPORTANT: Combat stays on the old GLB rig because the existing attack FBX files
// were authored on the old skeleton. Today's textured Fighting Idle.fbx is only
// used as a menu/preview asset until all attacks are re-exported on the same skeleton.
const MODEL_URL = "/models/idle.glb";

const SKITZ_TEXTURE_URL = "/skitz/Meshy_AI_Urban_Noir_0514212211_texture_fbx/Meshy_AI_Urban_Noir_0514212211_texture.png";

function applySkitzTextureToCombatModel(model, texture) {
  if (!model || !texture) return;

  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const texturedMaterials = sourceMaterials.map((material) => {
      const nextMaterial = material.clone();
      nextMaterial.map = texture;
      nextMaterial.color = new THREE.Color(0xffffff);
      nextMaterial.side = THREE.DoubleSide;
      nextMaterial.transparent = false;
      nextMaterial.opacity = 1;
      nextMaterial.alphaTest = 0;
      nextMaterial.depthWrite = true;
      nextMaterial.depthTest = true;

      if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.min(nextMaterial.roughness, 0.62);
      if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(nextMaterial.metalness, 0.25);
      if ("emissive" in nextMaterial) {
        nextMaterial.emissive = new THREE.Color("#080808");
        nextMaterial.emissiveIntensity = 0.1;
      }

      nextMaterial.needsUpdate = true;
      return nextMaterial;
    });

    child.material = Array.isArray(child.material) ? texturedMaterials : texturedMaterials[0];
  });
}

function brightenJoseModel(model) {
  if (!model) return;

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    child.castShadow = false;
    child.receiveShadow = false;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const brightMaterials = sourceMaterials.map((material) => {
      const nextMaterial = material.clone();

      // Jose's black outfit was disappearing into the dark stage.
      // Keep the outfit dark, but lift the material so it catches light like a fighter select model.
      if (nextMaterial.color) nextMaterial.color.multiplyScalar(1.55);
      if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.min(nextMaterial.roughness, 0.52);
      if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(nextMaterial.metalness, 0.18);
      if ("emissive" in nextMaterial) {
        nextMaterial.emissive = new THREE.Color("#2b2b2b");
        nextMaterial.emissiveIntensity = 0.38;
      }

      nextMaterial.side = THREE.DoubleSide;
      nextMaterial.needsUpdate = true;
      return nextMaterial;
    });

    child.material = Array.isArray(child.material) ? brightMaterials : brightMaterials[0];
  });
}


function brightenMockvModel(model) {
  if (!model) return;

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    child.castShadow = false;
    child.receiveShadow = false;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const brightMaterials = sourceMaterials.map((material) => {
      const nextMaterial = material.clone();
      if (nextMaterial.color) nextMaterial.color.multiplyScalar(1.42);
      if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.min(nextMaterial.roughness, 0.56);
      if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(nextMaterial.metalness, 0.22);
      if ("emissive" in nextMaterial) {
        nextMaterial.emissive = new THREE.Color("#242424");
        nextMaterial.emissiveIntensity = 0.30;
      }
      nextMaterial.side = THREE.DoubleSide;
      nextMaterial.needsUpdate = true;
      return nextMaterial;
    });

    child.material = Array.isArray(child.material) ? brightMaterials : brightMaterials[0];
  });
}

function brightenXtraModel(model) {
  if (!model) return;

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    child.castShadow = false;
    child.receiveShadow = false;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const brightMaterials = sourceMaterials.map((material) => {
      const nextMaterial = material.clone();
      if (nextMaterial.color) nextMaterial.color.multiplyScalar(1.46);
      if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.min(nextMaterial.roughness, 0.54);
      if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(nextMaterial.metalness, 0.20);
      if ("emissive" in nextMaterial) {
        nextMaterial.emissive = new THREE.Color("#1e2f1e");
        nextMaterial.emissiveIntensity = 0.32;
      }
      nextMaterial.side = THREE.DoubleSide;
      nextMaterial.needsUpdate = true;
      return nextMaterial;
    });

    child.material = Array.isArray(child.material) ? brightMaterials : brightMaterials[0];
  });
}

function brightenTerrorEastModel(model) {
  if (!model) return;

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    child.castShadow = false;
    child.receiveShadow = false;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const brightMaterials = sourceMaterials.map((material) => {
      const nextMaterial = material.clone();
      if (nextMaterial.color) nextMaterial.color.multiplyScalar(1.5);
      if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.min(nextMaterial.roughness, 0.52);
      if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(nextMaterial.metalness, 0.18);
      if ("emissive" in nextMaterial) {
        nextMaterial.emissive = new THREE.Color("#2a1d1d");
        nextMaterial.emissiveIntensity = 0.34;
      }
      nextMaterial.side = THREE.DoubleSide;
      nextMaterial.needsUpdate = true;
      return nextMaterial;
    });

    child.material = Array.isArray(child.material) ? brightMaterials : brightMaterials[0];
  });
}

function brightenReignModel(model) {
  if (!model) return;

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;

    child.castShadow = false;
    child.receiveShadow = false;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const brightMaterials = sourceMaterials.map((material) => {
      const nextMaterial = material.clone();
      if (nextMaterial.color) nextMaterial.color.multiplyScalar(1.48);
      if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.min(nextMaterial.roughness, 0.52);
      if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(nextMaterial.metalness, 0.18);
      if ("emissive" in nextMaterial) {
        nextMaterial.emissive = new THREE.Color("#241f18");
        nextMaterial.emissiveIntensity = 0.34;
      }
      nextMaterial.side = THREE.DoubleSide;
      nextMaterial.needsUpdate = true;
      return nextMaterial;
    });

    child.material = Array.isArray(child.material) ? brightMaterials : brightMaterials[0];
  });
}

const ANIMATION_URLS = {
  idle:        "/skitz/Fighting Idle.fbx",
  walk:        "/skitz/walkingforward.fbx",
  back:        "/skitz/walkingbackwards.fbx",
  crouch:      "/skitz/crouch.fbx",
  jump:        "/skitz/Jump.fbx",
  punch1:      "/skitz/punch1.fbx",
  punch2:      "/skitz/punch2.fbx",
  punch3:      "/skitz/punch3.fbx",
  heavyPunch1: "/skitz/heavypunch1.fbx",
  heavyPunch2: "/skitz/heavypunch2.fbx",
  kick1:       "/skitz/kick1.fbx",
  kick2:       "/skitz/kick2.fbx",
  kick3:       "/skitz/Kick3.fbx",
  heavyKick1:  "/skitz/heavykick1.fbx",
  heavyKick2:  "/skitz/heavykick1.fbx",
  punchReaction: "/skitz/punchreaction.fbx",
  kickReaction:  "/skitz/kickreaction.fbx",
  heavyKickReaction: "/skitz/kickreaction.fbx",
  heavyHitAttackReaction: "/skitz/standingreaction.fbx",
  standingReaction: "/skitz/standingreaction.fbx",
  flyingBackDamageReaction: "/skitz/Flyingbackdamagereaction.fbx",
  getUpAfterDamage: "/skitz/gettingupafterdamage.fbx",
  faceHit:     "/skitz/Receive Punch To The Face.fbx",
  stunned:     "/skitz/die.fbx",
  die:         "/skitz/die.fbx",
  block:       "/skitz/Block.fbx",          // ← NEW
};

const JOSE_MODEL_URL = "/Jose/idle.fbx"; // Jose idle.fbx has his full skin/mesh. Folder is capital J on disk.
const MOCKV_MODEL_URL = "/mockv/idle.fbx"; // Mockv idle.fbx has his full skin/mesh.
const XTRA_MODEL_URL = "/Xtra/idle.fbx"; // Xtra idle.fbx has his full skin/mesh.
const TERROR_EAST_MODEL_URL = "/terror%20east/Idle.fbx"; // Terror East Idle.fbx has his full skin/mesh.
const REIGN_MODEL_URL = "/reign/Idle.fbx"; // Reign Idle.fbx has his full skin/mesh.
const WAFFLEHOUSE_MODEL_URL = "/stages/WAFFLE%20HOUSE%20NEW/wafflehouse_stage_optimized.mobile.glb";
const WAFFLEHOUSE_ENV_URL = "/stages/rooftop_night_polyhaven.jpg";
const WAFFLEHOUSE_SKY_URL = "/stages/WAFFLE%20HOUSE%20NEW/skybackground.png";
const WAFFLEHOUSE_CROWD_URLS = [
  "/stages/crowds/crowd.png",
  "/stages/crowds/crowd2.png",
  "/stages/crowds/crowd3.png",
  "/stages/crowds/crowd4.png",
  "/stages/crowds/crowd5.png",
];
const REDBULL_DYS_BASE_URL = "/stages/redbulldys/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_fbx";
const REDBULL_DYS_MODEL_URL = `${REDBULL_DYS_BASE_URL}/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture.fbx`;
const REDBULL_DYS_RUNTIME_MODEL_URL = `${REDBULL_DYS_BASE_URL}/redbull_dys_runtime.mobile.glb`;
const REDBULL_DYS_TEXTURE_URL = `${REDBULL_DYS_BASE_URL}/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture.png`;
const REDBULL_DYS_EMISSIVE_URL = `${REDBULL_DYS_BASE_URL}/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_emit.png`;
const REDBULL_DYS_METALLIC_URL = `${REDBULL_DYS_BASE_URL}/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_metallic.png`;
const REDBULL_DYS_ROUGHNESS_URL = `${REDBULL_DYS_BASE_URL}/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_roughness.png`;
const REDBULL_DYS_NORMAL_URL = `${REDBULL_DYS_BASE_URL}/Meshy_AI_Red_Bull_Dance_Your_S_0523060528_texture_normal.png`;
const SKATE_BOWL_BASE_URL = "/stages/durhamskatebowl/Meshy_AI_Urban_Graffiti_Skate__0523184622_texture_fbx";
const NC_GRAFFITI_BASE_URL = "/stages/nc%20state%20graffiti/Meshy_AI_Night_at_the_Vintage__0523143540_texture_fbx";
const DA_BULL_BASE_URL = "/stages/da%20Bull/Meshy_AI_Skybound_Bull_Plaza_0525000655_texture_fbx";
const DA_BULL_SKY_URL = "/stages/da%20Bull/sky.webp";

function makeMeshyStageAsset(baseUrl, stem) {
  return {
    model: `${baseUrl}/${stem}.fbx`,
    texture: `${baseUrl}/${stem}.png`,
    emissive: `${baseUrl}/${stem}_emit.png`,
    metalness: `${baseUrl}/${stem}_metallic.png`,
    roughness: `${baseUrl}/${stem}_roughness.png`,
    normal: `${baseUrl}/${stem}_normal.png`,
  };
}

const SKATE_BOWL_STAGE_ASSET = {
  ...makeMeshyStageAsset(SKATE_BOWL_BASE_URL, "Meshy_AI_Urban_Graffiti_Skate__0523184622_texture"),
  runtimeModel: `${SKATE_BOWL_BASE_URL}/skate_bowl_runtime.mobile.glb`,
};
const NC_GRAFFITI_STAGE_ASSET = {
  ...makeMeshyStageAsset(NC_GRAFFITI_BASE_URL, "Meshy_AI_Night_at_the_Vintage__0523143540_texture"),
  runtimeModel: `${NC_GRAFFITI_BASE_URL}/nc_graffiti_runtime.mobile.glb`,
};
const DA_BULL_STAGE_ASSET = {
  ...makeMeshyStageAsset(DA_BULL_BASE_URL, "Meshy_AI_Skybound_Bull_Plaza_0525000655_texture"),
  runtimeModel: `${DA_BULL_BASE_URL}/da_bull_runtime.mobile.glb`,
};

const PREVIEW_TARGET_HEIGHT = { skitz: 2.15, jose: 2.15, mockv: 2.15, xtra: 2.15, terrorEast: 2.15, reign: 2.15 };
const COMBAT_TARGET_HEIGHT = { skitz: 2.25, jose: 2.20, mockv: 2.22, xtra: 2.22, terrorEast: 2.22, reign: 2.22 };
const THUMBNAIL_FRAME = {
  skitz: { targetHeight: 1.92, yOffset: -0.90, x: 0, camera: { position: [0, 0.28, 5.25], fov: 34 } },
  jose: { targetHeight: 2.05, yOffset: -1.18, x: 0.02, camera: { position: [0, 0.28, 5.35], fov: 35 } },
  mockv: { targetHeight: 2.05, yOffset: -1.18, x: 0.02, camera: { position: [0, 0.28, 5.35], fov: 35 } },
  xtra: { targetHeight: 2.02, yOffset: -1.17, x: 0.02, camera: { position: [0, 0.28, 5.35], fov: 35 } },
  terrorEast: { targetHeight: 2.03, yOffset: -1.17, x: 0.02, camera: { position: [0, 0.28, 5.35], fov: 35 } },
  reign: { targetHeight: 2.03, yOffset: -1.17, x: 0.02, camera: { position: [0, 0.28, 5.35], fov: 35 } },
};

function getAutoFitScaleAndFloorOffset(model, targetHeight) {
  if (!model) return { scale: 1, floorOffset: 0 };
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (!Number.isFinite(size.y) || size.y <= 0.0001) return { scale: 1, floorOffset: 0 };
  const scale = targetHeight / size.y;
  const floorOffset = Number.isFinite(box.min.y) ? -box.min.y * scale : 0;
  return { scale, floorOffset };
}

const JOSE_ANIMATION_URLS = {
  idle:        "/Jose/idle.fbx",
  walk:        "/Jose/walking.fbx",
  back:        "/Jose/walking.fbx",
  crouch:      "/Jose/crouch.fbx",
  jump:        "/Jose/idle.fbx",
  punch1:      "/Jose/punch1.fbx",
  punch2:      "/Jose/punch2.fbx",
  punch3:      "/Jose/punch3.fbx",
  heavyPunch1: "/Jose/heavypunch1.fbx",
  // No separate heavypunch2 file is visible in the Jose folder screenshot yet.
  // Keep the move playable by using heavypunch1 until a true heavypunch2.fbx is added.
  heavyPunch2: "/Jose/heavypunch1.fbx",
  kick1:       "/Jose/kick1.fbx",
  kick2:       "/Jose/kick2.fbx",
  kick3:       "/Jose/kick3.fbx",
  heavyKick1:  "/Jose/heavykick1.fbx",
  heavyKick2:  "/Jose/heavykick2.fbx",
  heavyKick3:  "/Jose/heavykick3.fbx",
  punchReaction:  "/Jose/punchreact1.fbx",
  punch2Reaction: "/Jose/punchreact2.fbx",
  punch3Reaction: "/Jose/punchreact3.fbx",
  kickReaction:   "/Jose/kickreact1.fbx",
  heavyPunchReaction: "/Jose/heavypunchreact3.fbx",
  heavyKickReaction:  "/Jose/heavykickreact1.fbx",
  heavyHitAttackReaction: "/Jose/heavykickreact2.fbx",
  standingReaction: "/Jose/punchreact1.fbx",
  flyingBackDamageReaction: "/Jose/heavykickreact2.fbx",
  getUpAfterDamage: "/Jose/getup.fbx",
  faceHit:     "/Jose/punchreact2.fbx",
  stunned:     "/Jose/heavykickreact1.fbx",
  die:         "/Jose/die.fbx",
  // Jose now has his own guard animation.
  block:       "/Jose/block.fbx",
};


const MOCKV_ANIMATION_URLS = {
  idle:        "/mockv/idle.fbx",
  walk:        "/mockv/walkingforward.fbx",
  back:        "/mockv/walkingbackward.fbx",
  crouch:      "/mockv/idle.fbx",
  jump:        "/mockv/jump.fbx",
  punch1:      "/mockv/punch1.fbx",
  punch2:      "/mockv/punch2.fbx",
  punch3:      "/mockv/punch3.fbx",
  punch4:      "/mockv/punch4.fbx",
  heavyPunch1: "/mockv/heavypunch1.fbx",
  heavyPunch2: "/mockv/heavypunch2.fbx",
  heavyAttack3:"/mockv/heavypunch3.fbx",
  kick1:       "/mockv/kick1.fbx",
  kick2:       "/mockv/kick2.fbx",
  heavyKick1:  "/mockv/heavykick1.fbx",
  heavyKick2:  "/mockv/heavykick2.fbx",
  punchReaction:  "/mockv/punchreact.fbx",
  punch2Reaction: "/mockv/punchreact2.fbx",
  punch3Reaction: "/mockv/punchreact2.fbx",
  kickReaction:   "/mockv/kickreact1.fbx",
  heavyPunchReaction: "/mockv/stunreact.fbx",
  heavyKickReaction:  "/mockv/heavykickreact.fbx",
  heavyHitAttackReaction: "/mockv/stunreact.fbx",
  standingReaction: "/mockv/Standbackup.fbx",
  flyingBackDamageReaction: "/mockv/stunreact.fbx",
  getUpAfterDamage: "/mockv/Standbackup.fbx",
  faceHit:     "/mockv/punchreact.fbx",
  stunned:     "/mockv/stunreact.fbx",
  die:         "/mockv/die.fbx",
  block:       "/mockv/block.fbx",
};

const XTRA_ANIMATION_URLS = {
  idle:        "/Xtra/idle.fbx",
  walk:        "/Xtra/idle.fbx",
  back:        "/Xtra/idle.fbx",
  crouch:      "/Xtra/crouch.fbx",
  jump:        "/Xtra/idle.fbx",
  punch1:      "/Xtra/punch1.fbx",
  punch2:      "/Xtra/punch2.fbx",
  punch3:      "/Xtra/punch3.fbx",
  heavyPunch1: "/Xtra/heavykick1.fbx",
  heavyPunch2: "/Xtra/heavykick2.fbx",
  kick1:       "/Xtra/kick1.fbx",
  kick2:       "/Xtra/kick2.fbx",
  kick3:       "/Xtra/kick3.fbx",
  heavyKick1:  "/Xtra/heavykick1.fbx",
  heavyKick2:  "/Xtra/heavykick2.fbx",
  punchReaction:  "/Xtra/punchreact1.fbx",
  punch2Reaction: "/Xtra/punchreact2.fbx",
  punch3Reaction: "/Xtra/punchreact3.fbx",
  kickReaction:   "/Xtra/kickreact1.fbx",
  heavyPunchReaction: "/Xtra/stun.fbx",
  heavyKickReaction:  "/Xtra/kickreact2.fbx",
  heavyHitAttackReaction: "/Xtra/stun.fbx",
  standingReaction: "/Xtra/punchreact1.fbx",
  flyingBackDamageReaction: "/Xtra/stun.fbx",
  getUpAfterDamage: "/Xtra/getup.fbx",
  faceHit:     "/Xtra/punchreact1.fbx",
  stunned:     "/Xtra/stun.fbx",
  die:         "/Xtra/die.fbx",
  block:       "/Xtra/block.fbx",
};

const TERROR_EAST_ANIMATION_URLS = {
  idle:        "/terror%20east/Idle.fbx",
  walk:        "/terror%20east/walking.fbx",
  back:        "/terror%20east/walking.fbx",
  crouch:      "/terror%20east/Idle.fbx",
  jump:        "/terror%20east/Idle.fbx",
  punch1:      "/terror%20east/punch1.fbx",
  punch2:      "/terror%20east/punch2.fbx",
  punch3:      "/terror%20east/punch3.fbx",
  heavyPunch1: "/terror%20east/heavykick.fbx",
  heavyPunch2: "/terror%20east/heavykick2.fbx",
  kick1:       "/terror%20east/kick1.fbx",
  kick2:       "/terror%20east/kick2.fbx",
  kick3:       "/terror%20east/kick3.fbx",
  heavyKick1:  "/terror%20east/heavykick.fbx",
  heavyKick2:  "/terror%20east/heavykick2.fbx",
  punchReaction:  "/terror%20east/hitreact1.fbx",
  punch2Reaction: "/terror%20east/hitreact2.fbx",
  punch3Reaction: "/terror%20east/hitreact3.fbx",
  kickReaction:   "/terror%20east/hitreact1.fbx",
  heavyPunchReaction: "/terror%20east/hitreact3.fbx",
  heavyKickReaction:  "/terror%20east/hitreact3.fbx",
  heavyHitAttackReaction: "/terror%20east/hitreact3.fbx",
  standingReaction: "/terror%20east/hitreact1.fbx",
  flyingBackDamageReaction: "/terror%20east/Stunned.fbx",
  getUpAfterDamage: "/terror%20east/Stunned.fbx",
  faceHit:     "/terror%20east/hitreact1.fbx",
  stunned:     "/terror%20east/Stunned.fbx",
  die:         "/terror%20east/die.fbx",
  block:       "/terror%20east/block.fbx",
};

const REIGN_ANIMATION_URLS = {
  idle:        "/reign/Idle.fbx",
  walk:        "/reign/Idle.fbx",
  back:        "/reign/Idle.fbx",
  crouch:      "/reign/Idle.fbx",
  jump:        "/reign/Idle.fbx",
  punch1:      "/reign/punch1.fbx",
  punch2:      "/reign/punch2.fbx",
  heavyPunch1: "/reign/heavypunch.fbx",
  heavyPunch2: "/reign/heavypunch.fbx",
  kick1:       "/reign/kick1.fbx",
  kick2:       "/reign/kick2.fbx",
  kick3:       "/reign/kick3.fbx",
  heavyKick1:  "/reign/heavykick.fbx",
  heavyKick2:  "/reign/heavykick.fbx",
  punchReaction:  "/reign/punchreaction1.fbx",
  punch2Reaction: "/reign/hitreaction2.fbx",
  punch3Reaction: "/reign/hutreaction3.fbx",
  kickReaction:   "/reign/hitreaction.fbx",
  heavyPunchReaction: "/reign/hutreaction3.fbx",
  heavyKickReaction:  "/reign/hutreaction3.fbx",
  heavyHitAttackReaction: "/reign/hutreaction3.fbx",
  standingReaction: "/reign/hitreaction.fbx",
  flyingBackDamageReaction: "/reign/stunned.fbx",
  getUpAfterDamage: "/reign/getup.fbx",
  faceHit:     "/reign/punchreaction1.fbx",
  stunned:     "/reign/stunned.fbx",
  die:         "/reign/die.fbx",
  block:       "/reign/block.fbx",
};

function getAnimationUrls(characterId) {
  if (characterId === "jose") return JOSE_ANIMATION_URLS;
  if (characterId === "mockv") return MOCKV_ANIMATION_URLS;
  if (characterId === "xtra") return XTRA_ANIMATION_URLS;
  if (characterId === "terrorEast") return TERROR_EAST_ANIMATION_URLS;
  if (characterId === "reign") return REIGN_ANIMATION_URLS;
  return ANIMATION_URLS;
}

const CHARACTER_PRELOAD_ANIMATION_KEYS = [
  "idle",
  "walk",
  "back",
  "block",
  "jump",
  "crouch",
  "punch1",
  "kick1",
  "punchReaction",
  "kickReaction",
  "standingReaction",
];

const ANIMATION_LOAD_PRIORITY = [
  "idle",
  "walk",
  "back",
  "block",
  "jump",
  "crouch",
  "punch1",
  "kick1",
  "punch2",
  "kick2",
  "heavyPunch1",
  "heavyKick1",
  "punchReaction",
  "kickReaction",
  "standingReaction",
  "die",
];

const assetPreloadCache = new Map();

function uniqueAssetUrls(urls = []) {
  return [...new Set(urls.filter(url => url && typeof url === "string" && !url.startsWith("data:")))];
}

function getCharacterCoreAssetUrls(characterId = "skitz") {
  const animationUrls = getAnimationUrls(characterId);
  return uniqueAssetUrls([
    getCharacterModelUrl(characterId),
    characterId === "skitz" ? SKITZ_TEXTURE_URL : null,
    ...CHARACTER_PRELOAD_ANIMATION_KEYS.map(key => animationUrls[key]),
  ]);
}

function getCharacterDeferredAssetUrls(characterId = "skitz") {
  const animationUrls = getAnimationUrls(characterId);
  const core = new Set(getCharacterCoreAssetUrls(characterId));
  return uniqueAssetUrls(Object.values(animationUrls).filter(url => !core.has(url)));
}

function getStageRuntimeAssetUrls(stageId = "default") {
  if (stageId === "redbulldys") {
    return uniqueAssetUrls([
      REDBULL_DYS_RUNTIME_MODEL_URL,
      REDBULL_DYS_TEXTURE_URL,
      REDBULL_DYS_EMISSIVE_URL,
      REDBULL_DYS_METALLIC_URL,
      REDBULL_DYS_ROUGHNESS_URL,
      REDBULL_DYS_NORMAL_URL,
    ]);
  }

  if (stageId === "skatebowl") {
    return uniqueAssetUrls([
      SKATE_BOWL_STAGE_ASSET.runtimeModel ?? SKATE_BOWL_STAGE_ASSET.model,
      SKATE_BOWL_STAGE_ASSET.texture,
      SKATE_BOWL_STAGE_ASSET.emissive,
      SKATE_BOWL_STAGE_ASSET.metalness,
      SKATE_BOWL_STAGE_ASSET.roughness,
      SKATE_BOWL_STAGE_ASSET.normal,
      ...WAFFLEHOUSE_CROWD_URLS,
    ]);
  }

  if (stageId === "ncGraffiti") {
    return uniqueAssetUrls([
      NC_GRAFFITI_STAGE_ASSET.runtimeModel ?? NC_GRAFFITI_STAGE_ASSET.model,
      NC_GRAFFITI_STAGE_ASSET.texture,
      NC_GRAFFITI_STAGE_ASSET.emissive,
      NC_GRAFFITI_STAGE_ASSET.metalness,
      NC_GRAFFITI_STAGE_ASSET.roughness,
      NC_GRAFFITI_STAGE_ASSET.normal,
      ...WAFFLEHOUSE_CROWD_URLS,
    ]);
  }

  if (stageId === "daBull") {
    return uniqueAssetUrls([
      DA_BULL_STAGE_ASSET.runtimeModel ?? DA_BULL_STAGE_ASSET.model,
      DA_BULL_STAGE_ASSET.texture,
      DA_BULL_STAGE_ASSET.emissive,
      DA_BULL_STAGE_ASSET.metalness,
      DA_BULL_STAGE_ASSET.roughness,
      DA_BULL_STAGE_ASSET.normal,
      DA_BULL_SKY_URL,
      ...WAFFLEHOUSE_CROWD_URLS,
    ]);
  }

  if (stageId === "wafflehouse") {
    return uniqueAssetUrls([
      WAFFLEHOUSE_MODEL_URL,
      WAFFLEHOUSE_SKY_URL,
      WAFFLEHOUSE_ENV_URL,
      ...WAFFLEHOUSE_CROWD_URLS,
    ]);
  }

  return [];
}

function preloadAssetUrls(urls = [], { concurrency = 2 } = {}) {
  if (typeof window === "undefined" || typeof fetch !== "function") return Promise.resolve();
  const queue = uniqueAssetUrls(urls).filter(url => !assetPreloadCache.has(url));
  if (!queue.length) return Promise.resolve();

  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length) {
      const url = queue.shift();
      const promise = fetch(url, { cache: "force-cache" })
        .then(response => (response.ok ? response.arrayBuffer() : null))
        .catch(() => null);
      assetPreloadCache.set(url, promise);
      await promise;
      await new Promise(resolve => setTimeout(resolve, 60));
    }
  });

  return Promise.all(workers);
}

function preloadFightAssets(settings = {}, mode = "core") {
  if (typeof window === "undefined") return Promise.resolve();
  if (getViewportInfo().isPhoneLike) return Promise.resolve();

  const p1Character = settings.p1Character ?? "skitz";
  const p2Character = settings.p2Character ?? p1Character;
  const coreUrls = uniqueAssetUrls([
    ...getStageRuntimeAssetUrls(settings.stageId ?? "default"),
    ...getCharacterCoreAssetUrls(p1Character),
    ...getCharacterCoreAssetUrls(p2Character),
  ]);

  const corePromise = preloadAssetUrls(coreUrls, { concurrency: 2 });

  if (mode === "all") {
    corePromise.finally(() => window.setTimeout(() => {
      preloadAssetUrls([
        ...getCharacterDeferredAssetUrls(p1Character),
        ...getCharacterDeferredAssetUrls(p2Character),
      ], { concurrency: 1 });
    }, 850));
  }

  return corePromise;
}

// ─── Exact frame counts ───────────────────────────────────────────────────────
const ANIM_FRAMES = {
  idle:        99,
  punch1:      25,
  punch2:      25,
  punch3:      44,   // updated
  heavyPunch1: 52,
  heavyPunch2: 52,
  kick1:       39,
  kick2:       25,
  kick3:       45,
  heavyKick1:  38,
  heavyKick2:  52,
  punchReaction: 49,
  kickReaction: 31,
  heavyKickReaction: 98,
  heavyHitAttackReaction: 98,
  standingReaction: 38,
  flyingBackDamageReaction: 48,
  getUpAfterDamage: 44,
  faceHit:     32,
  stunned:     64,
  die:         64,
  jump:        52,
  block:       41,   // NEW
};

const JOSE_ANIM_FRAMES = {
  idle: 322,
  walk: 37,
  back: 37,
  crouch: 61,
  punch1: 22,
  punch2: 22,
  punch3: 18,
  heavyPunch1: 25,
  heavyPunch2: 73,
  kick1: 17,
  kick2: 17,
  kick3: 40,
  heavyKick1: 17,
  heavyKick2: 34,
  heavyKick3: 20,
  punchReaction: 53,
  punch2Reaction: 23,
  punch3Reaction: 72,
  kickReaction: 40,
  heavyPunchReaction: 72,
  heavyKickReaction: 74,
  heavyHitAttackReaction: 74,
  standingReaction: 53,
  flyingBackDamageReaction: 74,
  getUpAfterDamage: 132,
  faceHit: 23,
  stunned: 74,
  die: 144,
  jump: 322,
  block: 24,
};


const MOCKV_ANIM_FRAMES = {
  idle: 322,
  walk: 31,
  back: 31,
  crouch: 322,
  punch1: 20,
  punch2: 20,
  punch3: 20,
  punch4: 45,
  heavyPunch1: 40,
  heavyPunch2: 55,
  heavyAttack3: 60,
  kick1: 61,
  kick2: 26,
  // Timings are ready for these FBX files once they are added to public/mockv.
  kick3: 43,
  kick4: 62,
  heavyKick1: 41,
  heavyKick2: 44,
  punchReaction: 23,
  punch2Reaction: 31,
  punch3Reaction: 31,
  kickReaction: 31,
  heavyPunchReaction: 85,
  heavyKickReaction: 48,
  heavyHitAttackReaction: 85,
  standingReaction: 93,
  flyingBackDamageReaction: 85,
  getUpAfterDamage: 93,
  faceHit: 23,
  stunned: 85,
  die: 85,
  jump: 52,
  block: 24,
};

const XTRA_ANIM_FRAMES = {
  idle: 63,
  walk: 63,
  back: 63,
  crouch: 63,
  punch1: 25,
  punch2: 25,
  punch3: 65,
  heavyPunch1: 48,
  heavyPunch2: 52,
  kick1: 30,
  kick2: 27,
  kick3: 56,
  heavyKick1: 48,
  heavyKick2: 52,
  punchReaction: 50,
  punch2Reaction: 70,
  punch3Reaction: 30,
  kickReaction: 27,
  heavyPunchReaction: 68,
  heavyKickReaction: 38,
  heavyHitAttackReaction: 68,
  standingReaction: 50,
  flyingBackDamageReaction: 68,
  getUpAfterDamage: 68,
  faceHit: 50,
  stunned: 68,
  die: 64,
  jump: 63,
  block: 24,
};

const TERROR_EAST_ANIM_FRAMES = {
  idle: 89,
  walk: 89,
  back: 89,
  crouch: 89,
  punch1: 21,
  punch2: 18,
  punch3: 76,
  heavyPunch1: 51,
  heavyPunch2: 83,
  kick1: 27,
  kick2: 27,
  kick3: 32,
  heavyKick1: 51,
  heavyKick2: 83,
  punchReaction: 38,
  punch2Reaction: 43,
  punch3Reaction: 56,
  kickReaction: 38,
  heavyPunchReaction: 56,
  heavyKickReaction: 56,
  heavyHitAttackReaction: 56,
  standingReaction: 38,
  flyingBackDamageReaction: 75,
  getUpAfterDamage: 75,
  faceHit: 38,
  stunned: 75,
  die: 50,
  jump: 89,
  block: 38,
};

const REIGN_ANIM_FRAMES = {
  idle: 63,
  walk: 63,
  back: 63,
  crouch: 63,
  punch1: 34,
  punch2: 31,
  heavyPunch1: 28,
  heavyPunch2: 28,
  kick1: 39,
  kick2: 32,
  kick3: 73,
  heavyKick1: 29,
  heavyKick2: 29,
  punchReaction: 42,
  punch2Reaction: 43,
  punch3Reaction: 98,
  kickReaction: 38,
  heavyPunchReaction: 98,
  heavyKickReaction: 98,
  heavyHitAttackReaction: 98,
  standingReaction: 38,
  flyingBackDamageReaction: 72,
  getUpAfterDamage: 126,
  faceHit: 42,
  stunned: 72,
  die: 50,
  jump: 63,
  block: 38,
};

function getAnimFrames(characterId) {
  if (characterId === "jose") return JOSE_ANIM_FRAMES;
  if (characterId === "mockv") return MOCKV_ANIM_FRAMES;
  if (characterId === "xtra") return XTRA_ANIM_FRAMES;
  if (characterId === "terrorEast") return TERROR_EAST_ANIM_FRAMES;
  if (characterId === "reign") return REIGN_ANIM_FRAMES;
  return ANIM_FRAMES;
}

const SOURCE_FPS = 30;

function animDuration(key, characterId = "skitz") {
  const frames = getAnimFrames(characterId);
  return (frames[key] ?? ANIM_FRAMES[key] ?? 30) / SOURCE_FPS;
}

function shouldUseExportedAnimationSpeed(characterId, key) {
  return characterId === "jose" || characterId === "xtra" || characterId === "terrorEast" || characterId === "reign" || (characterId === "mockv" && (key === "idle" || key === "die"));
}

// ─── Single-hit windows (frame range → seconds) ───────────────────────────────
// punch3 is handled separately via MULTI_HIT_FRAMES below.
const HIT_WINDOWS = {
  kick1:       [14 / SOURCE_FPS, 17 / SOURCE_FPS],
  kick2:       [ 8 / SOURCE_FPS, 12 / SOURCE_FPS],
  // kick3 has two real contact moments
  kick3:       [13 / SOURCE_FPS, 14 / SOURCE_FPS],
  heavyPunch1: [28 / SOURCE_FPS, 30 / SOURCE_FPS],
  punch1:      [ 9 / SOURCE_FPS, 12 / SOURCE_FPS],
  punch2:      [ 9 / SOURCE_FPS, 12 / SOURCE_FPS],
  heavyPunch2: [29 / SOURCE_FPS, 29 / SOURCE_FPS],
  heavyKick1:  [18 / SOURCE_FPS, 19 / SOURCE_FPS],
  heavyKick2:  [26 / SOURCE_FPS, 27 / SOURCE_FPS],
};

const JOSE_HIT_WINDOWS = {
  punch1:      [12 / SOURCE_FPS, 12 / SOURCE_FPS],
  punch2:      [12 / SOURCE_FPS, 12 / SOURCE_FPS],
  punch3:      [ 5 / SOURCE_FPS,  5 / SOURCE_FPS],
  kick1:       [12 / SOURCE_FPS, 12 / SOURCE_FPS],
  kick2:       [12 / SOURCE_FPS, 12 / SOURCE_FPS],
  heavyPunch1: [ 8 / SOURCE_FPS,  8 / SOURCE_FPS],
  heavyPunch2: [24 / SOURCE_FPS, 24 / SOURCE_FPS],
  heavyKick1:  [14 / SOURCE_FPS, 14 / SOURCE_FPS],
};


const MOCKV_HIT_WINDOWS = {
  punch1:      [ 6 / SOURCE_FPS,  6 / SOURCE_FPS],
  punch2:      [ 6 / SOURCE_FPS,  6 / SOURCE_FPS],
  punch3:      [10 / SOURCE_FPS, 10 / SOURCE_FPS],
  punch4:      [20 / SOURCE_FPS, 20 / SOURCE_FPS],
  heavyPunch1: [22 / SOURCE_FPS, 22 / SOURCE_FPS],
  heavyPunch2: [17 / SOURCE_FPS, 17 / SOURCE_FPS],
  heavyAttack3:[33 / SOURCE_FPS, 33 / SOURCE_FPS],
  kick2:       [ 7 / SOURCE_FPS,  7 / SOURCE_FPS],
  kick4:       [25 / SOURCE_FPS, 25 / SOURCE_FPS],
  heavyKick1:  [18 / SOURCE_FPS, 18 / SOURCE_FPS],
  heavyKick2:  [22 / SOURCE_FPS, 22 / SOURCE_FPS],
};

const XTRA_HIT_WINDOWS = {
  punch1:      [14 / SOURCE_FPS, 14 / SOURCE_FPS],
  punch2:      [16 / SOURCE_FPS, 16 / SOURCE_FPS],
  kick1:       [14 / SOURCE_FPS, 14 / SOURCE_FPS],
  kick2:       [14 / SOURCE_FPS, 14 / SOURCE_FPS],
  kick3:       [22 / SOURCE_FPS, 22 / SOURCE_FPS],
  heavyPunch1: [20 / SOURCE_FPS, 20 / SOURCE_FPS],
  heavyPunch2: [18 / SOURCE_FPS, 18 / SOURCE_FPS],
  heavyKick1:  [20 / SOURCE_FPS, 20 / SOURCE_FPS],
  heavyKick2:  [18 / SOURCE_FPS, 18 / SOURCE_FPS],
};

const TERROR_EAST_HIT_WINDOWS = {
  punch1:      [ 6 / SOURCE_FPS,  6 / SOURCE_FPS],
  punch2:      [18 / SOURCE_FPS, 18 / SOURCE_FPS],
  punch3:      [15 / SOURCE_FPS, 56 / SOURCE_FPS],
  kick1:       [11 / SOURCE_FPS, 11 / SOURCE_FPS],
  kick2:       [11 / SOURCE_FPS, 11 / SOURCE_FPS],
  kick3:       [16 / SOURCE_FPS, 16 / SOURCE_FPS],
  heavyPunch1: [25 / SOURCE_FPS, 25 / SOURCE_FPS],
  heavyPunch2: [21 / SOURCE_FPS, 21 / SOURCE_FPS],
  heavyKick1:  [25 / SOURCE_FPS, 25 / SOURCE_FPS],
  heavyKick2:  [21 / SOURCE_FPS, 21 / SOURCE_FPS],
};

const REIGN_HIT_WINDOWS = {
  punch1:      [18 / SOURCE_FPS, 18 / SOURCE_FPS],
  punch2:      [ 6 / SOURCE_FPS,  6 / SOURCE_FPS],
  kick1:       [15 / SOURCE_FPS, 15 / SOURCE_FPS],
  kick2:       [ 8 / SOURCE_FPS,  8 / SOURCE_FPS],
  kick3:       [32 / SOURCE_FPS, 32 / SOURCE_FPS],
  heavyPunch1: [ 7 / SOURCE_FPS,  7 / SOURCE_FPS],
  heavyPunch2: [ 7 / SOURCE_FPS,  7 / SOURCE_FPS],
  heavyKick1:  [15 / SOURCE_FPS, 15 / SOURCE_FPS],
  heavyKick2:  [15 / SOURCE_FPS, 15 / SOURCE_FPS],
};

function getHitWindows(characterId) {
  if (characterId === "jose") return JOSE_HIT_WINDOWS;
  if (characterId === "mockv") return MOCKV_HIT_WINDOWS;
  if (characterId === "xtra") return XTRA_HIT_WINDOWS;
  if (characterId === "terrorEast") return TERROR_EAST_HIT_WINDOWS;
  if (characterId === "reign") return REIGN_HIT_WINDOWS;
  return HIT_WINDOWS;
}

// ─── Multi-hit frame list (in frames at SOURCE_FPS) ──────────────────────────
// Each entry fires an independent hitbox check at that exact frame.
// punch3: 4 hits at frames 10, 14, 18, 22  →  damage per hit = 3 (total 12)
const MULTI_HIT_FRAMES = {
  // punch3 is a quick regular combo finisher. Make the hit window forgiving.
  punch3: [10, 14, 18, 22],
  // kick3 hits twice: frames 13-14 and 17-18.
  kick3: [13, 17],
};

const JOSE_MULTI_HIT_FRAMES = {
  kick3: [15, 20],
  heavyKick2: [14, 22],
  heavyKick3: [15, 20],
};

const MOCKV_MULTI_HIT_FRAMES = {
  kick1: [19, 49],
  kick3: [18, 27],
};

const XTRA_MULTI_HIT_FRAMES = {
  punch3: [16, 43],
};

const TERROR_EAST_MULTI_HIT_FRAMES = {
  punch3: [15, 29, 37, 44, 48, 56],
};
const REIGN_MULTI_HIT_FRAMES = {};

function getMultiHitFrames(characterId, key) {
  if (characterId === "jose") return JOSE_MULTI_HIT_FRAMES[key];
  if (characterId === "mockv") return MOCKV_MULTI_HIT_FRAMES[key];
  if (characterId === "xtra") return XTRA_MULTI_HIT_FRAMES[key];
  if (characterId === "terrorEast") return TERROR_EAST_MULTI_HIT_FRAMES[key];
  if (characterId === "reign") return REIGN_MULTI_HIT_FRAMES[key];
  return MULTI_HIT_FRAMES[key];
}
const PUNCH3_HIT_DAMAGE = 3; // per hit × 4 hits = 12 total
const KICK3_HIT_DAMAGE = 5; // per hit × 2 hits = 10 total

function hitDelayMs(key, characterId = "skitz") {
  const w = getHitWindows(characterId)[key];
  if (!w) return 133;
  return ((w[0] + w[1]) / 2) * 1000;
}

// ─── Blocking: how much damage gets through when blocking ────────────────────
// 0.0 = full block, 1.0 = no block.  20 % chip damage on block.
const BLOCK_DAMAGE_MULTIPLIER = 0.20;

// Slows the match pace without changing combo feel. Damage numbers still show the real scaled damage.
const HEALTH_DAMAGE_SCALE = 0.62;
const MIN_DAMAGE_ON_HIT = 2;

const COMBO_WINDOW_MS = 1150;
const BLOCK_STAMINA_MULTIPLIER = 1.6;
const STAMINA_GUARD_BREAK_SPILLOVER = 0.35;
const HIT_REACTION_DELAY_MS = 70;
const KICK_REACTION_SLOW_SCALE = 0.78;
const KICK_REACTION_LOCK_MS = 520;
const STANDING_REACTION_LOCK_MS = 360;
const KNOCKDOWN_LOCK_BUFFER_MS = 160;
const HIT_REACTION_LOCK_MS = 90;
const ROUNDS_TO_WIN = 3;
const MAX_POSSIBLE_ROUNDS = ROUNDS_TO_WIN * 2 - 1;
const ROUND_LOADING_MIN_MS = 2200;
const ROUND_COUNTDOWN_FROM = 3;
const MOBILE_ASSET_WAIT_MS = 8500;
const FLOAT_TEXT_LIFETIME_MS = 900;
const BLOOD_LIFETIME_MS = 850;
const BLOOD_DRIP_LIFETIME_MS = 1150;
const SCREEN_SHAKE_MS = 620;
const CRITICAL_SHAKE_MS = 840;
const CRITICAL_DAMAGE_THRESHOLD = 20;
const HIT_STOP_MS = 32;
const ATTACK_MIN_VISIBLE_MS = {
  punch1: 470,
  punch2: 520,
  punch3: 900,
  kick1: 620,
  kick2: 590,
  kick3: 880,
  heavyPunch1: 900,
  heavyPunch2: 980,
  heavyKick1: 760,
  heavyKick2: 980,
  heavyKick3: 760,
  punch4: 980,
  heavyAttack3: 2300,
};

// These make combos feel intentional instead of button-mashy.
// Inputs during an attack are queued, then released only after the current move
// has had enough time to visibly play.
const COMBO_QUEUE_BUFFER_MS = 1500;
const ATTACK_FINISH_BUFFER_MS = 80;
const DASH_TAP_WINDOW_MS = 250;
const DASH_COOLDOWN_MS = 520;
const DASH_STAMINA_COST = 11;
const DASH_VELOCITY = 0.205;
const PUSHBACK_BASE = 0.095;
const PUSHBACK_HEAVY = 0.19;
const PUSHBACK_CRITICAL = 0.29;
const MULTI_HIT_PUSHBACK = 0.025;
const ATTACKER_RECOIL_BASE = 0.012;
const COMBO_HIT_PUSHBACK_POSITION_SCALE = 0.24;
const FINISHER_HIT_PUSHBACK_POSITION_SCALE = 0.45;
const MULTI_HIT_PUSHBACK_POSITION_SCALE = 0.14;
const COMBO_ATTACKER_FOLLOW_THROUGH = 0.052;
const COMBO_ATTACKER_FOLLOW_VELOCITY = 0.028;
const COMBO_FINISHER_RECOVERY_MS = 360;
const LIGHT_HITSTUN_MS = 260;
const FINISHER_HITSTUN_MS = 340;
const HITBOX_GRACE_RANGE = 0.22;
const MODEL_CONTACT_GRACE = 0.045;
const ATTACK_DRIFT_MULTIPLIER = 0.52;
const ATTACK_FORWARD_DRIFT = {
  punch1: 0.045,
  punch2: 0.055,
  punch3: 0.018,
  kick1: 0.06,
  kick2: 0.075,
  kick3: 0.085,
  heavyPunch1: 0.055,
  heavyPunch2: 0.07,
  heavyKick1: 0.075,
  heavyKick2: 0.095,
  heavyKick3: 0.10,
  punch4: 0.04,
  heavyAttack3: 0.018,
};

// Street-fighter-style feel: startup hits, active contact, then recovery.
// The animation is allowed to finish before queued inputs are released.
const ATTACK_RECOVERY_MS = {
  punch1: 120,
  punch2: 140,
  punch3: 330,
  kick1: 150,
  kick2: 165,
  kick3: 340,
  heavyPunch1: 320,
  heavyPunch2: 460,
  heavyKick1: 380,
  heavyKick2: 500,
  heavyKick3: 620,
  punch4: 460,
  heavyAttack3: 1050,
};
const MOCKV_ATTACK_RECOVERY_MS = {
  punch1: 70,
  punch2: 70,
  punch3: 85,
  punch4: 260,
  heavyPunch1: 180,
  heavyPunch2: 260,
  heavyAttack3: 540,
  kick1: 150,
  kick2: 95,
  kick3: 140,
  kick4: 240,
  heavyKick1: 210,
  heavyKick2: 250,
};
const LOCK_FAILSAFE_PAD_MS = 260;
const CRITICAL_ZOOM_MS = 760;
const CRITICAL_ZOOM_AMOUNT = 1.22;
const LOW_HEALTH_CAMERA_THRESHOLD = 28;
const LOW_HEALTH_ZOOM_AMOUNT = 0.52;
const COMEBACK_HEALTH_THRESHOLD = 30;
const COMEBACK_DAMAGE_MULTIPLIER = 1.08;
const COMEBACK_STAMINA_REGEN_BONUS = 0.055;
const PERFECT_GUARD_WINDOW_MS = 185;
const PERFECT_GUARD_STAMINA_BONUS = 12;
const PERFECT_GUARD_ATTACKER_STAMINA_DRAIN = 9;
const COUNTER_HIT_DAMAGE_MULTIPLIER = 1.14;
const COUNTER_HIT_STAMINA_BONUS = 6;
const CLASH_WINDOW_MS = 260;
const CLASH_COOLDOWN_MS = 460;
const CLASH_PUSHBACK = 0.18;
const CLASH_STAMINA_REFUND = 5;
const WALL_BOUNCE_MARGIN = 0.22;
const WALL_BOUNCE_VELOCITY = 0.24;
const WALL_BOUNCE_LIFT = 0.052;
const TAUNT_COOLDOWN_MS = 4300;
const TAUNT_LOCK_MS = 760;
const TAUNT_STAMINA_GAIN = 16;
const TAUNT_COMEBACK_HEAL = 3;
const TAUNT_MIN_DISTANCE = 1.22;
const TAUNT_PUNISH_MULTIPLIER = 1.18;
const FINISH_HEALTH_THRESHOLD = 15;
const FLYING_BACK_LAND_FRAME = 21;
const FLYING_BACK_TOTAL_FRAMES = 48;
const GET_UP_TOTAL_FRAMES = 44;
const KNOCKDOWN_GETUP_BUFFER_MS = 90;

// Visual-only height correction for knockdown clips.
// Back to original placements: no manual Y offset.
const KNOCKDOWN_VISUAL_Y_OFFSET = {
  flyingBackDamageReaction: 0,
  getUpAfterDamage: 0,
};

const MUSIC_URL = "/99buck.mp3";
const DEFAULT_CONTROLS = {
  // Crouch and block are separate. P1: S crouches, Shift blocks. P2: K crouches, ; blocks.
  p1: { lightPunch: "e", heavyPunch: "f", heavyPunch2: "r", lightKick: "c", heavyKick: "v", crouch: "s", block: "shift", taunt: "t" },
  p2: { lightPunch: "u", heavyPunch: "o", heavyPunch2: "p", lightKick: "n", heavyKick: "m", crouch: "k", block: ";", taunt: "b" },
};

const MOVEMENT_CONTROLS = {
  p1: { left: "a", right: "d", jump: "w" },
  p2: { left: "j", right: "l", jump: "i" },
};

function normalizeInputKey(key) {
  const normalized = String(key ?? "").toLowerCase();
  return normalized === " " ? "space" : normalized;
}

function isComebackActive(fighter) {
  if (!fighter || fighter.hp <= 0) return false;
  return ((fighter.hp / Math.max(1, fighter.maxHp ?? 100)) * 100) <= COMEBACK_HEALTH_THRESHOLD;
}


const SYSTEM_ALERT_LIFETIME_MS = 1050;
const LOW_STAMINA_THRESHOLD = 24;
const SYSTEM_ALERT_COOLDOWN_MS = 850;
const INPUT_SPAM_WINDOW_MS = 850;
const INPUT_SPAM_MAX_PRESSES = 8;
const INPUT_SPAM_PENALTY_MS = 420;
const INPUT_BUFFER_LIMIT_MESSAGE = "BUFFERED";
const XTRA_POISON_TICK_MS = 2000;
const XTRA_POISON_DAMAGE_PER_STACK = 4;
const XTRA_POISON_MAX_STACKS = 5;

const HIT_TALK_CHANCE = 0.42;
const CRITICAL_TALK_CHANCE = 0.72;
const HIT_TALK_LINES = [
  "Bitch ass!",
  "Caught you!",
  "Hands or rounds?",
  "Hold that!",
  "Where your guard at?",
  "Stop mashing!",
  "NC pressure!",
  "Sit down!",
  "You good?",
  "That connected!",
];
const CRITICAL_TALK_LINES = [
  "CRITICAL!",
  "SENT FLYING!",
  "GET UP!",
  "BIG DAMAGE!",
  "NO ESCAPE!",
];

function pct(value) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function damageText(value) {
  return `${Math.max(0, Math.round(value ?? 0))}%`;
}

function makePlayerRoundStats() {
  return {
    damage: 0,
    bestCombo: 0,
    counters: 0,
    perfectGuards: 0,
    clashes: 0,
    wallBounces: 0,
    taunts: 0,
    punishes: 0,
    firstHit: false,
  };
}

function makeEmptyRoundStats() {
  return {
    p1: makePlayerRoundStats(),
    p2: makePlayerRoundStats(),
  };
}

const STAGE_MIN_X = -6.85;
const STAGE_MAX_X = 6.85;

const CHARACTER_ROSTER = [
  {
    id: "skitz",
    name: "Skitz",
    tag: "Creator of this World",
    maxHp: 100,
    staminaMax: 100,
    staminaRegenScale: 1,
    staminaCostScale: 1,
    damageScale: 1.28,
    damageTakenScale: 1.28,
    passive: "Abilities: heals on every landed hit. Heavy hits heal more. Full bar, but takes extra damage.",
    portraitUrl: "/portraits/skitz-thumbnail.png",
    portraitPosition: "52% 48%",
    available: true,
  },
  {
    id: "jose",
    name: "Jose",
    tag: "Best stamina in the game",
    maxHp: 94,
    staminaMax: 145,
    staminaRegenScale: 1.7,
    staminaCostScale: 0.72,
    damageScale: 0.95,
    damageTakenScale: 1.0,
    passive: "Abilities: best stamina in the game. Hold S to crouch, then press C for a heavy-kick chain. Moderate health, strong pressure.",
    portraitUrl: "/portraits/jose-thumbnail.png",
    portraitPosition: "50% 49%",
    available: true,
  },
  {
    id: "mockv",
    name: "Mockv",
    tag: "Four-hit pressure specialist",
    maxHp: 98,
    staminaMax: 110,
    staminaRegenScale: 1.05,
    staminaCostScale: 1.0,
    damageScale: 1.0,
    damageTakenScale: 1.0,
    passive: "Abilities: the only fighter with a 4-hit punch chain. R chains heavyPunch1 into heavyPunch2. At 95% stamina, press F for Heavy Attack 3: huge damage, very slow startup, and blockable.",
    portraitUrl: "/portraits/mockv-thumbnail.png",
    portraitPosition: "50% 49%",
    available: true,
  },
  {
    id: "xtra",
    name: "Xtra",
    tag: "Poison pressure thief",
    maxHp: 96,
    staminaMax: 105,
    staminaRegenScale: 1.08,
    staminaCostScale: 0.96,
    damageScale: 0.98,
    damageTakenScale: 1.0,
    passive: "Abilities: heavy attack 2 poisons on hit. Poison stacks and drains 4% every 2 seconds while feeding Xtra health.",
    portraitUrl: "/portraits/xtra-thumbnail.png",
    portraitPosition: "51% 48%",
    available: true,
  },
  {
    id: "terrorEast",
    name: "Terror East",
    tag: "Painted rocker power hitter",
    maxHp: 100,
    staminaMax: 100,
    staminaRegenScale: 0.95,
    staminaCostScale: 1,
    damageScale: 1.0,
    damageTakenScale: 1.0,
    passive: "Abilities: Heavy Attack 2 costs 95% stamina and lands a true 65 HP hit.",
    portraitUrl: "/portraits/terroreast-thumbnail.png",
    portraitPosition: "50% 49%",
    available: true,
  },
  {
    id: "reign",
    name: "Reign",
    tag: "Highest damage striker",
    maxHp: 100,
    staminaMax: 98,
    staminaRegenScale: 0.98,
    staminaCostScale: 1.02,
    damageScale: 1.08,
    damageTakenScale: 1.0,
    passive: "Abilities: highest regular damage in the game. No punch3 chain: light punch confirms from punch1 into punch2.",
    portraitUrl: "/portraits/reign-thumbnail.png",
    portraitPosition: "50% 49%",
    available: true,
  },
];

const CHARACTER_SELECT_GRID_ROWS = [3, 3];
const CHARACTER_SELECT_SLOTS = CHARACTER_ROSTER.filter(character => character.available);

const CHARACTER_STATS = {
  skitz: CHARACTER_ROSTER.find(c => c.id === "skitz"),
  jose: CHARACTER_ROSTER.find(c => c.id === "jose"),
  mockv: CHARACTER_ROSTER.find(c => c.id === "mockv"),
  xtra: CHARACTER_ROSTER.find(c => c.id === "xtra"),
  terrorEast: CHARACTER_ROSTER.find(c => c.id === "terrorEast"),
  reign: CHARACTER_ROSTER.find(c => c.id === "reign"),
  default: { id: "skitz", name: "Skitz", maxHp: 100, staminaMax: 100, staminaRegenScale: 1, staminaCostScale: 1, damageScale: 1.28, damageTakenScale: 1.28, passive: "Abilities: heals on every landed hit. Heavy hits heal more. Full bar, but takes extra damage." },
};

const STAGE_OPTIONS = [
  {
    id: "default",
    name: "The Block",
    tag: "Default stage",
    desc: "Neon grid, corner pressure, no gimmicks. More stages can plug into this select later.",
  },
  {
    id: "wafflehouse",
    name: "Waffle House Ruins",
    tag: "Night parking lot",
    desc: "A ruined Waffle House behind the fighters, wet asphalt underfoot, warm window glow, trees, and a few simple dancers in the back.",
  },
  {
    id: "redbulldys",
    name: "Red Bull DYS",
    tag: "Aerial dance circle",
    desc: "A Red Bull Dance Your Style stage with the fighters centered on the floor and a higher, almost aerial fight camera.",
  },
  {
    id: "skatebowl",
    name: "Skate Bowl",
    tag: "Crowded concrete bowl",
    desc: "Fighters down in the bowl, crowd ringing the rim so the scene feels packed instead of empty.",
  },
  {
    id: "ncGraffiti",
    name: "NC State Graffiti",
    tag: "Wall fight",
    desc: "A graffiti-wall stage with the fighters set in front and the audience tucked low along the back.",
  },
  {
    id: "daBull",
    name: "Da Bull",
    tag: "Statue stage",
    desc: "The fighters and crowd stand in front of the bull statue, with the statue kept bigger than everybody.",
  },
];

function getStageOption(id = "default") {
  return STAGE_OPTIONS.find(stage => stage.id === id) ?? STAGE_OPTIONS[0];
}

function getRandomStageId(excludeStageId = null) {
  const availableStages = STAGE_OPTIONS.length > 1
    ? STAGE_OPTIONS.filter(stage => stage.id !== excludeStageId)
    : STAGE_OPTIONS;
  const pool = availableStages.length ? availableStages : STAGE_OPTIONS;
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? "default";
}

function getStageSpawnPositions(stageId = "default") {
  if (stageId === "redbulldys") return { p1: -1.95, p2: 1.95 };
  if (stageId === "skatebowl") return { p1: -0.92, p2: 0.92 };
  if (stageId === "ncGraffiti") return { p1: -2.25, p2: 2.25 };
  if (stageId === "daBull") return { p1: -0.88, p2: 0.88 };
  return { p1: -2.8, p2: 3.35 };
}

function getStageBounds(stageId = "default") {
  if (stageId === "redbulldys") return { min: -4.35, max: 4.35 };
  if (stageId === "skatebowl") return { min: -1.72, max: 1.72 };
  if (stageId === "ncGraffiti") return { min: -8.4, max: 8.4 };
  if (stageId === "daBull") return { min: -2.65, max: 2.65 };
  return { min: STAGE_MIN_X, max: STAGE_MAX_X };
}

function getStageFighterPlacement(stageId = "default") {
  if (stageId === "skatebowl") return { y: 0.18, z: 0.78, scale: 0.62 };
  if (stageId === "ncGraffiti") return { y: 0.2, z: -11.1, scale: 0.9 };
  if (stageId === "daBull") return { y: 0.78, z: -1.72, scale: 0.46 };
  return { y: 0, z: 0.36, scale: 1 };
}

function getStageModelFloorOffset(stageId, characterId, fitFloorOffset = 0) {
  if (stageId !== "skatebowl") return 0;
  return Math.min(0.07, Math.max(0, fitFloorOffset * 0.09));
}

function getStageFloorLift(stageId = "default", x = 0) {
  if (stageId !== "skatebowl") return 0;
  const t = THREE.MathUtils.clamp((Math.abs(x) - 0.76) / 0.96, 0, 1);
  return t * t * 0.025;
}

function getStageCharacterVisualTuning(stageId = "default", characterId = "skitz") {
  if (stageId === "skatebowl" && characterId === "xtra") {
    return { heightScale: 1, yOffset: 0, zOffset: 0 };
  }

  return { heightScale: 1, yOffset: 0, zOffset: 0 };
}

function getStageCombatReach(stageId = "default") {
  if (stageId === "daBull") return { reachScale: 0.68, grace: 0.13 };
  return { reachScale: 1, grace: HITBOX_GRACE_RANGE };
}

function getStageBodyGap(stageId = "default") {
  if (stageId === "daBull") return 0.66;
  if (stageId === "skatebowl") return 0.88;
  return 0.8;
}

function getCharacterStats(id) {
  return CHARACTER_STATS[id] ?? CHARACTER_STATS.default;
}

function calcSkitzHeal(currentMove, actualDamage) {
  if (actualDamage <= 0) return 0;
  const move = currentMove.toLowerCase();
  if (move.includes("heavy") || currentMove === "stunned" || currentMove === "heavyKickReaction" || currentMove === "heavyHitAttackReaction") return 9;
  if (currentMove === "punch3" || currentMove === "kick3") return 2;
  return 3;
}

// ─── Move data ────────────────────────────────────────────────────────────────
// punch3 damage is per-hit (handled in fireHitbox); others are total damage.
const MOVE_DATA = {
  // Slightly wider reach + grace range makes hits feel fair without requiring overlap.
  punch1:      { cost: 8,  damage: 5,              reach: 1.48, stun: false },
  punch2:      { cost: 8,  damage: 5,              reach: 1.50, stun: false },
  punch3:      { cost: 12, damage: PUNCH3_HIT_DAMAGE, reach: 1.56, stun: false },
  // Heavy hits cost more stamina and hit harder.
  heavyPunch1: { cost: 28, damage: 14,             reach: 1.56, stun: false },
  heavyPunch2: { cost: 42, damage: 24,             reach: 1.62, stun: true  },
  kick1:       { cost: 10, damage: 6,              reach: 1.52, stun: false },
  kick2:       { cost: 10, damage: 6,              reach: 1.58, stun: false },
  kick3:       { cost: 15, damage: KICK3_HIT_DAMAGE, reach: 1.66, stun: false },
  heavyKick1:  { cost: 34, damage: 22,             reach: 1.72, stun: true  },
  heavyKick2:  { cost: 44, damage: 28,             reach: 1.82, stun: true  },
};

const JOSE_MOVE_DATA = {
  punch1:      { cost: 6,  damage: 4,  reach: 1.46, stun: false },
  punch2:      { cost: 6,  damage: 4,  reach: 1.48, stun: false },
  punch3:      { cost: 8,  damage: 7,  reach: 1.52, stun: false },
  // Heavy punches do not require crouch for Jose.
  heavyPunch1: { cost: 22, damage: 12, reach: 1.56, stun: true  },
  heavyPunch2: { cost: 34, damage: 18, reach: 1.62, stun: true  },
  kick1:       { cost: 7,  damage: 5,  reach: 1.58, stun: false },
  kick2:       { cost: 7,  damage: 5,  reach: 1.60, stun: false },
  kick3:       { cost: 12, damage: 5,  reach: 1.72, stun: false },
  // Jose's heavy-kick file names were manually swapped in the folder.
  // Code still asks for heavyKick1 -> heavyKick3 -> heavyKick2 so the visible chain stays correct.
  heavyKick1:  { cost: 32, damage: 10, reach: 1.75, stun: true  },
  heavyKick3:  { cost: 45, damage: 12, reach: 1.88, stun: true  },
  heavyKick2:  { cost: 72, damage: 16, reach: 1.95, stun: true  },
};


const MOCKV_MOVE_DATA = {
  punch1:      { cost: 7,  damage: 4,  reach: 1.46, stun: false },
  punch2:      { cost: 7,  damage: 4,  reach: 1.48, stun: false },
  punch3:      { cost: 8,  damage: 5,  reach: 1.50, stun: false },
  punch4:      { cost: 13, damage: 9,  reach: 1.58, stun: false },
  // R chain: R = heavyPunch1, R+R = heavyPunch2.
  heavyPunch1: { cost: 24, damage: 12, reach: 1.58, stun: false },
  heavyPunch2: { cost: 36, damage: 18, reach: 1.66, stun: true  },
  // F super: available only at 95% stamina, costs 50% stamina, very slow, huge damage.
  heavyAttack3:{ cost: 50, damage: 50, reach: 1.92, stun: true, superAttack: true, staminaRequirement: 0.95 },
  // Mockv only has two regular kicks right now.
  kick1:       { cost: 12, damage: 4,  reach: 1.72, stun: false },
  kick2:       { cost: 8,  damage: 6,  reach: 1.62, stun: false },
  heavyKick1:  { cost: 32, damage: 18, reach: 1.82, stun: true  },
  heavyKick2:  { cost: 46, damage: 24, reach: 1.88, stun: true  },
};

const XTRA_MOVE_DATA = {
  punch1:      { cost: 7,  damage: 4,  reach: 1.48, stun: false },
  punch2:      { cost: 7,  damage: 4,  reach: 1.50, stun: false },
  punch3:      { cost: 12, damage: 5,  reach: 1.62, stun: false },
  kick1:       { cost: 9,  damage: 5,  reach: 1.58, stun: false },
  kick2:       { cost: 9,  damage: 5,  reach: 1.60, stun: false },
  kick3:       { cost: 14, damage: 9,  reach: 1.72, stun: false },
  heavyPunch1: { cost: 26, damage: 13, reach: 1.74, stun: true  },
  heavyPunch2: { cost: 42, damage: 16, reach: 1.86, stun: true, poison: true },
  heavyKick1:  { cost: 26, damage: 13, reach: 1.74, stun: true  },
  heavyKick2:  { cost: 42, damage: 16, reach: 1.86, stun: true, poison: true },
};

const TERROR_EAST_MOVE_DATA = {
  punch1:      { cost: 7,  damage: 5,  reach: 1.50, stun: false },
  punch2:      { cost: 8,  damage: 6,  reach: 1.52, stun: false },
  punch3:      { cost: 16, damage: 4,  reach: 1.66, stun: false },
  kick1:       { cost: 9,  damage: 5,  reach: 1.58, stun: false },
  kick2:       { cost: 9,  damage: 5,  reach: 1.62, stun: false },
  kick3:       { cost: 13, damage: 9,  reach: 1.70, stun: false },
  heavyPunch1: { cost: 32, damage: 18, reach: 1.82, stun: true  },
  heavyPunch2: { cost: 95, damage: 65, reach: 1.92, stun: true, trueDamage: 65, staminaRequirement: 0.95, specialAttack: true },
  heavyKick1:  { cost: 32, damage: 18, reach: 1.82, stun: true  },
  heavyKick2:  { cost: 95, damage: 65, reach: 1.92, stun: true, trueDamage: 65, staminaRequirement: 0.95, specialAttack: true },
};

const REIGN_MOVE_DATA = {
  punch1:      { cost: 9,  damage: 10, reach: 1.50, stun: false, trueDamage: 10 },
  punch2:      { cost: 11, damage: 20, reach: 1.56, stun: false, trueDamage: 20 },
  kick1:       { cost: 10, damage: 10, reach: 1.60, stun: false, trueDamage: 10 },
  kick2:       { cost: 10, damage: 12, reach: 1.64, stun: false, trueDamage: 12 },
  kick3:       { cost: 24, damage: 35, reach: 1.80, stun: true,  trueDamage: 35 },
  heavyPunch1: { cost: 34, damage: 24, reach: 1.82, stun: true,  trueDamage: 24 },
  heavyPunch2: { cost: 42, damage: 30, reach: 1.86, stun: true,  trueDamage: 30 },
  heavyKick1:  { cost: 32, damage: 25, reach: 1.84, stun: true,  trueDamage: 25 },
  heavyKick2:  { cost: 40, damage: 28, reach: 1.88, stun: true,  trueDamage: 28 },
};

function getMoveData(characterId, moveKey) {
  if (characterId === "jose") return JOSE_MOVE_DATA[moveKey];
  if (characterId === "mockv") return MOCKV_MOVE_DATA[moveKey];
  if (characterId === "xtra") return XTRA_MOVE_DATA[moveKey];
  if (characterId === "terrorEast") return TERROR_EAST_MOVE_DATA[moveKey];
  if (characterId === "reign") return REIGN_MOVE_DATA[moveKey];
  return MOVE_DATA[moveKey];
}

function isJoseLowMidHeavyKick(attacker, moveKey) {
  return attacker?.characterId === "jose" && ["heavyKick1", "heavyKick2", "heavyKick3"].includes(moveKey);
}

function getAirborneHitLimit(attacker, moveKey, data = {}) {
  if (isJoseLowMidHeavyKick(attacker, moveKey)) return 0.035;
  const lowerMove = moveKey.toLowerCase();
  if (data.superAttack || data.specialAttack) return 0.58;
  if (lowerMove.includes("heavykick")) return 0.42;
  if (lowerMove.includes("heavypunch")) return 0.38;
  if (lowerMove.includes("kick3")) return 0.34;
  if (lowerMove.includes("kick")) return 0.26;
  if (lowerMove.includes("punch")) return 0.22;
  return 0.24;
}

function canMoveReachDefenderHeight(attacker, defender, moveKey, data = {}) {
  if (defender.grounded) return true;
  return (defender.y || 0) <= getAirborneHitLimit(attacker, moveKey, data);
}

function getModelContactReach(attacker, moveKey, data = {}, stageId = "default") {
  const stageReach = getStageCombatReach(stageId);
  const move = moveKey.toLowerCase();
  const listedReach = (data.reach ?? 1.5) * stageReach.reachScale;

  let visualReach = move.includes("kick") ? 1.34 : 1.18;
  if (move.includes("heavy")) visualReach += 0.16;
  if (data.stun) visualReach += 0.05;
  if (data.superAttack || data.specialAttack) visualReach = 1.62;
  if (moveKey === "heavyAttack3") visualReach = 1.66;
  if (attacker?.characterId === "xtra" && move.includes("kick")) visualReach += 0.1;
  if (attacker?.characterId === "jose" && move.includes("kick")) visualReach += 0.08;

  const contactGrace = Math.min(MODEL_CONTACT_GRACE, stageReach.grace * 0.35);
  return Math.min(listedReach, visualReach * stageReach.reachScale) + contactGrace;
}

function getTightStageContactReach(attacker, moveKey, data = {}, stageId = "default") {
  if (stageId !== "daBull") return null;

  const move = moveKey.toLowerCase();
  let reach = move.includes("kick") ? 0.74 : 0.68;
  if (move.includes("heavy")) reach += 0.06;
  if (move.includes("3")) reach += 0.03;
  if (data.stun) reach += 0.02;
  if (data.superAttack || data.specialAttack || moveKey === "heavyAttack3") reach = 0.88;
  if (attacker?.characterId === "jose" && move.includes("kick")) reach += 0.03;
  if (attacker?.characterId === "xtra" && move.includes("kick")) reach += 0.03;

  return reach;
}

function canStrikeDefenderModel(attacker, defender, moveKey, data = {}, stageId = "default") {
  if (!attacker || !defender) return false;
  const dist = Math.abs(attacker.x - defender.x);
  const tightStageReach = getTightStageContactReach(attacker, moveKey, data, stageId);
  if (tightStageReach != null) return dist <= tightStageReach;

  const overlapRange = getStageBodyGap(stageId) * 0.52;
  if (dist <= overlapRange) return true;

  return dist <= getModelContactReach(attacker, moveKey, data, stageId);
}

const ATTACK_ACTION_SET = new Set([...Object.keys(MOVE_DATA), ...Object.keys(JOSE_MOVE_DATA), ...Object.keys(MOCKV_MOVE_DATA), ...Object.keys(XTRA_MOVE_DATA), ...Object.keys(TERROR_EAST_MOVE_DATA), ...Object.keys(REIGN_MOVE_DATA)]);

function makeFighter(x, name, characterId = "skitz") {
  const stats = getCharacterStats(characterId);
  return {
    name,
    characterId,
    maxHp: stats.maxHp,
    damageScale: stats.damageScale,
    damageTakenScale: stats.damageTakenScale ?? 1,
    x, vx: 0, y: 0, vy: 0, hp: stats.maxHp, stamina: stats.staminaMax ?? 100, maxStamina: stats.staminaMax ?? 100,
    staminaRegenScale: stats.staminaRegenScale ?? 1, staminaCostScale: stats.staminaCostScale ?? 1,
    grounded: true, blocking: false, crouching: false,
    state: "IDLE", hitFrames: 0, lastAction: "idle", actionNonce: 0,
  };
}

const MENU_FONT = '"Bahnschrift SemiBold", "Segoe UI Black", "Arial Black", Impact, sans-serif';
const BODY_FONT = '"Bahnschrift", "Segoe UI", Arial, sans-serif';
const MENU_VIDEO_URL = "/menu/0527.mp4";
const CHARACTER_TILE_SIZE = "clamp(108px, 10.5vw, 144px)";
const CHARACTER_TILE_WIDTH = CHARACTER_TILE_SIZE;
const CHARACTER_TILE_HEIGHT = CHARACTER_TILE_SIZE;

const menuButtonStyle = {
  width: "410px",
  padding: "12px 24px",
  marginBottom: "10px",
  background: "linear-gradient(100deg, rgba(1,6,18,0.92), rgba(16,25,48,0.84) 42%, rgba(67,6,12,0.88) 100%)",
  border: "1px solid rgba(192,226,255,0.54)",
  borderLeft: "6px solid rgba(38,119,255,0.98)",
  color: "#f8fbff",
  fontFamily: MENU_FONT,
  fontSize: "20px",
  fontWeight: 900,
  letterSpacing: "1.4px",
  textAlign: "left",
  cursor: "pointer",
  textShadow: "2px 2px 0 #000, 0 0 18px rgba(75,142,255,0.58), 0 0 18px rgba(255,50,42,0.36)",
  boxShadow: "0 14px 32px rgba(0,0,0,0.58), 0 0 24px rgba(35,111,255,0.24), 0 0 24px rgba(255,38,35,0.18), inset 0 0 20px rgba(255,255,255,0.10)",
  transform: "none",
  borderRadius: "7px",
  backdropFilter: "blur(10px) saturate(1.25)",
};

const menuSmallTextStyle = {
  color: "rgba(226, 239, 255, 0.78)",
  fontFamily: BODY_FONT,
  fontSize: "13px",
  letterSpacing: "1px",
  lineHeight: "1.5",
  maxWidth: "520px",
  textAlign: "center",
  textShadow: "1px 1px 0 #000, 0 0 12px rgba(75,142,255,0.30)",
};

const MOBILE_MENU_INPUT_EVENT = "bd-mobile-menu-input";

function dispatchMobileMenuInput(input) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MOBILE_MENU_INPUT_EVENT, { detail: { input } }));
}

function useMenuNavigation({ enabled = true, itemCount, columns = 1, selectedIndex, setSelectedIndex, onPick, onBack }) {
  useEffect(() => {
    if (!enabled || itemCount <= 0) return;

    const move = (delta) => {
      setSelectedIndex(current => (current + delta + itemCount) % itemCount);
    };

    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      const confirm = k === "enter" || k === ".";
      const up = k === "w" || k === "i";
      const down = k === "s" || k === "k";
      const left = k === "a" || k === "j";
      const right = k === "d" || k === "l";

      if (!(confirm || up || down || left || right || k === "escape")) return;
      e.preventDefault();

      if (confirm) return onPick?.(selectedIndex);
      if (k === "escape") return onBack?.();
      if (up) move(-columns);
      if (down) move(columns);
      if (left) move(-1);
      if (right) move(1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, itemCount, columns, selectedIndex, setSelectedIndex, onPick, onBack]);

  useEffect(() => {
    if (!enabled || itemCount <= 0) return;

    const move = (delta) => {
      setSelectedIndex(current => (current + delta + itemCount) % itemCount);
    };

    const onMobileMenuInput = (event) => {
      const input = event.detail?.input;
      if (input === "confirm") return onPick?.(selectedIndex);
      if (input === "back") return onBack?.();
      if (input === "up") return move(-columns);
      if (input === "down") return move(columns);
      if (input === "left") return move(-1);
      if (input === "right") return move(1);
    };

    window.addEventListener(MOBILE_MENU_INPUT_EVENT, onMobileMenuInput);
    return () => window.removeEventListener(MOBILE_MENU_INPUT_EVENT, onMobileMenuInput);
  }, [enabled, itemCount, columns, selectedIndex, setSelectedIndex, onPick, onBack]);
}

function selectedMenuStyle(selected, extra = {}) {
  return {
    ...extra,
    borderLeftColor: selected ? "rgba(255,42,36,0.98)" : (extra.borderLeftColor ?? menuButtonStyle.borderLeftColor),
    borderColor: selected ? "rgba(255,255,255,0.88)" : (extra.borderColor ?? menuButtonStyle.borderColor),
    background: selected
      ? "linear-gradient(100deg, rgba(12,42,92,0.96), rgba(4,9,20,0.94) 48%, rgba(117,6,12,0.96) 100%)"
      : (extra.background ?? menuButtonStyle.background),
    boxShadow: selected
      ? "0 0 30px rgba(255,255,255,0.38), 0 0 28px rgba(45,125,255,0.58), 0 0 28px rgba(255,38,35,0.50), inset 0 0 20px rgba(255,255,255,0.18)"
      : (extra.boxShadow ?? menuButtonStyle.boxShadow),
  };
}

function MenuVideoBackdrop({ dim = 0.34, blur = 0, children }) {
  const viewport = useViewportInfo();
  const mobilePoster = viewport.isPhoneLike;

  return (
    <>
      {mobilePoster ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/menu/0527-poster.jpg'), url('/portraits/skitz-thumbnail.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: `saturate(1.22) contrast(1.06) brightness(.82) blur(${blur}px)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ) : (
        <video
          src={MENU_VIDEO_URL}
          autoPlay
          loop
          muted
          defaultMuted
          playsInline
          preload="auto"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
            filter: `saturate(1.28) contrast(1.08) brightness(.82) blur(${blur}px)`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})`, pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,39,130,0.48), rgba(0,0,0,0.10) 45%, rgba(163,0,18,0.48))", mixBlendMode: "screen", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 23% 46%, rgba(48,116,255,0.30), transparent 35%), radial-gradient(circle at 76% 44%, rgba(255,28,34,0.28), transparent 34%), linear-gradient(180deg, rgba(0,0,0,0.36), transparent 42%, rgba(0,0,0,0.50))", pointerEvents: "none", zIndex: 1 }} />
      {children}
    </>
  );
}

function KHBackdrop({ children, title = "HANDZ OR ROUNDZ", subtitle = "a funny idea that turned into...this...", warm = true }) {
  return (
    <div
      className="bd-kh-shell"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: "#020409",
        color: "#fffaf0",
        fontFamily: MENU_FONT,
      }}
    >
      <style>{`
        @keyframes bdKhGlow { 0%,100%{ filter: drop-shadow(0 0 12px rgba(65,132,255,.50)); } 50%{ filter: drop-shadow(0 0 28px rgba(255,38,35,.54)); } }
        @keyframes bdKhButtonIn { from{ opacity:0; transform: translateY(18px);} to{ opacity:1; transform: translateY(0);} }
        @keyframes bdKhLine { 0%{ transform: translateX(-22%); opacity:.18;} 50%{ opacity:.58;} 100%{ transform: translateX(22%); opacity:.18;} }
        @keyframes bdTitleStamp { from{ opacity:0; transform: translate(-50%, -50%) translateY(18px) scale(.96); filter: blur(5px);} to{ opacity:1; transform: translate(-50%, -50%) translateY(0) scale(1); filter: blur(0);} }
        @keyframes bdPressPulse { 0%,100%{ opacity:.62; transform: translateX(-50%) scale(1); text-shadow:2px 2px 0 #000,0 0 14px rgba(65,132,255,.44);} 50%{ opacity:1; transform: translateX(-50%) scale(1.035); text-shadow:2px 2px 0 #000,0 0 22px rgba(255,38,35,.54),0 0 24px rgba(65,132,255,.58);} }
        @keyframes bdScratchDrift { from{ transform: translateX(-5%);} to{ transform: translateX(5%);} }
        @keyframes bdBlueRedSweep { from{ transform: translateX(-120%) skewX(-18deg); } to{ transform: translateX(140%) skewX(-18deg); } }
        @keyframes bdHexWake { 0%,100%{ opacity:.12; transform: translate3d(0,0,0) scale(1); } 50%{ opacity:.30; transform: translate3d(0,-10px,0) scale(1.02); } }
        @keyframes bdHexSelect { 0%,100%{ filter: drop-shadow(0 0 12px rgba(65,132,255,.42)); } 50%{ filter: drop-shadow(0 0 26px rgba(255,38,35,.62)); } }
        @keyframes bdTileElectric { from{ background-position: 0 0, 0 0; } to{ background-position: 76px 0, -76px 0; } }
        @keyframes bdRosterRise { from{ opacity:0; transform: translateY(20px) scale(.96); } to{ opacity:1; transform: translateY(0) scale(1); } }
        .bd-menu-button { transition: transform 150ms ease, filter 150ms ease, box-shadow 150ms ease, background 150ms ease; animation: bdKhButtonIn 420ms ease both; }
        .bd-menu-button:hover { transform: translateX(8px) scale(1.02); filter: brightness(1.12); box-shadow: 0 0 28px rgba(255,255,255,.40), 0 0 28px rgba(65,132,255,.52), 0 0 28px rgba(255,38,35,.38), inset 0 0 18px rgba(255,255,255,.18); }
        .bd-menu-button:active { transform: translateX(4px) scale(.985); }
        .bd-fighter-tile:hover { transform: translateY(-10px) scale(1.06) rotate(.35deg); filter: brightness(1.14); }
      `}</style>
      <MenuVideoBackdrop dim={title ? 0.52 : 0.18} blur={title ? 1.5 : 0} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.24, background: "repeating-linear-gradient(105deg, transparent 0 24px, rgba(67,138,255,0.26) 25px 26px, transparent 27px 52px), repeating-linear-gradient(72deg, transparent 0 34px, rgba(255,38,35,0.18) 35px 36px, transparent 37px 68px)", animation: "bdScratchDrift 8s ease-in-out infinite alternate", zIndex: 1, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: "0", right: "0", top: "62%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(65,132,255,.88), rgba(255,255,255,.86), rgba(255,38,35,.82), transparent)", animation: "bdKhLine 5.5s ease-in-out infinite", zIndex: 2 }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, width: "28%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)", animation: "bdBlueRedSweep 5.6s ease-in-out infinite", pointerEvents: "none", zIndex: 2 }} />

      {title && (
        <div style={{ position: "absolute", left: "50%", top: "11%", transform: "translateX(-50%)", textAlign: "center", zIndex: 2, animation: "bdKhGlow 4s ease-in-out infinite" }}>
          <div style={{ fontSize: "clamp(44px, 6vw, 88px)", letterSpacing: "3px", fontWeight: 900, lineHeight: .88, color: "#f8fbff", textShadow: "4px 4px 0 #000, -3px 0 18px rgba(65,132,255,.72), 3px 0 18px rgba(255,38,35,.62)" }}>{String(title).toUpperCase()}</div>
          {subtitle && <div style={{ marginTop: "12px", fontSize: "clamp(14px, 1.5vw, 22px)", letterSpacing: "4px", color: "rgba(229,239,255,0.82)", textShadow: "2px 2px 0 #000, 0 0 16px rgba(255,38,35,.28)" }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function MainMenu({ onStartAI, onStartLAN, controls, setControls, musicEnabled, setMusicEnabled }) {
  const [showControls, setShowControls] = useState(false);
  const [listeningFor, setListeningFor] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [titleEntered, setTitleEntered] = useState(false);
  const viewport = useViewportInfo();

  const attackLabels = {
    lightPunch: "LIGHT PUNCH",
    heavyPunch: "HEAVY PUNCH",
    heavyPunch2: "HEAVY PUNCH 2",
    lightKick: "LIGHT KICK",
    heavyKick: "HEAVY KICK",
    crouch: "CROUCH",
    block: "BLOCK",
    taunt: "TAUNT",
  };

  useEffect(() => {
    if (!listeningFor) return;

    const captureKey = (e) => {
      e.preventDefault();
      const nextKey = normalizeInputKey(e.key);
      setControls(prev => ({
        ...prev,
        [listeningFor.player]: {
          ...prev[listeningFor.player],
          [listeningFor.action]: nextKey,
        },
      }));
      setListeningFor(null);
    };

    window.addEventListener("keydown", captureKey, { once: true });
    return () => window.removeEventListener("keydown", captureKey);
  }, [listeningFor, setControls]);

  useEffect(() => {
    if (titleEntered || listeningFor) return;

    const enterTitle = (e) => {
      const k = e.key.toLowerCase();
      if (k !== " " && k !== "enter") return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      setSelectedIndex(0);
      setTitleEntered(true);
    };

    window.addEventListener("keydown", enterTitle);
    return () => window.removeEventListener("keydown", enterTitle);
  }, [titleEntered, listeningFor]);

  useEffect(() => {
    if (titleEntered || listeningFor) return;

    const enterTitleFromController = (event) => {
      const input = event.detail?.input;
      if (input !== "confirm") return;
      setSelectedIndex(0);
      setTitleEntered(true);
    };

    window.addEventListener(MOBILE_MENU_INPUT_EVENT, enterTitleFromController);
    return () => window.removeEventListener(MOBILE_MENU_INPUT_EVENT, enterTitleFromController);
  }, [titleEntered, listeningFor]);

  const ControlPanel = ({ playerKey, title }) => (
    <div style={{ marginTop: "10px", marginBottom: "16px", width: "420px" }}>
      <div style={{ color: "rgba(232,242,255,0.86)", fontFamily: MENU_FONT, letterSpacing: "2px", marginBottom: "8px", textAlign: "center", fontWeight: 900, textShadow: "2px 2px 0 #000, 0 0 14px rgba(65,132,255,0.38)" }}>{title}</div>
      {Object.entries(attackLabels).map(([action, label]) => (
        <button
          key={`${playerKey}-${action}`}
          onClick={() => setListeningFor({ player: playerKey, action })}
          className="bd-menu-button"
          style={{
            ...menuButtonStyle,
            width: "420px",
            fontSize: "14px",
            padding: "9px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <span>{label}</span>
          <span style={{ color: "#f8fbff", background: "linear-gradient(90deg, rgba(45,125,255,0.72), rgba(255,38,35,0.62))", padding: "3px 9px", borderRadius: "4px", boxShadow: "inset 0 -1px 0 rgba(0,0,0,.42), 0 0 12px rgba(65,132,255,0.28)", textShadow: "1px 1px 0 #000" }}>
            {listeningFor?.player === playerKey && listeningFor?.action === action ? "PRESS KEY" : (controls[playerKey][action] ?? DEFAULT_CONTROLS[playerKey][action]).toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  );

  const menuItems = [
    { label: "NEW GAME", action: onStartAI },
    { label: "VERSUS LAN", action: onStartLAN },
    { label: "COMMANDS", action: () => setShowControls(v => !v) },
    { label: `MUSIC: ${musicEnabled ? "ON" : "OFF"}`, action: () => setMusicEnabled(v => !v) },
  ];

  useMenuNavigation({
    enabled: titleEntered && !listeningFor,
    itemCount: menuItems.length,
    selectedIndex,
    setSelectedIndex,
    onPick: index => menuItems[index]?.action?.(),
  });

  if (!titleEntered) {
    return (
      <KHBackdrop title="" subtitle={null}>
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex(0);
            setTitleEntered(true);
          }}
          onPointerDown={(e) => {
            if (!viewport.isPhoneLike) return;
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex(0);
            setTitleEntered(true);
          }}
          onKeyDown={(e) => {
            const k = e.key.toLowerCase();
            if (k !== " " && k !== "enter") return;
            e.preventDefault();
            e.stopPropagation();
            setSelectedIndex(0);
            setTitleEntered(true);
          }}
          style={{
            position: "absolute",
            inset: 0,
            border: 0,
            background: "transparent",
            color: "#fffaf0",
            cursor: "pointer",
            fontFamily: MENU_FONT,
            overflow: "hidden",
            outline: "none",
            zIndex: 3,
          }}
          aria-label={viewport.isPhoneLike ? "Tap to play" : "Press spacebar to play"}
        >
          <div style={{ position: "absolute", left: "50%", bottom: viewport.isPhoneLike ? "max(84px, 10dvh)" : "7.5vh", transform: "translateX(-50%)", padding: "12px 28px", minWidth: "min(620px, 82vw)", textAlign: "center", border: "1px solid rgba(255,255,255,0.54)", borderLeft: "5px solid rgba(45,125,255,0.92)", borderRight: "5px solid rgba(255,38,35,0.92)", background: "linear-gradient(90deg, rgba(0,12,36,0.68), rgba(0,0,0,0.42), rgba(65,0,8,0.68))", boxShadow: "0 0 30px rgba(45,125,255,0.32), 0 0 30px rgba(255,38,35,0.26), inset 0 0 22px rgba(255,255,255,0.08)", clipPath: "polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%)", color: "#f8fbff", fontSize: "clamp(18px, 5.2vw, 32px)", letterSpacing: viewport.isPhoneLike ? "3px" : "5px", textShadow: "2px 2px 0 #000, 0 0 18px rgba(65,132,255,.54), 0 0 18px rgba(255,38,35,.42)", animation: "bdPressPulse 1.35s ease-in-out infinite" }}>
            {viewport.isPhoneLike ? "TAP TO PLAY" : "PRESS SPACEBAR TO PLAY"}
          </div>
        </div>
      </KHBackdrop>
    );
  }

  return (
    <KHBackdrop>
      <div
        className="bd-menu-list"
        style={{
          position: "absolute",
          left: "50%",
          top: "54%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 3,
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            onMouseEnter={() => setSelectedIndex(index)}
            onFocus={() => setSelectedIndex(index)}
            onClick={item.action}
            className="bd-menu-button"
            style={{ ...menuButtonStyle, ...selectedMenuStyle(selectedIndex === index) }}
          >
            {item.label}
          </button>
        ))}

        {showControls && (
          <div style={{ maxHeight: "42vh", overflowY: "auto", paddingRight: "8px", marginTop: "10px" }}>
            <ControlPanel playerKey="p1" title="PLAYER 1" />
            <ControlPanel playerKey="p2" title="PLAYER 2" />
          </div>
        )}

        <div style={{ ...menuSmallTextStyle, marginTop: "12px" }}>
          WASD / Enter or IJKL / . to move through menus.
        </div>
      </div>
    </KHBackdrop>
  );
}
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.warn(`[model] ${this.props.label ?? "asset"} failed to load:`, error, info?.componentStack);
  }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

function PreviewFallback({ name = "DANCER" }) {
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,244,214,0.84)", fontFamily: MENU_FONT, fontSize: "58px", letterSpacing: "3px", textShadow: "0 0 24px rgba(255,210,92,0.55)" }}>
      {name} PREVIEW
    </div>
  );
}

function SkitzPreviewModel({ big = false, locked = false, thumbnail = false }) {
  // Use the old GLB body for Skitz's character-select preview.
  const baseGltf = useLoader(GLTFLoader, MODEL_URL);
  const idleFbx = useLoader(FBXLoader, ANIMATION_URLS.idle);
  const texture = useLoader(THREE.TextureLoader, SKITZ_TEXTURE_URL);
  const model = useMemo(() => SkeletonUtils.clone(baseGltf.scene), [baseGltf]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const previewYOffset = useRef(0);

  useEffect(() => {
    applySkitzTextureToCombatModel(model, texture);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(1);
    const frame = THUMBNAIL_FRAME.skitz;
    const targetHeight = (big ? PREVIEW_TARGET_HEIGHT.skitz : thumbnail ? frame.targetHeight : 1.9) * (locked ? 0.86 : 1);
    const fit = getAutoFitScaleAndFloorOffset(model, targetHeight);
    model.scale.setScalar(fit.scale);
    previewYOffset.current = fit.floorOffset + (big ? -1.04 : thumbnail ? frame.yOffset : -0.98);
  }, [model, texture, big, locked, thumbnail]);

  useEffect(() => {
    const clip = idleFbx.animations?.[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat);
    action.clampWhenFinished = false;
    action.reset().fadeIn(0.18).play();
    return () => mixer.stopAllAction();
  }, [mixer, idleFbx]);

  useFrame((_, delta) => {
    mixer.update(delta);
    model.rotation.y = Math.PI / 2;
    model.position.set(thumbnail ? THUMBNAIL_FRAME.skitz.x : 0, previewYOffset.current, 0);
  });

  return <primitive object={model} />;
}

function JosePreviewModel({ big = false, locked = false, thumbnail = false }) {
  // Jose preview uses Jose's own idle.fbx because that file has Jose's mesh/skin.
  const idleFbx = useLoader(FBXLoader, JOSE_MODEL_URL);
  const model = useMemo(() => SkeletonUtils.clone(idleFbx), [idleFbx]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const previewYOffset = useRef(0);

  useEffect(() => {
    brightenJoseModel(model);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(1);
    const frame = THUMBNAIL_FRAME.jose;
    const targetHeight = (big ? PREVIEW_TARGET_HEIGHT.jose : thumbnail ? frame.targetHeight : 1.9) * (locked ? 0.86 : 1);
    const fit = getAutoFitScaleAndFloorOffset(model, targetHeight);
    model.scale.setScalar(fit.scale);
    previewYOffset.current = fit.floorOffset + (big ? -2.0 : thumbnail ? frame.yOffset : -1.08);
  }, [model, big, locked, thumbnail]);

  useEffect(() => {
    const clip = idleFbx.animations?.[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat);
    action.clampWhenFinished = false;
    action.reset().fadeIn(0.18).play();
    return () => mixer.stopAllAction();
  }, [mixer, idleFbx]);

  useFrame((_, delta) => {
    mixer.update(delta);
    model.rotation.y = big ? Math.PI / 2 : Math.PI * 0.56;
    model.position.set(big ? 0 : thumbnail ? THUMBNAIL_FRAME.jose.x : -0.08, previewYOffset.current, 0);
  });

  return <primitive object={model} />;
}

function MockvPreviewModel({ big = false, locked = false, thumbnail = false }) {
  const idleFbx = useLoader(FBXLoader, MOCKV_MODEL_URL);
  const model = useMemo(() => SkeletonUtils.clone(idleFbx), [idleFbx]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const previewYOffset = useRef(0);

  useEffect(() => {
    brightenMockvModel(model);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(1);
    const frame = THUMBNAIL_FRAME.mockv;
    const targetHeight = (big ? PREVIEW_TARGET_HEIGHT.mockv : thumbnail ? frame.targetHeight : 1.9) * (locked ? 0.86 : 1);
    const fit = getAutoFitScaleAndFloorOffset(model, targetHeight);
    model.scale.setScalar(fit.scale);
    previewYOffset.current = fit.floorOffset + (big ? -1.96 : thumbnail ? frame.yOffset : -1.06);
  }, [model, big, locked, thumbnail]);

  useEffect(() => {
    const clip = idleFbx.animations?.[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat);
    action.clampWhenFinished = false;
    action.reset().fadeIn(0.18).play();
    return () => mixer.stopAllAction();
  }, [mixer, idleFbx]);

  useFrame((_, delta) => {
    mixer.update(delta);
    model.rotation.y = big ? Math.PI / 2 : Math.PI * 0.56;
    model.position.set(big ? 0 : thumbnail ? THUMBNAIL_FRAME.mockv.x : -0.05, previewYOffset.current, 0);
  });

  return <primitive object={model} />;
}

function XtraPreviewModel({ big = false, locked = false, thumbnail = false }) {
  const idleFbx = useLoader(FBXLoader, XTRA_MODEL_URL);
  const model = useMemo(() => SkeletonUtils.clone(idleFbx), [idleFbx]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const previewYOffset = useRef(0);

  useEffect(() => {
    brightenXtraModel(model);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(1);
    const frame = THUMBNAIL_FRAME.xtra;
    const targetHeight = (big ? PREVIEW_TARGET_HEIGHT.xtra : thumbnail ? frame.targetHeight : 1.9) * (locked ? 0.86 : 1);
    const fit = getAutoFitScaleAndFloorOffset(model, targetHeight);
    model.scale.setScalar(fit.scale);
    previewYOffset.current = fit.floorOffset + (big ? -1.46 : thumbnail ? frame.yOffset : -1.06);
  }, [model, big, locked, thumbnail]);

  useEffect(() => {
    const clip = idleFbx.animations?.[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat);
    action.clampWhenFinished = false;
    action.reset().fadeIn(0.18).play();
    return () => mixer.stopAllAction();
  }, [mixer, idleFbx]);

  useFrame((_, delta) => {
    mixer.update(delta);
    model.rotation.y = big ? Math.PI / 2 : Math.PI * 0.56;
    model.position.set(big ? -0.35 : thumbnail ? THUMBNAIL_FRAME.xtra.x : -0.05, previewYOffset.current, 0);
  });

  return <primitive object={model} />;
}

function TerrorEastPreviewModel({ big = false, locked = false, thumbnail = false }) {
  const idleFbx = useLoader(FBXLoader, TERROR_EAST_MODEL_URL);
  const model = useMemo(() => SkeletonUtils.clone(idleFbx), [idleFbx]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const previewYOffset = useRef(0);

  useEffect(() => {
    brightenTerrorEastModel(model);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(1);
    const frame = THUMBNAIL_FRAME.terrorEast;
    const targetHeight = (big ? PREVIEW_TARGET_HEIGHT.terrorEast : thumbnail ? frame.targetHeight : 1.9) * (locked ? 0.86 : 1);
    const fit = getAutoFitScaleAndFloorOffset(model, targetHeight);
    model.scale.setScalar(fit.scale);
    previewYOffset.current = fit.floorOffset + (big ? -1.46 : thumbnail ? frame.yOffset : -1.06);
  }, [model, big, locked, thumbnail]);

  useEffect(() => {
    const clip = idleFbx.animations?.[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat);
    action.clampWhenFinished = false;
    action.reset().fadeIn(0.18).play();
    return () => mixer.stopAllAction();
  }, [mixer, idleFbx]);

  useFrame((_, delta) => {
    mixer.update(delta);
    model.rotation.y = big ? Math.PI / 2 : Math.PI * 0.56;
    model.position.set(big ? -0.35 : thumbnail ? THUMBNAIL_FRAME.terrorEast.x : -0.05, previewYOffset.current, 0);
  });

  return <primitive object={model} />;
}

function ReignPreviewModel({ big = false, locked = false, thumbnail = false }) {
  const idleFbx = useLoader(FBXLoader, REIGN_MODEL_URL);
  const model = useMemo(() => SkeletonUtils.clone(idleFbx), [idleFbx]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);
  const previewYOffset = useRef(0);

  useEffect(() => {
    brightenReignModel(model);
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(1);
    const frame = THUMBNAIL_FRAME.reign;
    const targetHeight = (big ? PREVIEW_TARGET_HEIGHT.reign : thumbnail ? frame.targetHeight : 1.9) * (locked ? 0.86 : 1);
    const fit = getAutoFitScaleAndFloorOffset(model, targetHeight);
    model.scale.setScalar(fit.scale);
    previewYOffset.current = fit.floorOffset + (big ? -1.54 : thumbnail ? frame.yOffset : -0.98);
  }, [model, big, locked, thumbnail]);

  useEffect(() => {
    const clip = idleFbx.animations?.[0];
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat);
    action.clampWhenFinished = false;
    action.reset().fadeIn(0.18).play();
    return () => mixer.stopAllAction();
  }, [mixer, idleFbx]);

  useFrame((_, delta) => {
    mixer.update(delta);
    model.rotation.y = Math.PI / 2;
    model.position.set(big ? 0 : thumbnail ? THUMBNAIL_FRAME.reign.x : -0.05, previewYOffset.current, 0);
  });

  return <primitive object={model} />;
}

function CharacterPreviewModel({ big = false, locked = false, thumbnail = false, characterId = "skitz" }) {
  if (characterId === "jose") return <JosePreviewModel big={big} locked={locked} thumbnail={thumbnail} />;
  if (characterId === "mockv") return <MockvPreviewModel big={big} locked={locked} thumbnail={thumbnail} />;
  if (characterId === "xtra") return <XtraPreviewModel big={big} locked={locked} thumbnail={thumbnail} />;
  if (characterId === "terrorEast") return <TerrorEastPreviewModel big={big} locked={locked} thumbnail={thumbnail} />;
  if (characterId === "reign") return <ReignPreviewModel big={big} locked={locked} thumbnail={thumbnail} />;
  return <SkitzPreviewModel big={big} locked={locked} thumbnail={thumbnail} />;
}

function BigCharacterShowcase({ character }) {
  const available = character?.available;
  return (
    <div
      style={{
        position: "absolute",
        right: "0",
        top: "0",
        width: "52vw",
        height: "100vh",
        overflow: "hidden",
        background:
          "linear-gradient(90deg, rgba(0,0,0,0), rgba(31,24,10,0.48))",
        borderLeft: "1px solid rgba(255,207,107,0.14)",
      }}
    >
      <div style={{ position: "absolute", right: "7%", top: "8%", fontSize: "118px", letterSpacing: "10px", color: "rgba(255,255,255,0.055)", transform: "rotate(-7deg)", pointerEvents: "none" }}>
        {available ? character.name.toUpperCase() : "LOCKED"}
      </div>
      {available ? (
        <ModelErrorBoundary key={character.id} fallback={<PreviewFallback name={character.name} />}>
          <Canvas camera={{ position: [0, 0.45, 6.1], fov: 34 }}>
            <ambientLight intensity={1.75} />
            <directionalLight position={[2.5, 4, 4]} intensity={1.75} />
            <pointLight position={[-2, 2, 3]} intensity={0.85} color="#ffcf6b" />
            <Suspense fallback={null}>
              <CharacterPreviewModel big characterId={character.id} />
            </Suspense>
          </Canvas>
        </ModelErrorBoundary>
      ) : (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "220px", color: "rgba(255,255,255,0.10)", textShadow: "0 0 35px rgba(255,210,92,0.35)" }}>?</div>
      )}
      <div style={{ position: "absolute", left: "8%", bottom: "8%", right: "8%", color: "#182235", fontFamily: "Impact, fantasy", textShadow: "0 2px 0 #fff, 0 0 18px rgba(255,187,50,0.38)" }}>
        <div style={{ fontSize: "68px", letterSpacing: "4px", lineHeight: 0.94 }}>{available ? character.name.toUpperCase() : "MYSTERY"}</div>
        <div style={{ marginTop: "10px", color: "#b87813", fontSize: "22px", letterSpacing: "2px" }}>{available ? character.tag : "COMING SOON"}</div>
        <div style={{ marginTop: "14px", fontFamily: "Arial Black, Impact, sans-serif", fontSize: "14px", lineHeight: 1.45, maxWidth: "510px", color: "rgba(24,34,53,0.78)" }}>
          {available ? character.passive : "This fighter slot is locked for a future dancer."}
        </div>
      </div>
    </div>
  );
}

function characterSelectStats(character) {
  if (!character?.available) return [];
  const hp = Math.round(((character.maxHp ?? 100) / 130) * 100);
  const stamina = Math.round(((character.staminaMax ?? 100) / 145) * 100);
  const power = Math.round(((character.damageScale ?? 1) / 1.28) * 100);
  const defense = Math.round((1 / Math.max(0.72, character.damageTakenScale ?? 1)) * 78);
  return [
    { label: "POWER", value: THREE.MathUtils.clamp(power, 38, 100) },
    { label: "STAMINA", value: THREE.MathUtils.clamp(stamina, 42, 100) },
    { label: "VITALITY", value: THREE.MathUtils.clamp(hp, 42, 100) },
    { label: "DEFENSE", value: THREE.MathUtils.clamp(defense, 42, 100) },
  ];
}

function CharacterStatBars({ character }) {
  const stats = characterSelectStats(character);
  return (
    <div style={{ marginTop: "22px", display: "grid", gap: "9px", width: "min(460px, 100%)" }}>
      {stats.map(stat => (
        <div key={stat.label} style={{ display: "grid", gridTemplateColumns: "92px 1fr 42px", alignItems: "center", gap: "10px", fontFamily: BODY_FONT, fontWeight: 900, color: "rgba(232,242,255,0.86)", textShadow: "1px 1px 0 #000, 0 0 10px rgba(65,132,255,0.32)" }}>
          <div style={{ fontSize: "12px", letterSpacing: "1.5px" }}>{stat.label}</div>
          <div style={{ height: "10px", borderRadius: "999px", overflow: "hidden", border: "1px solid rgba(192,226,255,0.42)", background: "rgba(0,0,0,0.46)", boxShadow: "inset 0 1px 4px rgba(0,0,0,0.55)" }}>
            <div style={{ width: `${stat.value}%`, height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #2d7dff, #f8fbff 52%, #ff2623)", boxShadow: "0 0 14px rgba(65,132,255,0.48), 0 0 14px rgba(255,38,35,0.32)" }} />
          </div>
          <div style={{ fontSize: "12px", textAlign: "right", color: "#d7e9ff" }}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

function CharacterPortraitTile({ character, index, selected, onHover, onSelect, focusUpdates = true }) {
  const available = character.available;
  const [portraitFailed, setPortraitFailed] = useState(false);
  const portraitCamera = THUMBNAIL_FRAME[character.id]?.camera ?? THUMBNAIL_FRAME.skitz.camera;
  const cornerBlue = selected ? "#ffffff" : "#7fb8ff";
  const cornerRed = selected ? "#ffffff" : "#ff5a52";
  const showPortrait = available && character.portraitUrl && !portraitFailed;

  useEffect(() => {
    setPortraitFailed(false);
  }, [character.portraitUrl]);

  return (
    <button
      disabled={!available}
      onMouseEnter={() => onHover(character.id)}
      onFocus={() => focusUpdates && onHover(character.id)}
      onClick={() => available && onSelect(character.id)}
      style={{
        width: CHARACTER_TILE_WIDTH,
        height: CHARACTER_TILE_HEIGHT,
        padding: 0,
        overflow: "hidden",
        position: "relative",
        cursor: available ? "pointer" : "not-allowed",
        border: selected ? "3px solid #ffffff" : "1px solid rgba(192,226,255,0.34)",
        borderRadius: "6px",
        background: available
          ? "linear-gradient(135deg, rgba(0,35,104,0.94), rgba(4,6,14,0.96) 48%, rgba(116,0,14,0.94))"
          : "linear-gradient(180deg, rgba(8,14,26,0.82), rgba(0,0,0,0.72))",
        boxShadow: selected
          ? "0 0 30px rgba(255,255,255,0.62), 0 0 26px rgba(65,132,255,0.58), 0 0 26px rgba(255,38,35,0.52), inset 0 0 22px rgba(255,255,255,0.18)"
          : "0 10px 22px rgba(0,0,0,0.48), 0 0 16px rgba(65,132,255,0.18)",
        transform: selected ? "translateY(-10px) scale(1.08)" : undefined,
        transition: "transform 160ms ease, filter 160ms ease, box-shadow 160ms ease",
        animation: selected ? "bdHexSelect 1.2s ease-in-out infinite" : `bdRosterRise 380ms ease both ${index * 38}ms`,
      }}
      className="bd-fighter-tile"
    >
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(110deg, transparent 0 14px, rgba(255,255,255,0.18) 15px 16px, transparent 17px 30px), repeating-linear-gradient(70deg, transparent 0 18px, rgba(65,132,255,0.20) 19px 20px, rgba(255,38,35,0.16) 21px 22px, transparent 23px 38px)", opacity: selected ? 0.62 : 0.26, mixBlendMode: "screen", pointerEvents: "none", zIndex: 2, animation: "bdTileElectric 1.08s linear infinite" }} />
      <div style={{ position: "absolute", inset: "5px", border: selected ? "1px solid rgba(255,255,255,0.88)" : "1px solid rgba(255,255,255,0.42)", borderRadius: "3px", pointerEvents: "none", zIndex: 5, boxShadow: selected ? "inset 0 0 18px rgba(255,255,255,0.22)" : "inset 0 0 14px rgba(65,132,255,0.12)" }} />
      <div style={{ position: "absolute", inset: "7px", pointerEvents: "none", zIndex: 6, background: `linear-gradient(${cornerBlue} 0 0) left top / 30px 2px no-repeat, linear-gradient(${cornerBlue} 0 0) left top / 2px 30px no-repeat, linear-gradient(${cornerRed} 0 0) right top / 30px 2px no-repeat, linear-gradient(${cornerRed} 0 0) right top / 2px 30px no-repeat, linear-gradient(${cornerBlue} 0 0) left bottom / 30px 2px no-repeat, linear-gradient(${cornerBlue} 0 0) left bottom / 2px 30px no-repeat, linear-gradient(${cornerRed} 0 0) right bottom / 30px 2px no-repeat, linear-gradient(${cornerRed} 0 0) right bottom / 2px 30px no-repeat` }} />
      <div style={{ position: "absolute", left: "8px", top: "7px", zIndex: 7, color: selected ? "#05060c" : "#f8fbff", background: selected ? "linear-gradient(90deg, #ffffff, #9fd0ff)" : "rgba(0,0,0,0.62)", border: "1px solid rgba(255,255,255,0.42)", borderRadius: "3px", padding: "2px 5px", fontFamily: MENU_FONT, fontSize: "10px", letterSpacing: ".6px", textShadow: selected ? "none" : "1px 1px 0 #000" }}>{String(index).padStart(2, "0")}</div>
      {available ? (
        <div style={{ position: "absolute", inset: "clamp(8px, .85vw, 11px) clamp(7px, .85vw, 10px) clamp(30px, 2.7vw, 36px)", overflow: "hidden", borderRadius: "4px", background: "linear-gradient(135deg, #092866, #05060c 52%, #5d050d)", boxShadow: "inset 0 0 20px rgba(0,0,0,0.62)", zIndex: 1 }}>
          {showPortrait ? (
            <img
              src={character.portraitUrl}
              alt=""
              draggable={false}
              onError={(event) => {
                event.currentTarget.style.display = "none";
                setPortraitFailed(true);
              }}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: character.portraitPosition ?? "center",
                filter: "contrast(1.08) saturate(1.18)",
                pointerEvents: "none",
              }}
            />
          ) : (
            <ModelErrorBoundary fallback={<div style={{ color: "#fff4d6", fontFamily: MENU_FONT, fontSize: "18px", paddingTop: "28px" }}>{character.name}</div>}>
              <Canvas camera={portraitCamera}>
                <ambientLight intensity={3.1} />
                <directionalLight position={[2.5, 4, 4]} intensity={2.55} />
                <directionalLight position={[-2.4, 2.4, 2.8]} intensity={1.15} color="#fff4d6" />
                <pointLight position={[0, 1.8, 2.6]} intensity={1.05} color="#ffcf6b" />
                <Suspense fallback={null}>
                  <CharacterPreviewModel thumbnail characterId={character.id} />
                </Suspense>
              </Canvas>
            </ModelErrorBoundary>
          )}
        </div>
      ) : (
        <div style={{ position: "absolute", inset: "clamp(8px, .85vw, 11px) clamp(7px, .85vw, 10px) clamp(30px, 2.7vw, 36px)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.62)", fontSize: "clamp(22px, 2.5vw, 34px)", fontFamily: MENU_FONT }}>?</div>
      )}
      <div style={{ position: "absolute", left: "clamp(8px, 1vw, 12px)", right: "clamp(8px, 1vw, 12px)", bottom: "clamp(6px, .65vw, 8px)", height: "clamp(20px, 2vw, 26px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", border: selected ? "1px solid rgba(255,255,255,0.9)" : "1px solid rgba(192,226,255,0.32)", background: selected ? "linear-gradient(90deg, #2d7dff, #ffffff, #ff2623)" : "linear-gradient(90deg, rgba(0,19,58,0.88), rgba(0,0,0,0.82), rgba(82,0,9,0.88))", color: selected ? "#05060c" : available ? "#f8fbff" : "rgba(255,255,255,0.48)", fontFamily: MENU_FONT, fontSize: "clamp(8px, .82vw, 11px)", letterSpacing: "clamp(.4px, .12vw, 1px)", textShadow: selected ? "0 1px 0 rgba(255,255,255,0.7)" : "1px 1px 0 #000, 0 0 10px rgba(65,132,255,0.28)", boxShadow: selected ? "0 0 16px rgba(255,255,255,0.36)" : "0 0 12px rgba(65,132,255,0.18)", zIndex: 7 }}>
        {available ? character.name.toUpperCase() : (character.lockedLabel ?? "SOON")}
      </div>
    </button>
  );
}

function CharacterHoneycombRoster({ selectedIds = [], onHover, onSelect, renderBadges, focusUpdates = true }) {
  const selectedSet = new Set(Array.isArray(selectedIds) ? selectedIds : [selectedIds]);
  let cursor = 0;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "clamp(16px, 2vw, 26px)",
        borderRadius: "8px",
        background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 28px), repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 28px), linear-gradient(135deg, rgba(0,24,76,0.70), rgba(0,0,0,0.56) 48%, rgba(80,0,10,0.70))",
        border: "1px solid rgba(192,226,255,0.34)",
        boxShadow: "0 0 34px rgba(45,125,255,0.26), 0 0 30px rgba(255,38,35,0.20), inset 0 0 22px rgba(255,255,255,0.08)",
      }}
    >
      {CHARACTER_SELECT_GRID_ROWS.map((count, rowIndex) => {
        const rowSlots = CHARACTER_SELECT_SLOTS.slice(cursor, cursor + count);
        const startIndex = cursor;
        cursor += count;
        return (
          <div
            key={`fighter-row-${rowIndex}`}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "clamp(18px, 2vw, 28px)",
              marginTop: rowIndex === 0 ? 0 : "clamp(18px, 2vw, 28px)",
            }}
          >
            {rowSlots.map((character, rowSlotIndex) => {
              const slotIndex = startIndex + rowSlotIndex;
              return (
                <div
                  key={character.id}
                  style={{
                    position: "relative",
                    width: CHARACTER_TILE_WIDTH,
                    height: CHARACTER_TILE_HEIGHT,
                  }}
                >
                  <CharacterPortraitTile
                    character={character}
                    index={slotIndex + 1}
                    selected={selectedSet.has(character.id)}
                    onHover={(id) => onHover?.(id, slotIndex)}
                    onSelect={(id) => onSelect?.(id, slotIndex)}
                    focusUpdates={focusUpdates}
                  />
                  {renderBadges?.({ character, slotIndex })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function CharacterSelect({ settings, onBack, onSelect, title = "CHOOSE YOUR DANCER", subtitle = null }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedCharacter = CHARACTER_SELECT_SLOTS[selectedIndex] ?? CHARACTER_SELECT_SLOTS[0];
  const modeLabel = subtitle ?? (settings?.mode === "ai"
    ? `${settings?.aiMode === "story" ? "RUN THE GUANTLENT" : settings?.aiMode === "choose" ? "CHOOSE OPPONENT" : "MIRROR MATCH"} / ${settings?.difficulty?.toUpperCase?.() ?? "MEDIUM"}`
    : "2 PLAYERS LAN");

  useMenuNavigation({
    itemCount: CHARACTER_SELECT_SLOTS.length,
    columns: 3,
    selectedIndex,
    setSelectedIndex,
    onPick: index => {
      const character = CHARACTER_SELECT_SLOTS[index];
      if (character?.available) onSelect(character.id);
    },
    onBack,
  });

  const pickRandomFighter = () => {
    const availableSlots = CHARACTER_SELECT_SLOTS
      .map((character, index) => ({ character, index }))
      .filter(slot => slot.character.available);
    const next = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    if (!next) return;
    setSelectedIndex(next.index);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: "#020409",
        color: "#fffaf0",
        fontFamily: MENU_FONT,
      }}
    >
      <style>{`
        @keyframes bdSelectNameSlide { from{ opacity:0; transform: translateX(20px); } to{ opacity:1; transform: translateX(0); } }
        @keyframes bdSelectModelPop { from{ opacity:0; transform: translateY(18px) scale(.96); } to{ opacity:1; transform: translateY(0) scale(1); } }
        @keyframes bdHexSelect { 0%,100%{ filter: drop-shadow(0 0 12px rgba(65,132,255,.46)); } 50%{ filter: drop-shadow(0 0 26px rgba(255,38,35,.62)); } }
        @keyframes bdTileElectric { from{ background-position: 0 0, 0 0; } to{ background-position: 76px 0, -76px 0; } }
        @keyframes bdRosterRise { from{ opacity:0; transform: translateY(20px) scale(.96); } to{ opacity:1; transform: translateY(0) scale(1); } }
        .bd-fighter-tile:hover { transform: translateY(-10px) scale(1.06) rotate(.35deg); filter: brightness(1.14); }
      `}</style>
      <MenuVideoBackdrop dim={0.66} blur={2} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.24, background: "linear-gradient(30deg, rgba(45,125,255,0.20) 12%, transparent 12.5%, transparent 87%, rgba(255,38,35,0.18) 87.5%), linear-gradient(150deg, rgba(45,125,255,0.16) 12%, transparent 12.5%, transparent 87%, rgba(255,38,35,0.16) 87.5%)", backgroundSize: "92px 160px", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,39,130,0.32), transparent 55%, rgba(163,0,18,0.32))", zIndex: 1 }} />
      <div style={{ position: "absolute", right: "6%", top: "9%", fontSize: "118px", letterSpacing: "12px", color: "rgba(232,242,255,0.085)", transform: "rotate(-7deg)", pointerEvents: "none", zIndex: 1 }}>
        {selectedCharacter.available ? selectedCharacter.name.toUpperCase() : "LOCKED"}
      </div>

      <div style={{ position: "absolute", left: "46px", top: "28px", right: "46px", letterSpacing: "2px", textShadow: "3px 3px 0 #000, 0 0 22px rgba(65,132,255,0.38), 0 0 22px rgba(255,38,35,0.26)", zIndex: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", color: "#f8fbff" }}>
        <div>
          <div style={{ fontSize: "52px" }}>{String(title).toUpperCase()}</div>
          <div style={{ fontSize: "16px", color: "#bfdcff", marginTop: "6px" }}>{modeLabel}</div>
        </div>
        <div style={{ fontSize: "18px", color: "rgba(232,242,255,0.82)", marginTop: "14px" }}>
          {settings?.p1Character ? `PLAYER: ${getCharacterStats(settings.p1Character).name?.toUpperCase?.() ?? "SKITZ"}` : "SELECT YOUR FIGHTER"}
        </div>
      </div>

      <div style={{ position: "absolute", left: "28px", right: "28px", top: "104px", bottom: "104px", display: "grid", gridTemplateColumns: "minmax(150px, .7fr) minmax(390px, 1fr) minmax(210px, .72fr)", gap: "24px", alignItems: "center", zIndex: 2 }}>
        <div style={{ height: "min(58vh, 460px)", position: "relative", overflow: "hidden", clipPath: "polygon(12% 0, 88% 0, 100% 50%, 88% 100%, 12% 100%, 0 50%)", background: "linear-gradient(135deg, rgba(0,35,104,0.42), rgba(0,0,0,0.26), rgba(116,0,14,0.42))", boxShadow: "inset 0 0 34px rgba(255,255,255,0.12), 0 0 28px rgba(45,125,255,0.24), 0 0 28px rgba(255,38,35,0.18)" }}>
          <div key={`model-shell-${selectedCharacter.id}`} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", animation: "bdSelectModelPop 300ms ease both" }}>
            {selectedCharacter.available ? (
              <ModelErrorBoundary key={`big-${selectedCharacter.id}`} fallback={<PreviewFallback name={selectedCharacter.name} />}>
                <Canvas camera={{ position: [0, 0.45, 6.4], fov: 31 }}>
                  <ambientLight intensity={2.85} />
                  <directionalLight position={[2.5, 4, 4]} intensity={2.4} />
                  <directionalLight position={[-2, 2.2, 3]} intensity={1.0} color="#fff4d6" />
                  <pointLight position={[0, 2, 3]} intensity={1.2} color="#ffcf6b" />
                  <Suspense fallback={null}>
                    <CharacterPreviewModel big characterId={selectedCharacter.id} />
                  </Suspense>
                </Canvas>
              </ModelErrorBoundary>
            ) : (
              <div style={{ fontSize: "clamp(90px, 13vw, 170px)", color: "rgba(72,46,6,0.28)", textShadow: "0 1px 0 rgba(255,255,255,0.80)" }}>?</div>
            )}
          </div>
        </div>

        <div style={{ justifySelf: "center", width: "max-content", maxWidth: "100%" }}>
          <CharacterHoneycombRoster
            selectedIds={selectedCharacter.id}
            onHover={(id, slotIndex) => setSelectedIndex(slotIndex)}
            onSelect={(id, slotIndex) => {
              const character = CHARACTER_SELECT_SLOTS[slotIndex];
              if (character?.available) onSelect(id);
            }}
          />
        </div>

        <div key={`info-${selectedCharacter.id}`} style={{ color: "#f8fbff", textShadow: "3px 3px 0 #000, 0 0 18px rgba(65,132,255,0.34), 0 0 18px rgba(255,38,35,0.24)", animation: "bdSelectNameSlide 260ms ease both" }}>
          <div style={{ fontSize: "clamp(44px, 6vw, 82px)", letterSpacing: "3px", lineHeight: 0.94 }}>{selectedCharacter.available ? selectedCharacter.name.toUpperCase() : "MYSTERY"}</div>
          <div style={{ marginTop: "14px", color: "#ff5a52", fontSize: "clamp(18px, 2.2vw, 28px)", letterSpacing: "2px" }}>{selectedCharacter.available ? selectedCharacter.tag : "COMING SOON"}</div>
          <div style={{ marginTop: "18px", fontFamily: BODY_FONT, fontWeight: 800, fontSize: "clamp(12px, 1.15vw, 16px)", lineHeight: 1.45, maxWidth: "560px", color: "rgba(232,242,255,0.78)", textShadow: "1px 1px 0 #000" }}>
            {selectedCharacter.available ? selectedCharacter.passive : "A future dancer can live here when you add more fighters."}
          </div>
          <CharacterStatBars character={selectedCharacter} />
        </div>
      </div>

      <div style={{ position: "absolute", left: "50%", bottom: "24px", width: "min(820px, calc(100% - 56px))", transform: "translateX(-50%)", display: "flex", gap: "14px", zIndex: 6, alignItems: "center", justifyContent: "center", flexWrap: "nowrap" }}>
        <button onClick={onBack} className="bd-menu-button" style={{ ...menuButtonStyle, width: "220px", marginBottom: 0 }}>
          BACK
        </button>
        <button onClick={pickRandomFighter} className="bd-menu-button" style={{ ...menuButtonStyle, width: "220px", marginBottom: 0 }}>
          RANDOM
        </button>
        <button
          onClick={() => selectedCharacter.available && onSelect(selectedCharacter.id)}
          disabled={!selectedCharacter.available}
          className="bd-menu-button"
          style={{ ...menuButtonStyle, width: "320px", marginBottom: 0, borderColor: selectedCharacter.available ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.25)", opacity: selectedCharacter.available ? 1 : 0.45 }}
        >
          SELECT {selectedCharacter.available ? selectedCharacter.name.toUpperCase() : "LOCKED"}
        </button>
      </div>
    </div>
  );
}

function LanCharacterSelect({ settings, onBack, onConfirm }) {
  const rosterColumns = 3;
  const availableRoster = CHARACTER_SELECT_SLOTS.filter(character => character.available);
  const firstAvailableId = availableRoster[0]?.id ?? "skitz";
  const secondAvailableId = availableRoster[1]?.id ?? firstAvailableId;
  const startingP1 = Math.max(0, CHARACTER_SELECT_SLOTS.findIndex(character => character.id === (settings?.p1Character ?? firstAvailableId)));
  const startingP2 = Math.max(0, CHARACTER_SELECT_SLOTS.findIndex(character => character.id === (settings?.p2Character ?? secondAvailableId)));
  const [p1Index, setP1Index] = useState(startingP1);
  const [p2Index, setP2Index] = useState(startingP2);
  const [p1Locked, setP1Locked] = useState(false);
  const [p2Locked, setP2Locked] = useState(false);
  const p1Character = CHARACTER_SELECT_SLOTS[p1Index] ?? CHARACTER_SELECT_SLOTS[0];
  const p2Character = CHARACTER_SELECT_SLOTS[p2Index] ?? CHARACTER_SELECT_SLOTS[0];

  const moveCursor = (player, delta) => {
    const setIndex = player === "p1" ? setP1Index : setP2Index;
    setIndex(current => (current + delta + CHARACTER_SELECT_SLOTS.length) % CHARACTER_SELECT_SLOTS.length);
  };

  const lockPlayer = (player) => {
    const index = player === "p1" ? p1Index : p2Index;
    const character = CHARACTER_SELECT_SLOTS[index];
    if (!character?.available) return;
    if (player === "p1") setP1Locked(locked => !locked);
    else setP2Locked(locked => !locked);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      const p1Move = !p1Locked && (k === "w" || k === "a" || k === "s" || k === "d");
      const p2Move = !p2Locked && (k === "i" || k === "j" || k === "k" || k === "l");
      const p1Pick = k === "enter";
      const p2Pick = k === ".";

      if (!(p1Move || p2Move || p1Pick || p2Pick || k === "escape")) return;
      e.preventDefault();

      if (k === "escape") return onBack?.();
      if (p1Pick) return lockPlayer("p1");
      if (p2Pick) return lockPlayer("p2");

      if (k === "w") moveCursor("p1", -rosterColumns);
      if (k === "s") moveCursor("p1", rosterColumns);
      if (k === "a") moveCursor("p1", -1);
      if (k === "d") moveCursor("p1", 1);
      if (k === "i") moveCursor("p2", -rosterColumns);
      if (k === "k") moveCursor("p2", rosterColumns);
      if (k === "j") moveCursor("p2", -1);
      if (k === "l") moveCursor("p2", 1);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [p1Index, p2Index, p1Locked, p2Locked, onBack]);

  useEffect(() => {
    const moveActiveCursor = (delta) => {
      if (!p1Locked) return moveCursor("p1", delta);
      if (!p2Locked) return moveCursor("p2", delta);
    };

    const lockActivePlayer = () => {
      if (!p1Locked) return lockPlayer("p1");
      if (!p2Locked) return lockPlayer("p2");
    };

    const onMobileMenuInput = (event) => {
      const input = event.detail?.input;
      if (input === "back") return onBack?.();
      if (input === "confirm") return lockActivePlayer();
      if (input === "up") return moveActiveCursor(-rosterColumns);
      if (input === "down") return moveActiveCursor(rosterColumns);
      if (input === "left") return moveActiveCursor(-1);
      if (input === "right") return moveActiveCursor(1);
    };

    window.addEventListener(MOBILE_MENU_INPUT_EVENT, onMobileMenuInput);
    return () => window.removeEventListener(MOBILE_MENU_INPUT_EVENT, onMobileMenuInput);
  }, [p1Index, p2Index, p1Locked, p2Locked, onBack]);

  useEffect(() => {
    if (!p1Locked || !p2Locked || !p1Character.available || !p2Character.available) return undefined;

    const timer = setTimeout(() => {
      onConfirm?.({
        p1Character: p1Character.id,
        p2Character: p2Character.id,
      });
    }, 520);

    return () => clearTimeout(timer);
  }, [p1Locked, p2Locked, p1Character, p2Character, onConfirm]);

  const pickByMouse = (characterId) => {
    const index = CHARACTER_SELECT_SLOTS.findIndex(character => character.id === characterId);
    if (index < 0 || !CHARACTER_SELECT_SLOTS[index]?.available) return;

    if (!p1Locked) {
      setP1Index(index);
      setP1Locked(true);
      return;
    }

    if (!p2Locked) {
      setP2Index(index);
      setP2Locked(true);
      return;
    }

    setP2Index(index);
    setP2Locked(false);
  };

  const PlayerPickPanel = ({ player, character, locked }) => {
    const isP1 = player === "P1";
    return (
      <div
        style={{
          minHeight: "136px",
          padding: "14px 16px",
          borderRadius: "8px",
          border: locked ? "1px solid rgba(255,255,255,0.86)" : "1px solid rgba(192,226,255,0.34)",
          background: isP1
            ? "linear-gradient(135deg, rgba(0,35,104,0.76), rgba(0,0,0,0.66))"
            : "linear-gradient(135deg, rgba(0,0,0,0.66), rgba(116,0,14,0.76))",
          boxShadow: locked
            ? "0 0 28px rgba(255,255,255,0.30), 0 0 24px rgba(65,132,255,0.32), 0 0 24px rgba(255,38,35,0.26), inset 0 0 20px rgba(255,255,255,0.12)"
            : "0 14px 28px rgba(0,0,0,0.38)",
          color: "#f8fbff",
          textShadow: "2px 2px 0 #000, 0 0 12px rgba(65,132,255,0.30)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center" }}>
          <div style={{ color: isP1 ? "#7fb8ff" : "#ff6b63", fontSize: "18px", letterSpacing: "2px" }}>{player}</div>
          <div style={{ fontSize: "12px", color: locked ? "#f8fbff" : "rgba(232,242,255,0.62)", letterSpacing: "1.5px" }}>
            {locked ? "LOCKED" : isP1 ? "WASD + ENTER" : "IJKL + ."}
          </div>
        </div>
        <div style={{ marginTop: "10px", fontSize: "40px", lineHeight: 0.92, letterSpacing: "2px" }}>
          {character.available ? character.name.toUpperCase() : "LOCKED"}
        </div>
        <div style={{ marginTop: "10px", color: isP1 ? "#bfdcff" : "#ffaaa6", fontSize: "14px", letterSpacing: "1px" }}>
          {character.available ? character.tag : "COMING SOON"}
        </div>
        <div style={{ marginTop: "10px", fontFamily: BODY_FONT, fontWeight: 800, fontSize: "11px", lineHeight: 1.32, color: "rgba(232,242,255,0.72)" }}>
          {character.available ? character.passive : "Move to an available fighter before locking in."}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: "#020409",
        color: "#fffaf0",
        fontFamily: MENU_FONT,
      }}
    >
      <style>{`
        @keyframes bdHexSelect { 0%,100%{ filter: drop-shadow(0 0 12px rgba(65,132,255,.46)); } 50%{ filter: drop-shadow(0 0 26px rgba(255,38,35,.62)); } }
        @keyframes bdTileElectric { from{ background-position: 0 0, 0 0; } to{ background-position: 76px 0, -76px 0; } }
        @keyframes bdRosterRise { from{ opacity:0; transform: translateY(20px) scale(.96); } to{ opacity:1; transform: translateY(0) scale(1); } }
        .bd-fighter-tile:hover { transform: translateY(-10px) scale(1.06) rotate(.35deg); filter: brightness(1.14); }
      `}</style>
      <MenuVideoBackdrop dim={0.66} blur={2} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.24, background: "linear-gradient(30deg, rgba(45,125,255,0.20) 12%, transparent 12.5%, transparent 87%, rgba(255,38,35,0.18) 87.5%), linear-gradient(150deg, rgba(45,125,255,0.16) 12%, transparent 12.5%, transparent 87%, rgba(255,38,35,0.16) 87.5%)", backgroundSize: "92px 160px", zIndex: 1 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,39,130,0.32), transparent 55%, rgba(163,0,18,0.32))", zIndex: 1 }} />
      <div style={{ position: "absolute", right: "6%", top: "9%", fontSize: "106px", letterSpacing: "12px", color: "rgba(232,242,255,0.085)", transform: "rotate(-7deg)", pointerEvents: "none", zIndex: 1 }}>
        LAN SELECT
      </div>

      <div style={{ position: "absolute", left: "46px", top: "28px", right: "46px", letterSpacing: "2px", textShadow: "3px 3px 0 #000, 0 0 22px rgba(65,132,255,0.38), 0 0 22px rgba(255,38,35,0.26)", zIndex: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", color: "#f8fbff" }}>
        <div>
          <div style={{ fontSize: "52px" }}>LAN CHARACTER SELECT</div>
          <div style={{ fontSize: "16px", color: "#bfdcff", marginTop: "6px" }}>P1: WASD + ENTER / P2: IJKL + . / BOTH LOCK TO CONTINUE</div>
        </div>
        <button onClick={onBack} className="bd-menu-button" style={{ ...menuButtonStyle, width: "210px" }}>
          BACK
        </button>
      </div>

      <div style={{ position: "absolute", left: "34px", right: "34px", top: "122px", bottom: "34px", zIndex: 3, display: "flex", flexDirection: "column", gap: "18px", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "min(920px, 100%)", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "16px" }}>
          <PlayerPickPanel player="P1" character={p1Character} locked={p1Locked} />
          <PlayerPickPanel player="P2" character={p2Character} locked={p2Locked} />
        </div>
        <CharacterHoneycombRoster
          selectedIds={[p1Character.id, p2Character.id]}
          onHover={(id, slotIndex) => {
            if (!p1Locked) setP1Index(slotIndex);
            else if (!p2Locked) setP2Index(slotIndex);
          }}
          onSelect={pickByMouse}
          focusUpdates={false}
          renderBadges={({ slotIndex }) => {
            const p1Here = p1Index === slotIndex;
            const p2Here = p2Index === slotIndex;
            return (
              <>
                {p1Here && (
                  <div style={{ position: "absolute", left: "-8px", top: "-12px", zIndex: 4, width: "38px", height: "24px", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", background: p1Locked ? "#fff4d6" : "#d4a11f", color: "#111", fontFamily: MENU_FONT, fontSize: "13px", boxShadow: "0 0 16px rgba(255,244,214,0.55)" }}>P1</div>
                )}
                {p2Here && (
                  <div style={{ position: "absolute", right: "-8px", top: p1Here ? "18px" : "-12px", zIndex: 4, width: "38px", height: "24px", borderRadius: "999px", display: "flex", alignItems: "center", justifyContent: "center", background: p2Locked ? "#fff4d6" : "#78c7ff", color: "#111", fontFamily: MENU_FONT, fontSize: "13px", boxShadow: "0 0 16px rgba(210,235,255,0.55)" }}>P2</div>
                )}
              </>
            );
          }}
        />
      </div>
    </div>
  );
}

function AiModeSelect({ settings, onBack, onPick }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const modes = [
    { id: "story", title: "RUN THE GUANTLENT", desc: "Fight through each available character. First to 3 wins every battle." },
    { id: "choose", title: "CHOOSE OPPONENT", desc: "Pick exactly who you want to fight." },
    { id: "mirror", title: "MIRROR MATCH", desc: "Fight the AI using the same character you picked." },
  ];

  useMenuNavigation({
    itemCount: modes.length,
    selectedIndex,
    setSelectedIndex,
    onPick: index => onPick(modes[index]?.id),
    onBack,
  });

  return (
    <KHBackdrop title="SELECT MODE" subtitle={`PLAYER: ${getCharacterStats(settings?.p1Character ?? "skitz").name?.toUpperCase?.() ?? "SKITZ"}`} warm={false}>
      <div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", zIndex: 3 }}>
        {modes.map((mode, index) => (
          <button
            key={mode.id}
            onMouseEnter={() => setSelectedIndex(index)}
            onFocus={() => setSelectedIndex(index)}
            onClick={() => onPick(mode.id)}
            className="bd-menu-button"
            style={{ ...menuButtonStyle, ...selectedMenuStyle(selectedIndex === index, { width: "560px", minHeight: "74px" }) }}
          >
            <div style={{ fontSize: "24px" }}>{mode.title}</div>
            <div style={{ marginTop: "5px", fontFamily: BODY_FONT, fontSize: "12px", letterSpacing: "1px", color: "rgba(232,242,255,0.72)", lineHeight: 1.35, fontWeight: 800 }}>{mode.desc}</div>
          </button>
        ))}
        <button onClick={onBack} className="bd-menu-button" style={{ ...menuButtonStyle, width: "280px", marginTop: "12px" }}>BACK</button>
      </div>
    </KHBackdrop>
  );
}


function DifficultySelect({ settings, onBack, onPick }) {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const difficulties = [
    { id: "easy", title: "BEGINNER", desc: "Learning pace. More room to breathe." },
    { id: "medium", title: "STANDARD", desc: "Balanced pressure for testing combos." },
    { id: "hard", title: "PROUD", desc: "Faster reactions and tighter spacing." },
    { id: "extreme", title: "CRITICAL", desc: "Aggressive AI. Less forgiveness." },
  ];

  useMenuNavigation({
    itemCount: difficulties.length,
    selectedIndex,
    setSelectedIndex,
    onPick: index => onPick(difficulties[index]?.id),
    onBack,
  });

  return (
    <KHBackdrop title="SET DIFFICULTY" subtitle={`${settings?.aiMode === "story" ? "RUN THE GUANTLENT" : settings?.aiMode === "choose" ? "CHOOSE OPPONENT" : "MIRROR MATCH"}`}>
      <div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", zIndex: 3 }}>
        {difficulties.map((item, index) => (
          <button
            key={item.id}
            onMouseEnter={() => setSelectedIndex(index)}
            onFocus={() => setSelectedIndex(index)}
            onClick={() => onPick(item.id)}
            className="bd-menu-button"
            style={{
              ...menuButtonStyle,
              ...selectedMenuStyle(selectedIndex === index, { width: "540px", minHeight: "70px", borderLeftColor: item.id === "extreme" ? "rgba(255,38,35,0.96)" : "rgba(45,125,255,0.96)" }),
            }}
          >
            <div style={{ fontSize: "24px" }}>{item.title}</div>
            <div style={{ marginTop: "5px", fontFamily: BODY_FONT, fontSize: "12px", letterSpacing: "1px", color: "rgba(232,242,255,0.72)", lineHeight: 1.35, fontWeight: 800 }}>{item.desc}</div>
          </button>
        ))}
        <button onClick={onBack} className="bd-menu-button" style={{ ...menuButtonStyle, width: "280px", marginTop: "12px" }}>BACK</button>
      </div>
    </KHBackdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────────────────────────────────────
function StageSelect({ settings, onBack, onPick }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedStage = STAGE_OPTIONS[selectedIndex] ?? STAGE_OPTIONS[0];
  const stageColumns = Math.min(3, STAGE_OPTIONS.length);

  useEffect(() => {
    preloadFightAssets({ ...(settings ?? {}), stageId: selectedStage.id }, "core");
  }, [settings?.p1Character, settings?.p2Character, selectedStage.id]);

  useMenuNavigation({
    itemCount: STAGE_OPTIONS.length,
    columns: stageColumns,
    selectedIndex,
    setSelectedIndex,
    onPick: index => onPick(STAGE_OPTIONS[index]?.id ?? "default"),
    onBack,
  });

  return (
    <KHBackdrop title="STAGE SELECT" subtitle="PICK YOUR BLOCK">
      <style>{`
        .bd-stage-grid::-webkit-scrollbar { width: 8px; }
        .bd-stage-grid::-webkit-scrollbar-track { background: rgba(0,0,0,.34); border-radius: 999px; }
        .bd-stage-grid::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #2d7dff, #ff2623); border-radius: 999px; }
        .bd-stage-tile { transition: transform 150ms ease, filter 150ms ease, box-shadow 150ms ease; }
        .bd-stage-tile:hover { transform: translateY(-6px) scale(1.025); filter: brightness(1.12); }
      `}</style>
      <div style={{ position: "absolute", left: "6vw", right: "6vw", top: "22vh", bottom: "8vh", zIndex: 3, display: "grid", gridTemplateColumns: "minmax(390px, 1fr) minmax(250px, 310px)", gap: "24px", alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div className="bd-stage-grid" style={{ maxHeight: "min(60vh, 460px)", overflowY: "auto", padding: "14px", borderRadius: "8px", border: "1px solid rgba(192,226,255,0.34)", background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 30px), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 30px), linear-gradient(135deg, rgba(0,24,76,0.64), rgba(0,0,0,0.52) 48%, rgba(80,0,10,0.64))", boxShadow: "0 0 34px rgba(45,125,255,0.22), 0 0 30px rgba(255,38,35,0.18), inset 0 0 22px rgba(255,255,255,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 168px))", justifyContent: "center", gap: "14px" }}>
          {STAGE_OPTIONS.map((stage, index) => (
            <button
              key={stage.id}
              onMouseEnter={() => setSelectedIndex(index)}
              onFocus={() => setSelectedIndex(index)}
              onClick={() => onPick(stage.id)}
                  className="bd-stage-tile"
                  style={{
                    position: "relative",
                    aspectRatio: "1 / 1",
                    width: "100%",
                    minHeight: 0,
                    padding: 0,
                    overflow: "hidden",
                    cursor: "pointer",
                    borderRadius: "8px",
                    border: selectedIndex === index ? "2px solid rgba(255,255,255,0.96)" : "1px solid rgba(192,226,255,0.34)",
                    background: "#05080d",
                    boxShadow: selectedIndex === index
                      ? "0 0 30px rgba(255,255,255,0.38), 0 0 28px rgba(45,125,255,0.48), 0 0 28px rgba(255,38,35,0.42), inset 0 0 18px rgba(255,255,255,0.14)"
                      : "0 12px 24px rgba(0,0,0,0.44), 0 0 14px rgba(45,125,255,0.18)",
                    color: "#f8fbff",
                    fontFamily: MENU_FONT,
                    textAlign: "left",
                  }}
            >
                  <StagePreview stage={stage} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.20) 42%, rgba(0,0,0,0.82))", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", inset: "8px", borderRadius: "5px", border: selectedIndex === index ? "1px solid rgba(255,255,255,0.82)" : "1px solid rgba(255,255,255,0.30)", pointerEvents: "none", boxShadow: selectedIndex === index ? "inset 0 0 18px rgba(255,255,255,0.20)" : "inset 0 0 12px rgba(45,125,255,0.12)" }} />
                  <div style={{ position: "absolute", left: "10px", top: "9px", padding: "2px 6px", borderRadius: "3px", background: selectedIndex === index ? "linear-gradient(90deg, #ffffff, #9fd0ff)" : "rgba(0,0,0,0.62)", border: "1px solid rgba(255,255,255,0.36)", color: selectedIndex === index ? "#05060c" : "#f8fbff", fontSize: "10px", letterSpacing: ".8px", textShadow: selectedIndex === index ? "none" : "1px 1px 0 #000" }}>{String(index + 1).padStart(2, "0")}</div>
                  <div style={{ position: "absolute", left: "10px", right: "10px", bottom: "10px", textShadow: "2px 2px 0 #000" }}>
                    <div style={{ fontSize: "clamp(12px, 1.12vw, 16px)", letterSpacing: "1px", lineHeight: 1.02 }}>{stage.name.toUpperCase()}</div>
                    <div style={{ marginTop: "4px", fontFamily: BODY_FONT, fontSize: "10px", letterSpacing: ".8px", color: "rgba(232,242,255,0.74)", fontWeight: 900, lineHeight: 1.15 }}>{stage.tag.toUpperCase()}</div>
                  </div>
            </button>
          ))}
            </div>
          </div>
          <button onClick={onBack} className="bd-menu-button" style={{ ...menuButtonStyle, width: "220px", marginTop: "14px" }}>BACK</button>
        </div>

        <div style={{ alignSelf: "center", border: "1px solid rgba(192,226,255,0.34)", borderRadius: "8px", padding: "12px", background: "linear-gradient(135deg, rgba(0,24,76,0.70), rgba(7,7,8,0.90) 48%, rgba(80,0,10,0.70))", boxShadow: "0 0 34px rgba(45,125,255,0.22), 0 0 30px rgba(255,38,35,0.18), inset 0 0 22px rgba(255,255,255,0.07)", color: "#f8fbff" }}>
          <div style={{ position: "relative", aspectRatio: "1 / 1", width: "100%", borderRadius: "7px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.28)", background: "#05080d" }}>
            <StagePreview stage={selectedStage} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.78))" }} />
            <div style={{ position: "absolute", left: "12px", right: "12px", bottom: "12px", textShadow: "2px 2px 0 #000" }}>
              <div style={{ fontFamily: MENU_FONT, fontSize: "clamp(20px, 2.2vw, 28px)", letterSpacing: "1.5px", lineHeight: 1 }}>{selectedStage.name.toUpperCase()}</div>
              <div style={{ marginTop: "5px", fontFamily: BODY_FONT, fontSize: "11px", letterSpacing: ".8px", color: "#bfdcff", fontWeight: 900 }}>{selectedStage.tag.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ marginTop: "12px", color: "rgba(232,242,255,0.76)", lineHeight: 1.42, fontFamily: BODY_FONT, fontWeight: 800, fontSize: "13px", textShadow: "1px 1px 0 #000" }}>
            {selectedStage.desc}
          </div>
        </div>
      </div>
    </KHBackdrop>
  );
}

function StagePreview({ stage }) {
  if (stage?.id === "redbulldys") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 56%, rgba(255,244,214,0.18), transparent 27%), linear-gradient(145deg, #06070b 0%, #121d39 38%, #3d0710 67%, #070608 100%)" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.26, background: "repeating-linear-gradient(102deg, transparent 0 24px, rgba(255,255,255,0.16) 25px 26px, transparent 27px 52px)" }} />
        <div style={{ position: "absolute", left: "50%", top: "54%", width: "54%", height: "44%", transform: "translate(-50%, -50%) perspective(420px) rotateX(58deg)", borderRadius: "50%", border: "4px solid rgba(255,244,214,0.72)", boxShadow: "0 0 36px rgba(255,244,214,0.24), inset 0 0 34px rgba(229,14,37,0.20)", background: "radial-gradient(circle, rgba(255,255,255,0.10), rgba(18,29,57,0.72) 48%, rgba(8,8,11,0.95))" }} />
        <div style={{ position: "absolute", left: "50%", top: "53%", width: "22%", height: "18%", transform: "translate(-50%, -50%) perspective(420px) rotateX(58deg)", borderRadius: "50%", background: "linear-gradient(90deg, rgba(11,58,143,0.9), rgba(229,14,37,0.86))", boxShadow: "0 0 28px rgba(255,244,214,0.20)" }} />
        <div style={{ position: "absolute", left: "13%", top: "24%", width: "24%", height: "9%", background: "#0f3a8f", boxShadow: "0 0 24px rgba(50,118,255,0.48)" }} />
        <div style={{ position: "absolute", right: "13%", top: "25%", width: "24%", height: "9%", background: "#e50e25", boxShadow: "0 0 24px rgba(255,44,67,0.46)" }} />
        <div style={{ position: "absolute", left: "50%", bottom: "16%", width: "46%", height: "2px", transform: "translateX(-50%)", background: "linear-gradient(90deg, transparent, rgba(255,244,214,0.9), transparent)" }} />
      </div>
    );
  }

  if (stage?.id === "wafflehouse") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #061329 0%, #132a4b 31%, #5c2b35 46%, #ff8a3a 58%, #14100d 73%, #050505 100%)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "48%", height: "8%", background: "linear-gradient(90deg, transparent, rgba(255,119,66,0.45), rgba(255,221,151,0.74), rgba(255,135,55,0.45), transparent)", filter: "blur(5px)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "41%", height: "12%", background: "radial-gradient(ellipse at 72% 85%, rgba(255,220,137,0.75), rgba(234,91,52,0.22) 42%, transparent 66%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "51%", height: "7%", background: "linear-gradient(180deg, #061108, #0c180b)" }} />
        <div style={{ position: "absolute", inset: "50% 0 0", background: "radial-gradient(ellipse at 68% 14%, rgba(255,137,68,0.22), transparent 38%), radial-gradient(ellipse at 46% 70%, rgba(12,13,14,0.42), transparent 52%), linear-gradient(180deg, #67635c 0%, #454541 43%, #222322 100%)", transform: "perspective(420px) rotateX(58deg)", transformOrigin: "50% 0" }} />
        <div style={{ position: "absolute", left: "12%", right: "12%", top: "22%", height: "24%", background: "linear-gradient(180deg, #4a2a14, #19110a)", boxShadow: "0 0 26px rgba(255,207,107,0.18)" }} />
        <div style={{ position: "absolute", left: "18%", top: "29%", width: "28%", height: "10%", background: "#ffd35a", boxShadow: "0 0 24px rgba(255,207,107,0.70)" }} />
        <div style={{ position: "absolute", right: "20%", top: "29%", width: "18%", height: "10%", background: "#fff4d6", boxShadow: "0 0 24px rgba(255,244,214,0.52)" }} />
        <div style={{ position: "absolute", left: "9%", top: "36%", width: "7%", height: "34%", background: "#07140c" }} />
        <div style={{ position: "absolute", right: "9%", top: "35%", width: "7%", height: "35%", background: "#07140c" }} />
        <div style={{ position: "absolute", left: "13%", top: "23%", width: "1.8%", height: "52%", background: "#26282b", boxShadow: "0 0 12px rgba(255,244,214,0.22)" }} />
        <div style={{ position: "absolute", left: "11%", top: "22%", width: "9%", height: "3.5%", borderRadius: 999, background: "#fff0b8", boxShadow: "0 0 28px rgba(255,240,184,0.75)" }} />
      </div>
    );
  }

  if (stage?.id === "skatebowl") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #111723 0%, #1c2232 42%, #35383d 62%, #151719 100%)" }}>
        <div style={{ position: "absolute", left: "-8%", right: "-8%", top: "38%", height: "31%", borderRadius: "0 0 50% 50%", background: "radial-gradient(ellipse at 50% 10%, rgba(240,240,230,0.34), rgba(90,92,96,0.62) 44%, rgba(18,19,22,0.88) 72%)", transform: "perspective(420px) rotateX(54deg)", transformOrigin: "50% 0", boxShadow: "inset 0 -24px 30px rgba(0,0,0,0.38)" }} />
        <div style={{ position: "absolute", left: "3%", right: "3%", top: "30%", height: "20%", background: "linear-gradient(90deg, rgba(255,244,214,0.16), rgba(255,207,107,0.2), rgba(255,244,214,0.12))", boxShadow: "0 0 18px rgba(255,244,214,0.12)" }} />
        <div style={{ position: "absolute", left: "8%", right: "8%", top: "30%", height: "9%", background: "repeating-linear-gradient(90deg, #181818 0 7px, #4f4234 7px 12px, #17202b 12px 18px)", opacity: 0.75 }} />
        <div style={{ position: "absolute", left: "50%", top: "62%", width: "40%", height: "5px", transform: "translateX(-50%)", background: "linear-gradient(90deg, transparent, #fff4d6, #ffcf6b, transparent)" }} />
      </div>
    );
  }

  if (stage?.id === "ncGraffiti") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #09080c 0%, #15151c 54%, #242327 100%)" }}>
        <div style={{ position: "absolute", left: "8%", right: "8%", top: "21%", height: "34%", background: "linear-gradient(135deg, rgba(255,79,154,0.46), rgba(255,207,107,0.32) 34%, rgba(80,223,255,0.36) 66%, rgba(255,244,214,0.24))", boxShadow: "0 0 24px rgba(255,244,214,0.14)" }} />
        <div style={{ position: "absolute", left: "12%", right: "12%", top: "30%", height: "11%", background: "repeating-linear-gradient(112deg, transparent 0 18px, rgba(0,0,0,0.28) 18px 23px, transparent 23px 40px)" }} />
        <div style={{ position: "absolute", left: "8%", right: "8%", top: "50%", height: "10%", background: "repeating-linear-gradient(90deg, #241a16 0 9px, #48372c 9px 14px, #171b20 14px 21px)", opacity: 0.78 }} />
        <div style={{ position: "absolute", inset: "56% 0 0", background: "linear-gradient(180deg, #2d3034, #101114)", transform: "perspective(420px) rotateX(58deg)", transformOrigin: "50% 0" }} />
      </div>
    );
  }

  if (stage?.id === "daBull") {
    return (
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #130d08 0%, #26140b 44%, #2e2925 65%, #080706 100%)" }}>
        <div style={{ position: "absolute", left: "33%", top: "14%", width: "34%", height: "46%", borderRadius: "52% 52% 45% 45%", background: "radial-gradient(circle at 50% 38%, rgba(255,207,107,0.52), rgba(101,52,20,0.68) 46%, rgba(26,13,8,0.96) 72%)", boxShadow: "0 0 42px rgba(255,150,51,0.28)" }} />
        <div style={{ position: "absolute", left: "14%", right: "14%", top: "49%", height: "10%", background: "repeating-linear-gradient(90deg, #1c1511 0 8px, #4a362a 8px 13px, #231b17 13px 20px)", opacity: 0.82 }} />
        <div style={{ position: "absolute", inset: "58% 0 0", background: "radial-gradient(ellipse at 50% 8%, rgba(255,207,107,0.12), transparent 36%), linear-gradient(180deg, #3b342e, #12100e)", transform: "perspective(420px) rotateX(58deg)", transformOrigin: "50% 0" }} />
        <div style={{ position: "absolute", left: "50%", top: "52%", width: "42%", height: "4px", transform: "translateX(-50%)", background: "linear-gradient(90deg, transparent, #ffcf6b, #fff4d6, transparent)" }} />
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #15120a 0%, #080807 54%, #020202 100%)" }}>
      <div style={{ position: "absolute", inset: "46% 0 0", background: "repeating-linear-gradient(90deg, rgba(255,244,214,0.26) 0 1px, transparent 1px 42px), repeating-linear-gradient(0deg, rgba(255,210,92,0.18) 0 1px, transparent 1px 42px)", transform: "perspective(420px) rotateX(58deg)", transformOrigin: "50% 0" }} />
      <div style={{ position: "absolute", left: "10%", top: "26%", width: "26%", height: "14%", background: "#ffcf6b", boxShadow: "0 0 18px rgba(255,210,92,0.45)" }} />
      <div style={{ position: "absolute", right: "10%", top: "28%", width: "28%", height: "14%", background: "#fff4d6", boxShadow: "0 0 18px rgba(255,244,214,0.35)" }} />
      <div style={{ position: "absolute", left: "50%", top: "50%", width: "36%", height: "4px", transform: "translateX(-50%)", background: "linear-gradient(90deg, transparent, #ffcf6b, #fff4d6, transparent)" }} />
    </div>
  );
}

function getViewportInfo() {
  if (typeof window === "undefined") {
    return { width: 1280, height: 720, isTouch: false, isLandscape: true, isPhoneLike: false };
  }

  const width = Math.round(window.visualViewport?.width ?? window.innerWidth ?? 1280);
  const height = Math.round(window.visualViewport?.height ?? window.innerHeight ?? 720);
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const maxTouchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints ?? 0;
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent ?? "";
  const mobileUserAgent = /android|iphone|ipad|ipod|mobile|windows phone/i.test(userAgent);
  const cssMobileWidth = window.matchMedia?.("(max-width: 900px)")?.matches ?? false;
  const isTouch = coarsePointer || maxTouchPoints > 0 || mobileUserAgent;
  return {
    width,
    height,
    isTouch,
    isLandscape: width > height,
    isPhoneLike: (isTouch || mobileUserAgent) && (Math.min(width, height) <= 760 || cssMobileWidth),
  };
}

function useViewportInfo() {
  const [viewport, setViewport] = useState(getViewportInfo);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const update = () => setViewport(getViewportInfo());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return viewport;
}

function stopMobileInputEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

function MobileHoldButton({ label, control, onHold, disabled = false, className = "" }) {
  const press = (event) => {
    stopMobileInputEvent(event);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    if (!disabled) onHold(control, true);
  };
  const release = (event) => {
    stopMobileInputEvent(event);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    onHold(control, false);
  };

  return (
    <button
      type="button"
      className={`bd-mobile-btn bd-mobile-hold ${className}`}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onContextMenu={stopMobileInputEvent}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function MobileTapButton({ label, action, onTap, disabled = false, className = "" }) {
  const press = (event) => {
    stopMobileInputEvent(event);
    if (!disabled) onTap(action);
  };

  return (
    <button
      type="button"
      className={`bd-mobile-btn bd-mobile-tap ${className}`}
      onPointerDown={press}
      onContextMenu={stopMobileInputEvent}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function MobileFightControls({ onHold, onAttack, onTaunt, onPause, disabled = false }) {
  const actionButtons = [
    { label: "LP", action: "lightPunch" },
    { label: "HP", action: "heavyPunch" },
    { label: "R", action: "heavyPunch2" },
    { label: "LK", action: "lightKick" },
    { label: "HK", action: "heavyKick" },
  ];

  return (
    <div className="bd-mobile-controller" aria-label="Mobile fight controls">
      <div className="bd-mobile-pad">
        <MobileHoldButton label="UP" control="jump" onHold={onHold} disabled={disabled} className="bd-mobile-pad-up" />
        <MobileHoldButton label="LEFT" control="left" onHold={onHold} disabled={disabled} className="bd-mobile-pad-left" />
        <MobileHoldButton label="RIGHT" control="right" onHold={onHold} disabled={disabled} className="bd-mobile-pad-right" />
        <MobileHoldButton label="DOWN" control="crouch" onHold={onHold} disabled={disabled} className="bd-mobile-pad-down" />
      </div>

      <div className="bd-mobile-system">
        <MobileHoldButton label="GUARD" control="block" onHold={onHold} disabled={disabled} className="bd-mobile-btn-wide" />
        <MobileTapButton label="PAUSE" onTap={onPause} disabled={false} className="bd-mobile-btn-pause" />
      </div>

      <div className="bd-mobile-actions">
        {actionButtons.map(button => (
          <MobileTapButton key={button.action} label={button.label} action={button.action} onTap={onAttack} disabled={disabled} />
        ))}
        <MobileTapButton label="TAUNT" onTap={onTaunt} disabled={disabled} className="bd-mobile-btn-taunt" />
      </div>
    </div>
  );
}

function MobileFramedScreen({ viewport, children }) {
  const outerPadding = viewport.isLandscape ? 8 : 10;
  const controllerReserve = viewport.isLandscape ? 132 : 304;
  const availableWidth = Math.max(280, viewport.width - outerPadding * 2);
  const maxMediaHeight = Math.max(140, viewport.height - controllerReserve - outerPadding * 2);
  const mediaHeight = Math.floor(Math.min(availableWidth * 9 / 16, maxMediaHeight));
  const mediaWidth = Math.floor(Math.min(availableWidth, mediaHeight * 16 / 9));
  const scale = mediaWidth / 1280;
  const handleMenuHold = (control, pressed) => {
    if (!pressed) return;
    const input = {
      jump: "up",
      crouch: "down",
      left: "left",
      right: "right",
      block: "back",
    }[control];
    if (input) dispatchMobileMenuInput(input);
  };
  const handleMenuTap = () => dispatchMobileMenuInput("confirm");
  const handleMenuBack = () => dispatchMobileMenuInput("back");

  return (
    <div
      className="bd-game-shell-mobile"
      style={{
        width: "100vw",
        minHeight: "100vh",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: viewport.isLandscape ? 6 : 12,
        padding: outerPadding,
        background: "linear-gradient(135deg, #050814 0%, #08040a 52%, #130005 100%)",
        overflow: "hidden",
      }}
    >
      <div
        className="bd-game-shell"
        style={{
          width: mediaWidth,
          height: mediaHeight,
          position: "relative",
          overflow: "hidden",
          borderRadius: "8px",
          background: "#020409",
          border: "1px solid rgba(192,226,255,.34)",
        }}
      >
        <div
          style={{
            width: 1280,
            height: 720,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
      <MobileFightControls
        onHold={handleMenuHold}
        onAttack={handleMenuTap}
        onTaunt={handleMenuTap}
        onPause={handleMenuBack}
      />
    </div>
  );
}

class CanvasSceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error) {
    console.warn("[fight-scene] falling back after render/load error", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [matchSettings, setMatchSettings] = useState({
    mode: null,
    difficulty: "medium",
    aiMode: "mirror",
    p1Character: "skitz",
    p2Character: "skitz",
    stageId: "default",
    storyIndex: 0,
  });
  const [pendingSettings, setPendingSettings] = useState(null);
  const [controls, setControls] = useState(DEFAULT_CONTROLS);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioRef = useRef(null);
  const viewport = useViewportInfo();
  const isMobileFightLayout = screen === "fight" && viewport.isPhoneLike;
  const isMobileMenuLayout = screen !== "fight" && viewport.isPhoneLike;
  const frameMobileMenu = (content) => isMobileMenuLayout
    ? <MobileFramedScreen viewport={viewport}>{content}</MobileFramedScreen>
    : content;

  const [game, setGame] = useState({
    p1: makeFighter(-2.8, "Skitz", "skitz"),
    p2: makeFighter(3.35, "AI SKITZ", "skitz"),
    roundOver: false,
    matchOver: false,
    roundWinner: null,
    matchWinner: null,
    roundFinishReason: null,
    wins: { p1: 0, p2: 0 },
    roundNumber: 1,
    timer: 99,
  });
  const [visualEffects, setVisualEffects] = useState([]);
  const [combatPopups, setCombatPopups] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [comboHud, setComboHud] = useState({ p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } });
  const [roundStats, setRoundStats] = useState(makeEmptyRoundStats);
  const [shakeEvent, setShakeEvent] = useState({ id: 0, power: 0, critical: false });
  const [redFlashNonce, setRedFlashNonce] = useState(0);
  const [hitStopEvent, setHitStopEvent] = useState({ id: 0, critical: false });
  const [roundFlow, setRoundFlow] = useState({ phase: "idle", count: null, nonce: 0 });
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);

  const keys = useRef({});
  const pauseMenuOpenRef = useRef(false);
  const actionLocked = useRef({ p1: false, p2: false });
  const lockExpiresAt = useRef({ p1: 0, p2: 0 });
  const comboState = useRef({ p1: null, p2: null });
  const aiBrain = useRef({ lastDecision: 0, nextAttack: 0 });
  const effectId = useRef(1);
  const comboTimers = useRef({ p1: null, p2: null });
  const comboTracker = useRef({ p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } });
  const hitReactionTimers = useRef({ p1: null, p2: null });
  const visualLockTimers = useRef({ p1: null, p2: null });
  // True stun means the fighter cannot block or spend stamina to guard.
  // Heavy stun should leave them vulnerable until the stun animation/recovery ends.
  const stunLocked = useRef({ p1: false, p2: false });
  // Knockdown invulnerability: true from flying-back startup through the full get-up animation.
  // While true, no hitbox can connect, so ground hits/OTGs cannot happen.
  const knockdownInvulnerable = useRef({ p1: false, p2: false });
  const stunUnlockTimers = useRef({ p1: null, p2: null });
  const attackUnlockTimers = useRef({ p1: null, p2: null });
  const queuedAttack = useRef({ p1: null, p2: null });
  const activeAttackToken = useRef({ p1: 0, p2: 0 });
  const knockdownTimers = useRef({ p1: null, p2: null });
  const knockdownLandTimers = useRef({ p1: null, p2: null });
  const systemAlertCooldowns = useRef({});
  const crouchHeldSince = useRef({ p1: 0, p2: 0 });
  // Jose S+C heavy-kick chain is tracked separately from normal punch/kick combos.
  // This prevents regular light-kick combo logic from forcing heavyKick1 to repeat.
  const joseHeavyKickChain = useRef({
    p1: { move: null, landed: false, expiry: 0 },
    p2: { move: null, landed: false, expiry: 0 },
  });
  const inputSpam = useRef({
    p1: { presses: [], penaltyUntil: 0, lastCategory: null, lastPressAt: 0 },
    p2: { presses: [], penaltyUntil: 0, lastCategory: null, lastPressAt: 0 },
  });
  const roundFlowTimers = useRef([]);
  const poisonStacks = useRef({ p1: 0, p2: 0 });
  const poisonTimers = useRef({ p1: null, p2: null });
  const firstHitLanded = useRef(false);
  const movementTaps = useRef({
    p1: { left: 0, right: 0 },
    p2: { left: 0, right: 0 },
  });
  const dashCooldowns = useRef({ p1: 0, p2: 0 });
  const guardPressedAt = useRef({ p1: 0, p2: 0 });
  const comebackAnnounced = useRef({ p1: false, p2: false });
  const attackStartedAt = useRef({ p1: 0, p2: 0 });
  const clashCooldowns = useRef({ p1: 0, p2: 0 });
  const tauntCooldowns = useRef({ p1: 0, p2: 0 });
  const tauntingUntil = useRef({ p1: 0, p2: 0 });
  const finishPressureAnnounced = useRef({ p1: false, p2: false });
  const wallBounceCooldowns = useRef({ p1: 0, p2: 0 });
  const roundStartToken = useRef(0);

  useEffect(() => {
    pauseMenuOpenRef.current = pauseMenuOpen;
  }, [pauseMenuOpen]);

  useEffect(() => {
    if (!isMobileFightLayout) return undefined;
    return () => {
      const p1Controls = controls.p1 ?? DEFAULT_CONTROLS.p1;
      [
        MOVEMENT_CONTROLS.p1.left,
        MOVEMENT_CONTROLS.p1.right,
        MOVEMENT_CONTROLS.p1.jump,
        p1Controls.crouch ?? DEFAULT_CONTROLS.p1.crouch,
        p1Controls.block ?? DEFAULT_CONTROLS.p1.block,
      ].forEach(key => {
        keys.current[key] = false;
      });
      crouchHeldSince.current.p1 = 0;
      joseHeavyKickChain.current.p1 = { move: null, landed: false, expiry: 0 };
    };
  }, [isMobileFightLayout, controls]);

  function clearRoundFlowTimers() {
    roundFlowTimers.current.forEach(timer => clearTimeout(timer));
    roundFlowTimers.current = [];
  }

  function clearPoisonTimers() {
    Object.values(poisonTimers.current).forEach(timer => timer && clearInterval(timer));
    poisonTimers.current = { p1: null, p2: null };
    poisonStacks.current = { p1: 0, p2: 0 };
  }

  function beginRoundFlow({ loadingMs = ROUND_LOADING_MIN_MS } = {}) {
    clearRoundFlowTimers();
    setRoundFlow(prev => ({ phase: "loading", count: null, nonce: prev.nonce + 1 }));

    for (let step = 0; step < ROUND_COUNTDOWN_FROM; step++) {
      const count = ROUND_COUNTDOWN_FROM - step;
      roundFlowTimers.current.push(setTimeout(() => {
        setRoundFlow(prev => ({ ...prev, phase: "countdown", count }));
      }, loadingMs + step * 1000));
    }

    roundFlowTimers.current.push(setTimeout(() => {
      setRoundFlow(prev => ({ ...prev, phase: "live", count: null }));
    }, loadingMs + ROUND_COUNTDOWN_FROM * 1000));
  }

  function beginRoundWhenReady(settings) {
    const waitForMobileAssets = getViewportInfo().isPhoneLike;
    if (!waitForMobileAssets) {
      preloadFightAssets(settings, "all");
      beginRoundFlow();
      return;
    }

    const token = roundStartToken.current + 1;
    roundStartToken.current = token;
    clearRoundFlowTimers();
    setRoundFlow(prev => ({ phase: "loading", count: null, nonce: prev.nonce + 1 }));

    const preloadPromise = preloadFightAssets(settings, "all") ?? Promise.resolve();
    const timeoutPromise = new Promise(resolve => window.setTimeout(resolve, MOBILE_ASSET_WAIT_MS));
    Promise.race([preloadPromise, timeoutPromise]).finally(() => {
      if (roundStartToken.current !== token) return;
      beginRoundFlow({ loadingMs: 900 });
    });
  }

  useEffect(() => () => clearRoundFlowTimers(), []);

  function spawnSystemAlert(playerKey, type, text) {
    const now = Date.now();
    const key = `${playerKey}-${type}`;
    if ((systemAlertCooldowns.current[key] || 0) > now) return;
    systemAlertCooldowns.current[key] = now + SYSTEM_ALERT_COOLDOWN_MS;
    const id = effectId.current++;
    setSystemAlerts(list => [
      ...list.slice(-4),
      { id, playerKey, type, text, createdAt: now },
    ]);
    setTimeout(() => {
      setSystemAlerts(list => list.filter(alert => alert.id !== id));
    }, SYSTEM_ALERT_LIFETIME_MS);
  }

  function updateRoundStat(playerKey, updater) {
    setRoundStats(prev => {
      const current = prev[playerKey] ?? makePlayerRoundStats();
      return {
        ...prev,
        [playerKey]: updater(current),
      };
    });
  }

  function spawnFloatingPopup({ playerKey = "p1", text, top = "30%", comboGrade = false, ko = false }) {
    const id = effectId.current++;
    setCombatPopups(list => [
      ...list,
      {
        id,
        text,
        left: ko ? "50%" : playerKey === "p1" ? "38%" : "62%",
        top,
        side: playerKey === "p1" ? "left" : "right",
        blocked: false,
        comboGrade,
        ko,
      },
    ]);
    setTimeout(() => {
      setCombatPopups(list => list.filter(popup => popup.id !== id));
    }, ko ? 1250 : FLOAT_TEXT_LIFETIME_MS);
  }

  function getComboGrade(combo) {
    const hits = combo?.hits ?? 0;
    const damage = combo?.damage ?? 0;
    if (hits >= 7 || damage >= 42) return "BLOCK PARTY";
    if (hits >= 5 || damage >= 30) return "DIRTY WORK";
    if (hits >= 3 || damage >= 18) return "SAUCY COMBO";
    if (hits >= 2) return "NICE COMBO";
    return null;
  }

  function spawnComboGrade(playerKey, combo) {
    const grade = getComboGrade(combo);
    if (!grade) return;
    spawnFloatingPopup({
      playerKey,
      text: grade,
      top: combo.hits >= 5 ? "20%" : "24%",
      comboGrade: true,
    });
    if ((combo.hits ?? 0) >= 4) {
      spawnSystemAlert(playerKey, "combo-grade", grade);
    }
  }

  function performDash(playerKey, dir) {
    const now = Date.now();
    if (now < (dashCooldowns.current[playerKey] || 0)) return;
    if (screen !== "fight" || roundFlow.phase !== "live" || pauseMenuOpenRef.current) return;

    const opponentKey = playerKey === "p1" ? "p2" : "p1";
    let dashed = false;
    setGame(current => {
      const fighter = current[playerKey];
      const opponent = current[opponentKey];
      if (!fighter || !opponent || current.roundOver || current.matchOver) return current;
      if (fighter.hp <= 0 || !fighter.grounded || actionLocked.current[playerKey] || stunLocked.current[playerKey] || knockdownInvulnerable.current[playerKey]) return current;
      if ((fighter.stamina ?? 0) < DASH_STAMINA_COST) {
        spawnSystemAlert(playerKey, "dash-stamina", "NO DASH");
        return current;
      }

      const facingRight = fighter.x < opponent.x;
      const next = {
        ...fighter,
        stamina: Math.max(0, (fighter.stamina ?? 0) - DASH_STAMINA_COST),
        vx: THREE.MathUtils.clamp((fighter.vx || 0) + dir * DASH_VELOCITY, -AIR_MAX_SPEED * 1.45, AIR_MAX_SPEED * 1.45),
        lastAction: dir * (facingRight ? 1 : -1) > 0 ? "walk" : "back",
        actionNonce: (fighter.actionNonce ?? 0) + 1,
      };

      dashed = true;
      return { ...current, [playerKey]: next };
    });

    if (dashed) {
      dashCooldowns.current[playerKey] = now + DASH_COOLDOWN_MS;
      spawnSystemAlert(playerKey, "dash", "QUICK STEP");
    }
  }

  function handleDashTap(playerKey, key) {
    const movement = MOVEMENT_CONTROLS[playerKey];
    const direction = key === movement.left ? -1 : key === movement.right ? 1 : 0;
    if (!direction) return;

    const side = direction < 0 ? "left" : "right";
    const now = Date.now();
    const lastTap = movementTaps.current[playerKey]?.[side] ?? 0;
    movementTaps.current[playerKey][side] = now;
    if (now - lastTap <= DASH_TAP_WINDOW_MS) {
      performDash(playerKey, direction);
      movementTaps.current[playerKey][side] = 0;
    }
  }

  function performTaunt(playerKey) {
    const now = Date.now();
    if (screen !== "fight" || roundFlow.phase !== "live" || pauseMenuOpenRef.current) return;
    if (now < (tauntCooldowns.current[playerKey] || 0)) {
      spawnSystemAlert(playerKey, "taunt-cooldown", "TAUNT WAIT");
      return;
    }

    const opponentKey = playerKey === "p1" ? "p2" : "p1";
    let didTaunt = false;
    setGame(current => {
      const fighter = current[playerKey];
      const opponent = current[opponentKey];
      if (!fighter || !opponent || current.roundOver || current.matchOver) return current;
      if (fighter.hp <= 0 || !fighter.grounded || actionLocked.current[playerKey] || stunLocked.current[playerKey] || knockdownInvulnerable.current[playerKey]) return current;

      const dist = Math.abs(fighter.x - opponent.x);
      if (dist < TAUNT_MIN_DISTANCE) {
        tauntCooldowns.current[playerKey] = now + 900;
        spawnSystemAlert(playerKey, "taunt-close", "TOO CLOSE");
        return current;
      }

      actionLocked.current[playerKey] = true;
      lockExpiresAt.current[playerKey] = now + TAUNT_LOCK_MS;
      tauntingUntil.current[playerKey] = now + TAUNT_LOCK_MS;
      tauntCooldowns.current[playerKey] = now + TAUNT_COOLDOWN_MS;
      scheduleAttackUnlock(playerKey, TAUNT_LOCK_MS);
      updateRoundStat(playerKey, stats => ({ ...stats, taunts: (stats.taunts ?? 0) + 1 }));
      didTaunt = true;

      return {
        ...current,
        [playerKey]: {
          ...fighter,
          hp: isComebackActive(fighter) ? Math.min(fighter.maxHp ?? 100, (fighter.hp ?? 0) + TAUNT_COMEBACK_HEAL) : fighter.hp,
          stamina: Math.min(fighter.maxStamina ?? 100, (fighter.stamina ?? 0) + TAUNT_STAMINA_GAIN),
          vx: 0,
          blocking: false,
          crouching: false,
          lastAction: "idle",
          actionNonce: (fighter.actionNonce ?? 0) + 1,
        },
      };
    });

    if (didTaunt) {
      spawnSystemAlert(playerKey, "taunt", "CROWD HYPE");
      spawnFloatingPopup({ playerKey, text: "TAUNT", top: "54%", comboGrade: true });
    }
  }

  useEffect(() => {
    if (screen !== "fight" || roundFlow.phase !== "live" || game.roundOver) return;

    ["p1", "p2"].forEach(playerKey => {
      if (comebackAnnounced.current[playerKey] || !isComebackActive(game[playerKey])) return;
      comebackAnnounced.current[playerKey] = true;
      spawnSystemAlert(playerKey, "comeback", "HYPE MODE");
    });
  }, [screen, roundFlow.phase, game.roundOver, game.p1.hp, game.p2.hp]);

  useEffect(() => {
    if (screen !== "fight" || roundFlow.phase !== "live" || game.roundOver) return;

    ["p1", "p2"].forEach(defenderKey => {
      const defender = game[defenderKey];
      if (!defender || defender.hp <= 0 || finishPressureAnnounced.current[defenderKey]) return;
      const hpPct = ((defender.hp / Math.max(1, defender.maxHp ?? 100)) * 100);
      if (hpPct > FINISH_HEALTH_THRESHOLD) return;

      const attackerKey = defenderKey === "p1" ? "p2" : "p1";
      finishPressureAnnounced.current[defenderKey] = true;
      spawnSystemAlert(defenderKey, "one-touch", "ONE TOUCH");
      spawnSystemAlert(attackerKey, "finish-round", "FINISH THE ROUND");
    });
  }, [screen, roundFlow.phase, game.roundOver, game.p1.hp, game.p2.hp]);

  function spawnCombatFeedback({ attackerKey, defenderKey, defenderX, damage, blocked, critical = false, textOverride = null, noCombo = false, shakeBoost = 1, effectType = null }) {
    const id = effectId.current++;
    const screenSide = defenderKey === "p1" ? "left" : "right";
    const popupLeft = defenderKey === "p1" ? "34%" : "66%";
    const stagePlacement = getStageFighterPlacement(matchSettings.stageId);
    const stageScale = stagePlacement.scale ?? 1;

    const shakePower = (blocked ? 0.051 : critical ? 0.204 : 0.136) * shakeBoost;
    setShakeEvent(prev => ({ id: prev.id + 1, power: shakePower, critical }));
    if (critical) setRedFlashNonce(n => n + 1);
    if (!blocked) setHitStopEvent(prev => ({ id: prev.id + 1, critical }));

    setVisualEffects(list => [
      ...list,
      {
        id,
        type: effectType ?? (blocked ? "blockSpark" : critical ? "criticalBlood" : "blood"),
        x: defenderX,
        y: stagePlacement.y + 0.85 * stageScale,
        z: stagePlacement.z,
        dir: defenderKey === "p1" ? -1 : 1,
        sizeScale: Math.max(0.55, Math.min(1, stageScale)),
        createdAt: performance.now(),
      },
    ]);

    const talkChance = critical ? CRITICAL_TALK_CHANCE : HIT_TALK_CHANCE;
    const shouldTalk = !blocked && !noCombo && Math.random() < talkChance;
    const talkLines = critical ? CRITICAL_TALK_LINES : HIT_TALK_LINES;
    const talkText = shouldTalk ? talkLines[Math.floor(Math.random() * talkLines.length)] : null;
    const talkPopupId = talkText ? effectId.current++ : null;
    const popupIds = talkPopupId ? [id, talkPopupId] : [id];

    setCombatPopups(list => [
      ...list,
      {
        id,
        text: textOverride ?? (blocked ? `STAMINA -${pct(damage)}` : `-${pct(damage)}`),
        left: popupLeft,
        top: `${34 + Math.random() * 18}%`,
        side: screenSide,
        blocked,
      },
      ...(talkText ? [{
        id: talkPopupId,
        text: talkText,
        left: attackerKey === "p1" ? "38%" : "62%",
        top: `${22 + Math.random() * 18}%`,
        side: attackerKey === "p1" ? "left" : "right",
        blocked: false,
        talk: true,
      }] : []),
    ]);

    if (!noCombo) {
      const current = comboTracker.current[attackerKey] ?? { hits: 0, damage: 0 };
      const nextCombo = {
        hits: current.hits + 1,
        damage: current.damage + damage,
      };
      comboTracker.current[attackerKey] = nextCombo;
      updateRoundStat(attackerKey, stats => ({
        ...stats,
        bestCombo: Math.max(stats.bestCombo ?? 0, nextCombo.hits),
      }));
      setComboHud(prev => ({
        ...prev,
        [attackerKey]: nextCombo,
      }));

      if (comboTimers.current[attackerKey]) clearTimeout(comboTimers.current[attackerKey]);
      comboTimers.current[attackerKey] = setTimeout(() => {
        const finishedCombo = comboTracker.current[attackerKey];
        spawnComboGrade(attackerKey, finishedCombo);
        comboTracker.current[attackerKey] = { hits: 0, damage: 0 };
        setComboHud(prev => ({
          ...prev,
          [attackerKey]: { hits: 0, damage: 0 },
        }));
      }, 1200);
    }

    setTimeout(() => {
      setVisualEffects(list => list.filter(e => e.id !== id));
      setCombatPopups(list => list.filter(e => !popupIds.includes(e.id)));
    }, Math.max(FLOAT_TEXT_LIFETIME_MS, BLOOD_LIFETIME_MS));
  }

  function resetMatch(settings = matchSettings) {
    preloadFightAssets(settings, "all");
    actionLocked.current = { p1: false, p2: false };
    lockExpiresAt.current = { p1: 0, p2: 0 };
    comboState.current = { p1: null, p2: null };
    aiBrain.current = { lastDecision: 0, nextAttack: 0 };
    keys.current = {};
    Object.values(hitReactionTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(visualLockTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(attackUnlockTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(stunUnlockTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(knockdownTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(knockdownLandTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(comboTimers.current).forEach(t => t && clearTimeout(t));
    comboTimers.current = { p1: null, p2: null };
    hitReactionTimers.current = { p1: null, p2: null };
    visualLockTimers.current = { p1: null, p2: null };
    stunLocked.current = { p1: false, p2: false };
    knockdownInvulnerable.current = { p1: false, p2: false };
    stunUnlockTimers.current = { p1: null, p2: null };
    knockdownTimers.current = { p1: null, p2: null };
    knockdownLandTimers.current = { p1: null, p2: null };
    activeAttackToken.current = { p1: 0, p2: 0 };
    attackUnlockTimers.current = { p1: null, p2: null };
    queuedAttack.current = { p1: null, p2: null };
    joseHeavyKickChain.current = { p1: { move: null, landed: false, expiry: 0 }, p2: { move: null, landed: false, expiry: 0 } };
    movementTaps.current = { p1: { left: 0, right: 0 }, p2: { left: 0, right: 0 } };
    dashCooldowns.current = { p1: 0, p2: 0 };
    guardPressedAt.current = { p1: 0, p2: 0 };
    comebackAnnounced.current = { p1: false, p2: false };
    attackStartedAt.current = { p1: 0, p2: 0 };
    clashCooldowns.current = { p1: 0, p2: 0 };
    tauntCooldowns.current = { p1: 0, p2: 0 };
    tauntingUntil.current = { p1: 0, p2: 0 };
    finishPressureAnnounced.current = { p1: false, p2: false };
    wallBounceCooldowns.current = { p1: 0, p2: 0 };
    clearPoisonTimers();
    inputSpam.current = { p1: { presses: [], penaltyUntil: 0, lastCategory: null, lastPressAt: 0 }, p2: { presses: [], penaltyUntil: 0, lastCategory: null, lastPressAt: 0 } };
    setVisualEffects([]);
    setCombatPopups([]);
    setSystemAlerts([]);
    setShakeEvent({ id: 0, power: 0, critical: false });
    setRedFlashNonce(0);
    setHitStopEvent({ id: 0, critical: false });
    comboTracker.current = { p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } };
    setComboHud({ p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } });
    setRoundStats(makeEmptyRoundStats());
    firstHitLanded.current = false;

    const selectedCharacterId = settings.p1Character ?? "skitz";
    const opponentCharacterId = settings.p2Character ?? selectedCharacterId;
    const selectedStats = getCharacterStats(selectedCharacterId);
    const opponentStats = getCharacterStats(opponentCharacterId);
    const spawns = getStageSpawnPositions(settings.stageId);
    setGame({
      p1: makeFighter(spawns.p1, selectedStats.name ?? "Skitz", selectedCharacterId),
      p2: makeFighter(
        spawns.p2,
        settings.mode === "ai" ? `AI ${opponentStats.name?.toUpperCase?.() ?? "SKITZ"} ${settings.difficulty.toUpperCase()}` : `${opponentStats.name ?? "SKITZ"} P2`,
        opponentCharacterId
      ),
      roundOver: false,
      matchOver: false,
      roundWinner: null,
      matchWinner: null,
      roundFinishReason: null,
      wins: { p1: 0, p2: 0 },
      roundNumber: 1,
      timer: 99,
    });
    beginRoundWhenReady(settings);
  }

  function startNextRound() {
    actionLocked.current = { p1: false, p2: false };
    lockExpiresAt.current = { p1: 0, p2: 0 };
    comboState.current = { p1: null, p2: null };
    aiBrain.current = { lastDecision: 0, nextAttack: 0 };
    keys.current = {};
    Object.values(hitReactionTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(visualLockTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(attackUnlockTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(stunUnlockTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(knockdownTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(knockdownLandTimers.current).forEach(t => t && clearTimeout(t));
    Object.values(comboTimers.current).forEach(t => t && clearTimeout(t));
    comboTimers.current = { p1: null, p2: null };
    hitReactionTimers.current = { p1: null, p2: null };
    visualLockTimers.current = { p1: null, p2: null };
    stunLocked.current = { p1: false, p2: false };
    knockdownInvulnerable.current = { p1: false, p2: false };
    stunUnlockTimers.current = { p1: null, p2: null };
    knockdownTimers.current = { p1: null, p2: null };
    knockdownLandTimers.current = { p1: null, p2: null };
    activeAttackToken.current = { p1: 0, p2: 0 };
    attackUnlockTimers.current = { p1: null, p2: null };
    queuedAttack.current = { p1: null, p2: null };
    joseHeavyKickChain.current = { p1: { move: null, landed: false, expiry: 0 }, p2: { move: null, landed: false, expiry: 0 } };
    movementTaps.current = { p1: { left: 0, right: 0 }, p2: { left: 0, right: 0 } };
    dashCooldowns.current = { p1: 0, p2: 0 };
    guardPressedAt.current = { p1: 0, p2: 0 };
    comebackAnnounced.current = { p1: false, p2: false };
    attackStartedAt.current = { p1: 0, p2: 0 };
    clashCooldowns.current = { p1: 0, p2: 0 };
    tauntCooldowns.current = { p1: 0, p2: 0 };
    tauntingUntil.current = { p1: 0, p2: 0 };
    finishPressureAnnounced.current = { p1: false, p2: false };
    wallBounceCooldowns.current = { p1: 0, p2: 0 };
    clearPoisonTimers();
    inputSpam.current = { p1: { presses: [], penaltyUntil: 0, lastCategory: null, lastPressAt: 0 }, p2: { presses: [], penaltyUntil: 0, lastCategory: null, lastPressAt: 0 } };
    setVisualEffects([]);
    setCombatPopups([]);
    setSystemAlerts([]);
    comboTracker.current = { p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } };
    setComboHud({ p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } });
    setRoundStats(makeEmptyRoundStats());
    firstHitLanded.current = false;

    const selectedCharacterId = matchSettings.p1Character ?? "skitz";
    const opponentCharacterId = matchSettings.p2Character ?? selectedCharacterId;
    const selectedStats = getCharacterStats(selectedCharacterId);
    const opponentStats = getCharacterStats(opponentCharacterId);
    const spawns = getStageSpawnPositions(matchSettings.stageId);
    setGame(g => ({
      ...g,
      p1: makeFighter(spawns.p1, selectedStats.name ?? "Skitz", selectedCharacterId),
      p2: makeFighter(
        spawns.p2,
        matchSettings.mode === "ai" ? `AI ${opponentStats.name?.toUpperCase?.() ?? "SKITZ"} ${matchSettings.difficulty.toUpperCase()}` : `${opponentStats.name ?? "SKITZ"} P2`,
        opponentCharacterId
      ),
      roundOver: false,
      matchOver: false,
      roundWinner: null,
      matchWinner: null,
      roundFinishReason: null,
      roundNumber: g.roundNumber + 1,
      timer: 99,
    }));
    beginRoundWhenReady(matchSettings);
  }

  function getStoryOpponentIds(playerId) {
    return CHARACTER_ROSTER.filter(c => c.available && c.id !== playerId).map(c => c.id);
  }

  function getStoryOpponentId(playerId, storyIndex = 0) {
    return getStoryOpponentIds(playerId)[storyIndex] ?? playerId;
  }

  function hasNextStoryOpponent() {
    if (matchSettings.mode !== "ai" || matchSettings.aiMode !== "story" || game.matchWinner !== "p1") return false;
    const ids = getStoryOpponentIds(matchSettings.p1Character ?? "skitz");
    return (matchSettings.storyIndex ?? 0) < ids.length - 1;
  }

  function startNextStoryFight() {
    const nextIndex = (matchSettings.storyIndex ?? 0) + 1;
    const p1Character = matchSettings.p1Character ?? "skitz";
    const settings = {
      ...matchSettings,
      storyIndex: nextIndex,
      p2Character: getStoryOpponentId(p1Character, nextIndex),
      stageId: getRandomStageId(matchSettings.stageId),
    };
    setMatchSettings(settings);
    resetMatch(settings);
  }

  function openCharacterSelect(settings) {
    setPendingSettings(settings);
    setScreen("characterSelect");
  }

  function openStageSelect(settings) {
    preloadFightAssets(settings, "core");
    setPendingSettings({ ...settings, stageId: settings.stageId ?? "default" });
    setScreen("stageSelect");
  }

  function pickStage(stageId = "default") {
    const settings = { ...(pendingSettings ?? matchSettings), stageId };
    preloadFightAssets(settings, "all");
    setMatchSettings(settings);
    resetMatch(settings);
    setScreen("fight");
  }

  function startAIMatch() {
    // Flow: main menu -> pick your dancer -> AI mode -> AI difficulty -> fight/opponent select.
    openCharacterSelect({ mode: "ai", difficulty: "medium", aiMode: null, p1Character: null, p2Character: null, stageId: "default", storyIndex: 0 });
  }

  function pickAiMode(aiMode) {
    setPendingSettings({ ...(pendingSettings ?? { mode: "ai", difficulty: "medium", p1Character: "skitz" }), aiMode });
    setScreen("difficultySelect");
  }

  function pickDifficulty(difficulty) {
    const base = { ...(pendingSettings ?? { mode: "ai", aiMode: "mirror", p1Character: "skitz" }), difficulty };

    if (base.mode === "ai" && base.aiMode === "choose") {
      setPendingSettings({ ...base, p2Character: null });
      setScreen("opponentSelect");
      return;
    }

    const p1Character = base.p1Character ?? "skitz";
    const p2Character = base.aiMode === "story" ? getStoryOpponentId(p1Character, 0) : p1Character;
    const settings = { ...base, p1Character, p2Character, storyIndex: base.aiMode === "story" ? 0 : (base.storyIndex ?? 0) };
    openStageSelect(settings);
  }

  function startLANMatch() {
    openCharacterSelect({ mode: "lan", difficulty: "medium", aiMode: "mirror", p1Character: null, p2Character: null, stageId: "default", storyIndex: 0 });
  }

  function confirmCharacter(characterId = "skitz") {
    const base = pendingSettings ?? { mode: "ai", difficulty: "medium", aiMode: "mirror" };

    if (screen === "characterSelect" && base.mode === "ai") {
      setPendingSettings({ ...base, p1Character: characterId, p2Character: null });
      setScreen("aiModeSelect");
      return;
    }

    if (screen === "characterSelect" && base.mode === "lan") {
      setPendingSettings({ ...base, p1Character: characterId, p2Character: null });
      setScreen("p2CharacterSelect");
      return;
    }

    if (screen === "p2CharacterSelect") {
      const settings = { ...base, p1Character: base.p1Character ?? "skitz", p2Character: characterId };
      openStageSelect(settings);
      return;
    }

    if (screen === "opponentSelect") {
      const settings = { ...base, p1Character: base.p1Character ?? "skitz", p2Character: characterId };
      openStageSelect(settings);
      return;
    }

    const settings = { ...base, p1Character: characterId, p2Character: characterId };
    openStageSelect(settings);
  }

  function confirmLanCharacters({ p1Character = "skitz", p2Character = "jose" } = {}) {
    const base = pendingSettings ?? { mode: "lan", difficulty: "medium", aiMode: "mirror", stageId: "default", storyIndex: 0 };
    openStageSelect({ ...base, mode: "lan", p1Character, p2Character });
  }

  function backToMenu() {
    keys.current = {};
    roundStartToken.current += 1;
    setPauseMenuOpen(false);
    clearRoundFlowTimers();
    setRoundFlow(prev => ({ ...prev, phase: "idle", count: null }));
    setScreen("menu");
  }

  useEffect(() => {
    if (screen !== "fight" || !game.roundOver) return;
    clearRoundFlowTimers();
    setRoundFlow(prev => ({ ...prev, phase: game.matchOver ? "matchOver" : "roundOver", count: null }));

    if (game.matchOver) return;

    const delay = game.roundWinner === "draw" ? 3800 : 3000;
    const nextRoundTimer = setTimeout(() => {
      startNextRound();
    }, delay);

    return () => clearTimeout(nextRoundTimer);
  }, [screen, game.roundOver, game.matchOver, game.roundWinner, game.roundNumber]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.42;
    }

    const audio = audioRef.current;
    if (musicEnabled && screen === "fight") {
      audio.play().catch(() => {
        // Browser may wait for the next click/key press before allowing audio.
      });
    } else {
      audio.pause();
    }

    return () => {};
  }, [musicEnabled, screen]);

  // Stamina regen
  useEffect(() => {
    const regen = setInterval(() => {
      setGame(g => {
        if (g.roundOver || screen !== "fight" || roundFlow.phase !== "live" || pauseMenuOpenRef.current) return g;
        const p1ComebackBonus = isComebackActive(g.p1) ? COMEBACK_STAMINA_REGEN_BONUS : 0;
        const p2ComebackBonus = isComebackActive(g.p2) ? COMEBACK_STAMINA_REGEN_BONUS : 0;
        return {
          ...g,
          p1: { ...g.p1, stamina: Math.min(g.p1.maxStamina ?? 100, g.p1.stamina + (0.15 + p1ComebackBonus) * (g.p1.staminaRegenScale ?? 1)) },
          p2: { ...g.p2, stamina: Math.min(g.p2.maxStamina ?? 100, g.p2.stamina + (0.15 + p2ComebackBonus) * (g.p2.staminaRegenScale ?? 1)) },
        };
      });
    }, 16);
    return () => clearInterval(regen);
  }, [screen, roundFlow.phase]);

  useEffect(() => {
    const clock = setInterval(() => {
      setGame(g => {
        if (screen !== "fight" || roundFlow.phase !== "live" || pauseMenuOpenRef.current || g.roundOver) return g;
        const nextTimer = Math.max(0, (g.timer ?? 99) - 1);
        if (nextTimer > 0) return { ...g, timer: nextTimer };

        let roundWinner = "draw";
        if ((g.p1.hp ?? 0) > (g.p2.hp ?? 0)) roundWinner = "p1";
        if ((g.p2.hp ?? 0) > (g.p1.hp ?? 0)) roundWinner = "p2";

        let wins = g.wins ?? { p1: 0, p2: 0 };
        let matchWinner = null;
        if (roundWinner !== "draw") {
          wins = {
            ...wins,
            [roundWinner]: Math.min(ROUNDS_TO_WIN, (wins[roundWinner] ?? 0) + 1),
          };
          if (wins[roundWinner] >= ROUNDS_TO_WIN) matchWinner = roundWinner;
        }

        spawnSystemAlert("p1", "time-over", "TIME OVER");
        spawnSystemAlert("p2", "time-over", "TIME OVER");

        return {
          ...g,
          timer: 0,
          wins,
          roundOver: true,
          roundWinner,
          roundFinishReason: "timeout",
          matchOver: !!matchWinner,
          matchWinner,
        };
      });
    }, 1000);

    return () => clearInterval(clock);
  }, [screen, roundFlow.phase]);

  // Key listeners
  useEffect(() => {
    const down = (e) => {
      const k = normalizeInputKey(e.key);

      if (["shift", "space", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
      }

      if (screen !== "fight") return;

      if (k === "escape") {
        e.preventDefault();
        keys.current = {};
        setPauseMenuOpen(open => !open);
        return;
      }

      if (pauseMenuOpenRef.current) return;

      keys.current[k] = true;
      if (!e.repeat) {
        handleDashTap("p1", k);
        if (matchSettings.mode === "lan") handleDashTap("p2", k);
      }

      if (k === controls.p1.crouch && !crouchHeldSince.current.p1) crouchHeldSince.current.p1 = Date.now();
      if (k === controls.p2.crouch && !crouchHeldSince.current.p2) crouchHeldSince.current.p2 = Date.now();
      if (!e.repeat && k === controls.p1.block) guardPressedAt.current.p1 = Date.now();
      if (!e.repeat && k === controls.p2.block) guardPressedAt.current.p2 = Date.now();

      if (roundFlow.phase !== "live") return;

      if (!e.repeat && k === (controls.p1.taunt ?? DEFAULT_CONTROLS.p1.taunt)) performTaunt("p1");
      if (!e.repeat && matchSettings.mode === "lan" && k === (controls.p2.taunt ?? DEFAULT_CONTROLS.p2.taunt)) performTaunt("p2");

      // P1 custom attack controls
      if (k === controls.p1.lightPunch) attack("p1", "lightPunch");
      if (k === controls.p1.heavyPunch) attack("p1", "heavyPunch");
      if (k === controls.p1.heavyPunch2) attack("p1", "heavyPunch2");
      if (k === controls.p1.lightKick) attack("p1", "lightKick");
      if (k === controls.p1.heavyKick) attack("p1", "heavyKick");

      // P2 attacks only in LAN mode. AI controls P2 in AI mode.
      if (matchSettings.mode === "lan") {
        if (k === controls.p2.lightPunch) attack("p2", "lightPunch");
        if (k === controls.p2.heavyPunch) attack("p2", "heavyPunch");
        if (k === controls.p2.heavyPunch2) attack("p2", "heavyPunch2");
        if (k === controls.p2.lightKick) attack("p2", "lightKick");
        if (k === controls.p2.heavyKick) attack("p2", "heavyKick");
      }
    };

    const up = (e) => {
      const k = normalizeInputKey(e.key);
      if (pauseMenuOpenRef.current) return;
      keys.current[k] = false;
      if (k === controls.p1.crouch) {
        crouchHeldSince.current.p1 = 0;
        joseHeavyKickChain.current.p1 = { move: null, landed: false, expiry: 0 };
      }
      if (k === controls.p2.crouch) {
        crouchHeldSince.current.p2 = 0;
        joseHeavyKickChain.current.p2 = { move: null, landed: false, expiry: 0 };
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen, matchSettings, controls, roundFlow.phase]);

  function clearP1TouchMovement() {
    const p1Controls = controls.p1 ?? DEFAULT_CONTROLS.p1;
    [
      MOVEMENT_CONTROLS.p1.left,
      MOVEMENT_CONTROLS.p1.right,
      MOVEMENT_CONTROLS.p1.jump,
      p1Controls.crouch ?? DEFAULT_CONTROLS.p1.crouch,
      p1Controls.block ?? DEFAULT_CONTROLS.p1.block,
    ].forEach(key => {
      keys.current[key] = false;
    });
    crouchHeldSince.current.p1 = 0;
    joseHeavyKickChain.current.p1 = { move: null, landed: false, expiry: 0 };
  }

  function setP1TouchHold(control, isDown) {
    if (screen !== "fight") return;

    const p1Controls = controls.p1 ?? DEFAULT_CONTROLS.p1;
    const keyByControl = {
      left: MOVEMENT_CONTROLS.p1.left,
      right: MOVEMENT_CONTROLS.p1.right,
      jump: MOVEMENT_CONTROLS.p1.jump,
      crouch: p1Controls.crouch ?? DEFAULT_CONTROLS.p1.crouch,
      block: p1Controls.block ?? DEFAULT_CONTROLS.p1.block,
    };
    const key = keyByControl[control];
    if (!key) return;

    const shouldHold = Boolean(isDown && !pauseMenuOpenRef.current && !game.roundOver && !game.matchOver);
    keys.current[key] = shouldHold;

    if (control === "left" || control === "right") {
      const oppositeKey = control === "left" ? MOVEMENT_CONTROLS.p1.right : MOVEMENT_CONTROLS.p1.left;
      if (shouldHold) {
        keys.current[oppositeKey] = false;
        handleDashTap("p1", key);
      }
    }

    if (control === "crouch") {
      if (shouldHold && !crouchHeldSince.current.p1) crouchHeldSince.current.p1 = Date.now();
      if (!shouldHold) {
        crouchHeldSince.current.p1 = 0;
        joseHeavyKickChain.current.p1 = { move: null, landed: false, expiry: 0 };
      }
    }

    if (control === "block" && shouldHold) {
      guardPressedAt.current.p1 = Date.now();
    }
  }

  function tapP1TouchAttack(category) {
    if (pauseMenuOpenRef.current || game.roundOver || game.matchOver) return;
    attack("p1", category);
  }

  function tapP1TouchTaunt() {
    if (pauseMenuOpenRef.current || game.roundOver || game.matchOver) return;
    performTaunt("p1");
  }

  function toggleMobilePause() {
    if (screen !== "fight" || game.roundOver || game.matchOver) return;
    clearP1TouchMovement();
    setPauseMenuOpen(open => !open);
  }

  function applyXtraPoison(attackerKey, defenderKey) {
    const stacks = Math.min(XTRA_POISON_MAX_STACKS, (poisonStacks.current[defenderKey] || 0) + 1);
    poisonStacks.current[defenderKey] = stacks;
    spawnSystemAlert(defenderKey, "poison", `POISONED x${stacks}`);

    if (poisonTimers.current[defenderKey]) clearInterval(poisonTimers.current[defenderKey]);
    poisonTimers.current[defenderKey] = setInterval(() => {
      setGame(current => {
        if (current.roundOver || current.matchOver || roundFlow.phase !== "live" || pauseMenuOpenRef.current) return current;
        const def = { ...current[defenderKey] };
        const atk = { ...current[attackerKey] };
        if (!def || !atk || def.hp <= 0 || atk.hp <= 0) return current;

        const currentStacks = Math.max(1, poisonStacks.current[defenderKey] || 1);
        const tickDamage = Math.min(def.hp, ((def.maxHp ?? 100) * XTRA_POISON_DAMAGE_PER_STACK / 100) * currentStacks);
        def.hp = Math.max(0, def.hp - tickDamage);
        atk.hp = Math.min(atk.maxHp ?? 100, (atk.hp ?? 0) + tickDamage);
        updateRoundStat(attackerKey, stats => ({ ...stats, damage: (stats.damage ?? 0) + tickDamage }));
        spawnSystemAlert(defenderKey, "poison", `POISON -${pct(tickDamage)}`);
        setCombatPopups(list => [
          ...list,
          {
            id: effectId.current++,
            text: `-${pct(tickDamage)} POISON`,
            left: defenderKey === "p1" ? "34%" : "66%",
            top: `${44 + Math.random() * 10}%`,
            side: defenderKey === "p1" ? "left" : "right",
            blocked: false,
          },
          {
            id: effectId.current++,
            text: `+${pct(tickDamage)}`,
            left: attackerKey === "p1" ? "34%" : "66%",
            top: `${50 + Math.random() * 10}%`,
            side: attackerKey === "p1" ? "left" : "right",
            blocked: false,
            heal: true,
          },
        ]);
        return { ...current, [defenderKey]: def, [attackerKey]: atk };
      });
    }, XTRA_POISON_TICK_MS);
  }

  // ── Shared hitbox-check helper (used by both single-hit and multi-hit) ──────
  function fireHitbox(player, defenderKey, data, currentMove, damageOverride, attackToken) {
    setGame(latest => {
      if (roundFlow.phase !== "live") return latest;
      if (attackToken && activeAttackToken.current[player] !== attackToken) return latest;
      if (latest[player]?.lastAction !== currentMove && ATTACK_ACTION_SET.has(currentMove)) return latest;
      const def = { ...latest[defenderKey] };
      const atk = latest[player];
      const dist = Math.abs(atk.x - def.x);
      const stageReach = getStageCombatReach(matchSettings.stageId);
      const effectiveReach = (data.reach ?? 1.5) * stageReach.reachScale;

      if (knockdownInvulnerable.current[defenderKey]) return latest;
      if (dist > effectiveReach + stageReach.grace || def.hp <= 0 || latest.roundOver) return latest;

      // Jose's heavy-kick chain is designed as middle/low pressure.
      // If the defender jumps or is airborne, those kicks should pass underneath and do no damage.
      if (isJoseLowMidHeavyKick(atk, currentMove) && (!def.grounded || (def.y || 0) > 0.035)) {
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: 0,
          blocked: true,
          textOverride: "JUMP EVADE",
          noCombo: true,
        });

        // A whiff should not confirm Jose's S+C chain into the next heavy kick.
        if (joseHeavyKickChain.current[player]?.move === currentMove) {
          joseHeavyKickChain.current[player] = { move: currentMove, landed: false, expiry: Date.now() + 300 };
        }

        return { ...latest, [defenderKey]: def };
      }

      if (!canMoveReachDefenderHeight(atk, def, currentMove, data)) {
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: 0,
          blocked: true,
          textOverride: "AIR WHIFF",
          noCombo: true,
        });
        return { ...latest, [defenderKey]: def };
      }

      if (!canStrikeDefenderModel(atk, def, currentMove, data, matchSettings.stageId)) {
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: 0,
          blocked: true,
          textOverride: "WHIFF",
          noCombo: true,
        });
        return { ...latest, [defenderKey]: def };
      }

      const now = Date.now();
      const defenderHasActiveAttack = activeAttackToken.current[defenderKey] > 0 && ATTACK_ACTION_SET.has(def.lastAction);
      const startedCloseTogether = Math.abs((attackStartedAt.current[player] || now) - (attackStartedAt.current[defenderKey] || 0)) <= CLASH_WINDOW_MS;
      const clashReady = now >= (clashCooldowns.current[player] || 0) && now >= (clashCooldowns.current[defenderKey] || 0);
      if (
        defenderHasActiveAttack &&
        startedCloseTogether &&
        clashReady &&
        !def.blocking &&
        !stunLocked.current[player] &&
        !stunLocked.current[defenderKey] &&
        !knockdownInvulnerable.current[player] &&
        !knockdownInvulnerable.current[defenderKey]
      ) {
        const pushDir = def.x < atk.x ? -1 : 1;
        const attackerNext = {
          ...latest[player],
          vx: (latest[player].vx || 0) - pushDir * CLASH_PUSHBACK,
          x: latest[player].x - pushDir * 0.055,
          stamina: Math.min(latest[player].maxStamina ?? 100, (latest[player].stamina ?? 0) + CLASH_STAMINA_REFUND),
        };
        const defenderNext = {
          ...def,
          vx: (def.vx || 0) + pushDir * CLASH_PUSHBACK,
          x: def.x + pushDir * 0.055,
          stamina: Math.min(def.maxStamina ?? 100, (def.stamina ?? 0) + CLASH_STAMINA_REFUND),
        };

        activeAttackToken.current[player] = 0;
        activeAttackToken.current[defenderKey] = 0;
        comboState.current[player] = null;
        comboState.current[defenderKey] = null;
        clashCooldowns.current[player] = now + CLASH_COOLDOWN_MS;
        clashCooldowns.current[defenderKey] = now + CLASH_COOLDOWN_MS;
        updateRoundStat(player, stats => ({ ...stats, clashes: (stats.clashes ?? 0) + 1 }));
        updateRoundStat(defenderKey, stats => ({ ...stats, clashes: (stats.clashes ?? 0) + 1 }));
        spawnSystemAlert(player, "clash", "CLASH");
        spawnSystemAlert(defenderKey, "clash", "CLASH");
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: (def.x + atk.x) / 2,
          damage: 0,
          blocked: true,
          textOverride: "CLASH",
          noCombo: true,
          shakeBoost: 2.1,
          effectType: "clashSpark",
        });

        return { ...latest, [player]: attackerNext, [defenderKey]: defenderNext };
      }

      const attackerStats = getCharacterStats(atk.characterId);
      const defenderStats = getCharacterStats(def.characterId);
      const comebackBoost = isComebackActive(atk) ? COMEBACK_DAMAGE_MULTIPLIER : 1;
      const baseDamage = (damageOverride ?? data.damage) * (attackerStats.damageScale ?? 1) * comebackBoost;
      const scaledDamage = baseDamage * (defenderStats.damageTakenScale ?? def.damageTakenScale ?? 1);
      const rawDamage = data.trueDamage
        ? Math.max(MIN_DAMAGE_ON_HIT, data.trueDamage)
        : Math.max(MIN_DAMAGE_ON_HIT, Math.round(scaledDamage * HEALTH_DAMAGE_SCALE));
      const isPunchHit = currentMove.toLowerCase().includes("punch");
      const isKickHit = currentMove.toLowerCase().includes("kick");
      const crouchEvadesPunch = def.crouching && def.grounded && isPunchHit && !data.stun;

      if (crouchEvadesPunch) {
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: 0,
          blocked: true,
          textOverride: "MISS",
          noCombo: true,
        });
        return { ...latest, [defenderKey]: def };
      }

      const defenderIsStunned = !!stunLocked.current[defenderKey];
      const wasBlocking = !defenderIsStunned && def.blocking && def.grounded && def.stamina > 0;
      const perfectGuard = wasBlocking && Date.now() - (guardPressedAt.current[defenderKey] || 0) <= PERFECT_GUARD_WINDOW_MS;
      const defenderWasAttacking = !defenderIsStunned && activeAttackToken.current[defenderKey] > 0 && ATTACK_ACTION_SET.has(def.lastAction);
      const counterHit = !wasBlocking && defenderWasAttacking;
      const tauntPunish = !wasBlocking && now <= (tauntingUntil.current[defenderKey] || 0);
      let actualDamage = counterHit ? Math.max(MIN_DAMAGE_ON_HIT, Math.round(rawDamage * COUNTER_HIT_DAMAGE_MULTIPLIER)) : rawDamage;
      if (tauntPunish) actualDamage = Math.max(MIN_DAMAGE_ON_HIT, Math.round(actualDamage * TAUNT_PUNISH_MULTIPLIER));
      let staminaDamage = 0;

      if (perfectGuard) {
        const guardPushDir = def.x < atk.x ? -1 : 1;
        def.stamina = Math.min(def.maxStamina ?? 100, (def.stamina ?? 0) + PERFECT_GUARD_STAMINA_BONUS);
        def.vx += guardPushDir * 0.12;
        def.lastAction = "block";
        def.actionNonce++;
        guardPressedAt.current[defenderKey] = 0;
        comboState.current[player] = null;
        updateRoundStat(defenderKey, stats => ({ ...stats, perfectGuards: (stats.perfectGuards ?? 0) + 1 }));

        latest = {
          ...latest,
          [player]: {
            ...latest[player],
            stamina: Math.max(0, (latest[player].stamina ?? 0) - PERFECT_GUARD_ATTACKER_STAMINA_DRAIN),
            vx: (latest[player].vx || 0) - guardPushDir * 0.075,
          },
        };

        spawnSystemAlert(defenderKey, "perfect-guard", "PERFECT GUARD");
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: 0,
          blocked: true,
          textOverride: "PERFECT GUARD",
          noCombo: true,
          shakeBoost: 1.7,
        });
        return { ...latest, [defenderKey]: def };
      }

      if (wasBlocking && atk.characterId === "mockv" && currentMove === "heavyAttack3") {
        staminaDamage = Math.ceil((def.maxStamina ?? 100) * 0.5);
        actualDamage = 5;
        def.stamina = Math.max(0, def.stamina - staminaDamage);
        def.hp = Math.max(0, def.hp - actualDamage);
        spawnSystemAlert(defenderKey, "guard-crush", "GUARD CRUSH");
      } else if (!wasBlocking && atk.characterId === "mockv" && currentMove === "heavyAttack3") {
        actualDamage = 50;
        def.hp = Math.max(0, def.hp - actualDamage);
        def.stamina = Math.min(def.maxStamina ?? 100, def.stamina + 3);
      } else if (wasBlocking) {
        staminaDamage = Math.ceil(baseDamage * BLOCK_STAMINA_MULTIPLIER);
        const staminaBefore = def.stamina;
        def.stamina = Math.max(0, def.stamina - staminaDamage);
        if (def.stamina <= LOW_STAMINA_THRESHOLD) {
          spawnSystemAlert(defenderKey, "low-stamina", "LOW STAMINA");
        }

        const overflow = Math.max(0, staminaDamage - staminaBefore);
        actualDamage = overflow > 0 ? Math.max(1, Math.round(overflow * STAMINA_GUARD_BREAK_SPILLOVER)) : 0;
      } else {
        def.hp = Math.max(0, def.hp - actualDamage);
        def.stamina = Math.min(def.maxStamina ?? 100, def.stamina + 3);
      }

      if (wasBlocking && actualDamage > 0 && !(atk.characterId === "mockv" && currentMove === "heavyAttack3")) {
        def.hp = Math.max(0, def.hp - actualDamage);
      }

      if (wasBlocking && actualDamage === 0) {
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: staminaDamage,
          blocked: true,
          noCombo: true,
        });
        return { ...latest, [defenderKey]: def };
      }

      if (actualDamage > 0) {
        updateRoundStat(player, stats => ({
          ...stats,
          damage: (stats.damage ?? 0) + actualDamage,
          counters: (stats.counters ?? 0) + (counterHit ? 1 : 0),
          punishes: (stats.punishes ?? 0) + (tauntPunish ? 1 : 0),
        }));
      }

      if (tauntPunish) {
        tauntingUntil.current[defenderKey] = 0;
        spawnSystemAlert(player, "taunt-punish", "TAUNT PUNISH");
      }

      if (counterHit && latest[player]) {
        latest = {
          ...latest,
          [player]: {
            ...latest[player],
            stamina: Math.min(latest[player].maxStamina ?? 100, (latest[player].stamina ?? 0) + COUNTER_HIT_STAMINA_BONUS),
          },
        };
        spawnSystemAlert(player, "counter-hit", "COUNTER HIT");
      }

      def.actionNonce++;
      comboState.current[defenderKey] = null;

      // Mark the attacker combo as confirmed only when a hit actually lands.
      // This prevents mashing from auto-advancing a combo on whiff/block.
      if (comboState.current[player]) {
        comboState.current[player] = {
          ...comboState.current[player],
          landed: true,
        };
      }

      // Jose's S+C chain must be: heavyKick1 -> heavyKick3 -> heavyKick2.
      // Track it separately so normal kick combo logic never repeats heavyKick1 by accident.
      if (atk.characterId === "jose" && ["heavyKick1", "heavyKick3", "heavyKick2"].includes(currentMove)) {
        joseHeavyKickChain.current[player] = {
          move: currentMove,
          landed: true,
          expiry: Date.now() + 2200,
        };
      }

      const counterText = atk.characterId === "mockv" && currentMove === "heavyAttack3"
        ? (wasBlocking ? "SUPER BLOCKED" : "HEAVY ATTACK 3")
        : tauntPunish
          ? "TAUNT PUNISH"
        : counterHit
          ? "COUNTER HIT"
          : (wasBlocking && actualDamage > 0 ? "GUARD BREAK" : (data.specialAttack ? "POWER HIT" : null));
      const isCriticalDamage = actualDamage >= CRITICAL_DAMAGE_THRESHOLD || def.hp <= 20;
      const pushDir = def.x < atk.x ? -1 : 1;
      const joseChainKick = atk.characterId === "jose" && ["heavyKick1", "heavyKick3"].includes(currentMove);
      const isMultiHitCombo = currentMove === "punch3" || currentMove === "kick3" || currentMove === "kick1" || (atk.characterId === "jose" && ["heavyKick2", "heavyKick3"].includes(currentMove));
      // Jose heavyKick1 and heavyKick3 stun the opponent, but they are NOT combo enders.
      // Correct chain: S+C = heavyKick1, S+C+C = heavyKick3, S+C+C+C = heavyKick2.
      const isMockvAttacker = atk.characterId === "mockv";
      const isFinisher =
        currentMove === "punch4" ||
        currentMove === "heavyAttack3" ||
        (currentMove === "punch3" && !isMockvAttacker) ||
        (currentMove === "kick3" && !isMockvAttacker) ||
        (currentMove === "kick2" && isMockvAttacker) ||
        currentMove === "heavyKick2" ||
        (data.stun && !joseChainKick);
      const pushAmount = isMultiHitCombo
        ? MULTI_HIT_PUSHBACK
        : isCriticalDamage
          ? PUSHBACK_CRITICAL
          : data.stun || currentMove.toLowerCase().includes("heavy")
            ? PUSHBACK_HEAVY
            : PUSHBACK_BASE;
      const comboCarryHit = !isFinisher && !isCriticalDamage && (!data.stun || joseChainKick);
      const pushPositionScale = isMultiHitCombo
        ? MULTI_HIT_PUSHBACK_POSITION_SCALE
        : comboCarryHit
          ? COMBO_HIT_PUSHBACK_POSITION_SCALE
          : FINISHER_HIT_PUSHBACK_POSITION_SCALE;
      def.vx += pushDir * pushAmount;
      def.x += pushDir * pushAmount * pushPositionScale;
      if (latest[player] && comboCarryHit) {
        const followThrough = pushDir * Math.min(COMBO_ATTACKER_FOLLOW_THROUGH, pushAmount * 0.42);
        latest = {
          ...latest,
          [player]: {
            ...latest[player],
            x: latest[player].x + followThrough,
            vx: (latest[player].vx || 0) + pushDir * COMBO_ATTACKER_FOLLOW_VELOCITY,
          },
        };
      } else if (latest[player] && !isMultiHitCombo) {
        const attackerRecoil = pushDir * -ATTACKER_RECOIL_BASE;
        latest = {
          ...latest,
          [player]: {
            ...latest[player],
            vx: (latest[player].vx || 0) + attackerRecoil,
          },
        };
      }

      const bounds = getStageBounds(matchSettings.stageId);
      const wallCenter = (bounds.min + bounds.max) / 2;
      const wallBounceReady = now >= (wallBounceCooldowns.current[defenderKey] || 0);
      const nearWall = def.x <= bounds.min + WALL_BOUNCE_MARGIN || def.x >= bounds.max - WALL_BOUNCE_MARGIN;
      if (actualDamage > 0 && wallBounceReady && nearWall && (isFinisher || isCriticalDamage || data.stun)) {
        const bounceDir = def.x < wallCenter ? 1 : -1;
        wallBounceCooldowns.current[defenderKey] = now + 780;
        def.x = THREE.MathUtils.clamp(def.x, bounds.min + 0.08, bounds.max - 0.08);
        def.vx = bounceDir * WALL_BOUNCE_VELOCITY;
        if (!data.stun) {
          def.vy = Math.max(def.vy || 0, WALL_BOUNCE_LIFT);
          def.grounded = false;
        }
        updateRoundStat(player, stats => ({ ...stats, wallBounces: (stats.wallBounces ?? 0) + 1 }));
        spawnSystemAlert(player, "wall-bounce", "WALL BOUNCE");
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: 0,
          blocked: false,
          textOverride: "WALL BOUNCE",
          noCombo: true,
          shakeBoost: 1.55,
          effectType: "clashSpark",
        });
      }

      if (atk.characterId === "skitz" && actualDamage > 0) {
        const healAmount = calcSkitzHeal(currentMove, actualDamage);
        latest = {
          ...latest,
          [player]: {
            ...latest[player],
            hp: Math.min(latest[player].maxHp ?? 100, (latest[player].hp ?? 0) + healAmount),
          },
        };
        setCombatPopups(list => [
          ...list,
          {
            id: effectId.current++,
            text: `+${pct(healAmount)}`,
            left: player === "p1" ? "34%" : "66%",
            top: `${48 + Math.random() * 12}%`,
            side: player === "p1" ? "left" : "right",
            blocked: false,
            heal: true,
          },
        ]);
      }

      if (atk.characterId === "xtra" && data.poison && actualDamage > 0 && !wasBlocking) {
        applyXtraPoison(player, defenderKey);
      }

      spawnCombatFeedback({
        attackerKey: player,
        defenderKey,
        defenderX: def.x,
        damage: actualDamage,
        blocked: false,
        critical: isCriticalDamage,
        textOverride: counterText ?? undefined,
        shakeBoost: atk.characterId === "terrorEast" && currentMove === "punch3" ? 1.35 : 1,
      });

      if (!firstHitLanded.current && actualDamage > 0 && !wasBlocking) {
        firstHitLanded.current = true;
        updateRoundStat(player, stats => ({ ...stats, firstHit: true }));
        spawnSystemAlert(player, "first-hit", "FIRST HIT");
      }

      if (counterText) {
        setTimeout(() => spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: actualDamage,
          blocked: false,
          critical: isCriticalDamage,
          noCombo: true,
        }), 80);
      }

      const shouldKnockdown = isCriticalDamage && !data.stun && Math.random() < 0.45;
      // Pick the reaction based on the DEFENDER'S animation set and the move that actually landed.
      // Jose now has separate punch, kick, heavy punch, and heavy kick reactions, so avoid random
      // reactions that make the hit look wrong.
      const defenderIsJose = def.characterId === "jose";
      const defenderIsMockv = def.characterId === "mockv";
      const defenderIsXtra = def.characterId === "xtra";
      const reactionAction = shouldKnockdown
        ? "flyingBackDamageReaction"
        : data.stun
          ? (defenderIsJose
              ? (currentMove.toLowerCase().includes("heavypunch")
                  ? "heavyPunchReaction"
                  : currentMove === "heavyKick2"
                    ? "heavyHitAttackReaction"
                    : "heavyKickReaction")
              : defenderIsMockv
                ? (isKickHit ? "heavyKickReaction" : "heavyPunchReaction")
                : defenderIsXtra
                  ? "heavyHitAttackReaction"
                  : "heavyHitAttackReaction")
          : isKickHit
            ? "kickReaction"
            : (defenderIsJose
              ? (currentMove === "punch3" ? "punch3Reaction" : currentMove === "punch2" ? "punch2Reaction" : "punchReaction")
              : defenderIsMockv
                ? (currentMove === "punch4" || currentMove === "punch3" || currentMove === "punch2" ? "punch2Reaction" : "punchReaction")
                : defenderIsXtra
                  ? (isKickHit ? (currentMove === "kick3" || currentMove === "heavyKick2" ? "heavyKickReaction" : "kickReaction") : (currentMove === "punch3" ? "punch3Reaction" : currentMove === "punch2" ? "punch2Reaction" : "punchReaction"))
                  : (Math.random() < 0.38 ? "standingReaction" : "punchReaction"));

      if (data.stun || shouldKnockdown) {
        spawnSystemAlert(defenderKey, data.stun ? "stunned" : "knockdown", data.stun ? "STUNNED - NO BLOCK" : "KNOCKED DOWN");
        // True stun / knockdown beats guard: no stamina-blocking until recovery ends.
        stunLocked.current[defenderKey] = true;
        queuedAttack.current[defenderKey] = null;
        def.blocking = false;
        def.crouching = false;
        if (stunUnlockTimers.current[defenderKey]) clearTimeout(stunUnlockTimers.current[defenderKey]);
        if (knockdownTimers.current[defenderKey]) clearTimeout(knockdownTimers.current[defenderKey]);
        if (knockdownLandTimers.current[defenderKey]) clearTimeout(knockdownLandTimers.current[defenderKey]);

        const reactionMs = animDuration(reactionAction, def.characterId) * 1000;
        if (shouldKnockdown) {
          const landMs = (FLYING_BACK_LAND_FRAME / SOURCE_FPS) * 1000;
          const fullFlyingBackMs = (FLYING_BACK_TOTAL_FRAMES / SOURCE_FPS) * 1000;
          const getUpMs = (GET_UP_TOTAL_FRAMES / SOURCE_FPS) * 1000;
          const totalKnockdownMs = fullFlyingBackMs + getUpMs + KNOCKDOWN_GETUP_BUFFER_MS;

          knockdownInvulnerable.current[defenderKey] = true;
          def.blocking = false;
          def.crouching = false;
          // Original-style placement: let the fighter root stay at floor level while the
          // FBX handles the body pose. This avoids the get-up clip sinking through the floor.
          def.vx += pushDir * 0.42;
          def.vy = 0.055;
          def.grounded = false;

          // Frame guide for Flyingbackdamagereaction.fbx:
          // frame 1: hit starts, frame 5ish: airborne, frame 21: lands, frame 48: animation finishes.
          knockdownLandTimers.current[defenderKey] = setTimeout(() => {
            setGame(afterLand => {
              if (afterLand.roundOver || afterLand[defenderKey].hp <= 0) return afterLand;
              const landed = { ...afterLand[defenderKey] };
              landed.y = 0;
              landed.vy = 0;
              landed.vx *= 0.45;
              landed.grounded = true;
              landed.blocking = false;
              landed.crouching = false;
              return { ...afterLand, [defenderKey]: landed };
            });
            knockdownLandTimers.current[defenderKey] = null;
          }, landMs);

          knockdownTimers.current[defenderKey] = setTimeout(() => {
            setGame(afterKnockdown => {
              if (afterKnockdown.roundOver || afterKnockdown[defenderKey].hp <= 0) return afterKnockdown;
              const gettingUp = { ...afterKnockdown[defenderKey] };
              gettingUp.lastAction = "getUpAfterDamage";
              gettingUp.actionNonce++;
              gettingUp.y = 0;
              gettingUp.vy = 0;
              gettingUp.vx = 0;
              gettingUp.grounded = true;
              gettingUp.blocking = false;
              gettingUp.crouching = false;
              return { ...afterKnockdown, [defenderKey]: gettingUp };
            });
            knockdownTimers.current[defenderKey] = null;
          }, fullFlyingBackMs);

          stunUnlockTimers.current[defenderKey] = setTimeout(() => {
            stunLocked.current[defenderKey] = false;
            knockdownInvulnerable.current[defenderKey] = false;
            stunUnlockTimers.current[defenderKey] = null;
            lockExpiresAt.current[defenderKey] = 0;
            actionLocked.current[defenderKey] = false;
            setGame(afterGetUp => {
              if (afterGetUp.roundOver || afterGetUp[defenderKey].hp <= 0) return afterGetUp;
              const recovered = { ...afterGetUp[defenderKey] };
              recovered.lastAction = "idle";
              recovered.actionNonce++;
              recovered.blocking = false;
              recovered.crouching = false;
              recovered.grounded = true;
              return { ...afterGetUp, [defenderKey]: recovered };
            });
          }, totalKnockdownMs);
        } else {
          const stunMs = reactionMs + 120;
          stunUnlockTimers.current[defenderKey] = setTimeout(() => {
            stunLocked.current[defenderKey] = false;
            stunUnlockTimers.current[defenderKey] = null;
          }, stunMs);
        }
      }

      // Visual hit-stun is reset on every landed hit. This keeps close-range combos
      // from looking like ghost hits while still letting the attacker continue timing-based combos.
      if (hitReactionTimers.current[defenderKey]) clearTimeout(hitReactionTimers.current[defenderKey]);
      if (visualLockTimers.current[defenderKey]) clearTimeout(visualLockTimers.current[defenderKey]);

      actionLocked.current[defenderKey] = true;

      hitReactionTimers.current[defenderKey] = setTimeout(() => {
        setGame(afterDelay => {
          if (afterDelay.roundOver || afterDelay[defenderKey].hp <= 0) return afterDelay;
          const delayedDef = { ...afterDelay[defenderKey] };
          delayedDef.lastAction = reactionAction;
          delayedDef.actionNonce++;
          delayedDef.vx *= 0.25;
          return { ...afterDelay, [defenderKey]: delayedDef };
        });
      }, data.stun ? 0 : HIT_REACTION_DELAY_MS);

      const visualLockMs = reactionAction === "flyingBackDamageReaction"
        ? ((FLYING_BACK_TOTAL_FRAMES + GET_UP_TOTAL_FRAMES) / SOURCE_FPS) * 1000 + KNOCKDOWN_GETUP_BUFFER_MS
        : data.stun
          ? animDuration(reactionAction, def.characterId) * 1000 + 120
          : reactionAction === "kickReaction"
            ? Math.max(KICK_REACTION_LOCK_MS, animDuration("kickReaction", def.characterId) * 1000 * KICK_REACTION_SLOW_SCALE)
            : reactionAction === "standingReaction"
              ? STANDING_REACTION_LOCK_MS
              : isFinisher
                ? FINISHER_HITSTUN_MS
                : LIGHT_HITSTUN_MS;

      lockExpiresAt.current[defenderKey] = Date.now() + visualLockMs;
      visualLockTimers.current[defenderKey] = setTimeout(() => {
        actionLocked.current[defenderKey] = false;
        lockExpiresAt.current[defenderKey] = 0;
      }, visualLockMs);

      // Combo enders should feel strong, then give both players breathing room.
      if (isFinisher && comboState.current[player]) {
        comboState.current[player] = {
          ...comboState.current[player],
          expiry: Date.now() + 80,
          enderLanded: true,
        };
      }

      return { ...latest, [defenderKey]: def };
    });
  }

  function resolveComboMove(category, combo, now, characterId = "skitz", stamina = 0) {
    const comboLanded = combo && combo.landed && now < combo.expiry && !combo.enderLanded;

    if (category === "heavyPunch2" && characterId !== "mockv") return "heavyPunch2";

    if (characterId === "xtra") {
      if (category === "lightPunch") {
        if (comboLanded && combo.move === "punch2") return "punch3";
        if (comboLanded && combo.move === "punch1") return "punch2";
        return "punch1";
      }

      if (category === "lightKick") {
        if (comboLanded && combo.move === "kick2") return "kick3";
        if (comboLanded && combo.move === "kick1") return "kick2";
        return "kick1";
      }

      if (category === "heavyPunch") {
        if (comboLanded && combo.move === "heavyPunch1") return "heavyPunch2";
        return "heavyPunch1";
      }

      if (category === "heavyPunch2" || category === "heavyKick") {
        if (comboLanded && (combo.move === "heavyKick1" || combo.move === "heavyPunch1")) return "heavyKick2";
        return "heavyKick1";
      }
    }

    if (characterId === "terrorEast") {
      if (category === "lightPunch") {
        if (comboLanded && combo.move === "punch2") return "punch3";
        if (comboLanded && combo.move === "punch1") return "punch2";
        return "punch1";
      }

      if (category === "lightKick") {
        if (comboLanded && combo.move === "kick2") return "kick3";
        if (comboLanded && combo.move === "kick1") return "kick2";
        return "kick1";
      }

      if (category === "heavyPunch2") return "heavyPunch2";
      if (category === "heavyPunch") return "heavyPunch1";
      if (category === "heavyKick") return "heavyKick1";
    }

    if (characterId === "reign") {
      if (category === "lightPunch") {
        if (comboLanded && combo.move === "punch1") return "punch2";
        return "punch1";
      }

      if (category === "lightKick") {
        if (comboLanded && combo.move === "kick2") return "kick3";
        if (comboLanded && combo.move === "kick1") return "kick2";
        return "kick1";
      }

      if (category === "heavyPunch2") return "heavyPunch2";
      if (category === "heavyPunch") return "heavyPunch1";
      if (category === "heavyKick") return "heavyKick1";
    }

    if (characterId === "mockv") {
      if (category === "lightPunch") {
        if (comboLanded && combo.move === "punch3") return "punch4";
        if (comboLanded && combo.move === "punch2") return "punch3";
        if (comboLanded && combo.move === "punch1") return "punch2";
        return "punch1";
      }

      // Mockv only has two regular kicks right now: C = kick1, C+C = kick2.
      if (category === "lightKick") {
        if (comboLanded && combo.move === "kick1") return "kick2";
        return "kick1";
      }

      // F is the big Heavy Attack 3 super. It never starts the R-chain.
      if (category === "heavyPunch") {
        return "heavyAttack3";
      }

      // R chain: R = heavyPunch1, confirmed R+R = heavyPunch2.
      if (category === "heavyPunch2") {
        if (comboLanded && combo.move === "heavyPunch1") return "heavyPunch2";
        return "heavyPunch1";
      }

      if (category === "heavyKick") {
        if (comboLanded && combo.move === "heavyKick1") return "heavyKick2";
        return "heavyKick1";
      }
    }

    if (category === "lightPunch") {
      if (comboLanded && combo.move === "punch2") return "punch3";
      if (comboLanded && combo.move === "punch1") return "punch2";
      return "punch1";
    }

    if (category === "lightKick") {
      if (comboLanded && combo.move === "kick2") return "kick3";
      if (comboLanded && combo.move === "kick1") return "kick2";
      return "kick1";
    }

    if (category === "heavyPunch") {
      if (comboLanded && combo.move === "heavyPunch1") return "heavyPunch2";
      return "heavyPunch1";
    }

    if (category === "heavyKick") {
      if (comboLanded && combo.move === "heavyKick2") return "heavyKick3";
      if (comboLanded && combo.move === "heavyKick1") return "heavyKick2";
      return "heavyKick1";
    }

    return "";
  }

  function registerAttackIntent(player, category, fromQueue = false) {
    if (fromQueue) return true;

    const now = Date.now();
    const state = inputSpam.current[player] ?? { presses: [], penaltyUntil: 0, lastCategory: null, lastPressAt: 0 };
    inputSpam.current[player] = state;

    if (state.penaltyUntil > now) {
      spawnSystemAlert(player, "spam-lock", "STOP MASHING - TIME YOUR INPUTS");
      return false;
    }

    state.presses = state.presses.filter(t => now - t <= INPUT_SPAM_WINDOW_MS);
    state.presses.push(now);

    const sameButtonTap = state.lastCategory === category && now - state.lastPressAt < 85;
    state.lastCategory = category;
    state.lastPressAt = now;

    if (sameButtonTap || state.presses.length > INPUT_SPAM_MAX_PRESSES) {
      state.penaltyUntil = now + INPUT_SPAM_PENALTY_MS;
      state.presses = [];
      spawnSystemAlert(player, "spam-lock", "STOP MASHING - TIME YOUR INPUTS");
      return false;
    }

    if (actionLocked.current[player] && queuedAttack.current[player]) {
      spawnSystemAlert(player, "buffer-full", INPUT_BUFFER_LIMIT_MESSAGE);
      return false;
    }

    return true;
  }

  function queueAttack(player, category) {
    if (queuedAttack.current[player]) {
      spawnSystemAlert(player, "buffer-full", INPUT_BUFFER_LIMIT_MESSAGE);
      return;
    }
    const now = Date.now();
    queuedAttack.current[player] = {
      category,
      createdAt: now,
      expiresAt: now + COMBO_QUEUE_BUFFER_MS,
    };
  }

  function unlockAttack(player) {
    actionLocked.current[player] = false;
    lockExpiresAt.current[player] = 0;
    activeAttackToken.current[player] = 0;

    const queued = queuedAttack.current[player];
    if (!queued) return;

    queuedAttack.current[player] = null;

    if (Date.now() <= queued.expiresAt && !stunLocked.current[player] && !knockdownInvulnerable.current[player]) {
      // Run after this call stack so React can commit the previous animation state first.
      setTimeout(() => attack(player, queued.category, true), 0);
    }
  }

  function scheduleAttackUnlock(player, delayMs) {
    if (attackUnlockTimers.current[player]) {
      clearTimeout(attackUnlockTimers.current[player]);
    }

    lockExpiresAt.current[player] = Date.now() + delayMs;
    attackUnlockTimers.current[player] = setTimeout(() => {
      unlockAttack(player);
    }, delayMs);
  }

  function attack(player, category, fromQueue = false) {
    setGame((g) => {
      const now = Date.now();
      const combo = comboState.current[player];

      if (screen !== "fight" || g.roundOver || roundFlow.phase !== "live") {
        return g;
      }

      if (!registerAttackIntent(player, category, fromQueue)) {
        return g;
      }

      if (stunLocked.current[player]) {
        spawnSystemAlert(player, "stunned", knockdownInvulnerable.current[player] ? "GETTING UP - WAIT" : "STUNNED - CAN'T ATTACK");
        return g;
      }

      if (knockdownInvulnerable.current[player]) {
        spawnSystemAlert(player, "knockdown", "GETTING UP - WAIT");
        return g;
      }

      if (g[player].blocking) {
        return g;
      }

      // Do not let button mashing overwrite the current attack animation.
      // But if a stale lock is left on an idle/walking character, clear it immediately.
      if (actionLocked.current[player]) {
        const currentVisual = g[player].lastAction;
        const lockExpired = lockExpiresAt.current[player] && Date.now() > lockExpiresAt.current[player] + LOCK_FAILSAFE_PAD_MS;
        const trulyBusy = ATTACK_ACTION_SET.has(currentVisual) || ["punchReaction", "punch2Reaction", "punch3Reaction", "kickReaction", "heavyPunchReaction", "heavyKickReaction", "heavyHitAttackReaction", "standingReaction", "flyingBackDamageReaction", "getUpAfterDamage", "stunned"].includes(currentVisual);
        if ((!trulyBusy || lockExpired) && !stunLocked.current[player]) {
          actionLocked.current[player] = false;
          lockExpiresAt.current[player] = 0;
        } else {
          if (!fromQueue) queueAttack(player, category);
          return g;
        }
      }

      const defenderKey = player === "p1" ? "p2" : "p1";
      const attacker = { ...g[player] };
      const requestedMove = resolveComboMove(category, combo, now, attacker.characterId, attacker.stamina);
      let currentMove = requestedMove;
      const isJose = attacker.characterId === "jose";
      const isMockv = attacker.characterId === "mockv";
      const crouchHeld = player === "p1" ? !!keys.current[controls.p1.crouch] : !!keys.current[controls.p2.crouch];

      // Jose-specific rule: heavy punches do NOT need crouch.
      // His heavy-kick chain uses the down/crouch button + C while S stays held:
      // S+C = heavyKick1, then confirmed S+C = heavyKick3, then confirmed S+C = heavyKick2.
      // This uses joseHeavyKickChain instead of the regular light-kick combo state.
      if (isJose && crouchHeld && category === "lightKick") {
        const joseChain = joseHeavyKickChain.current[player];
        const chainReady = joseChain?.landed && now < joseChain.expiry;

        if (chainReady && joseChain.move === "heavyKick1") currentMove = "heavyKick3";
        else if (chainReady && joseChain.move === "heavyKick3") currentMove = "heavyKick2";
        else currentMove = "heavyKick1";
      }
      if (isJose && category === "heavyKick") {
        spawnSystemAlert(player, "jose-heavykick", "JOSE HEAVY KICKS: HOLD S + PRESS C");
        return g;
      }

      const data = getMoveData(attacker.characterId, currentMove);
      if (!data) return g;

      if (data.staminaRequirement && attacker.stamina < (attacker.maxStamina ?? 100) * data.staminaRequirement) {
        spawnSystemAlert(player, "burnout", `${Math.round(data.staminaRequirement * 100)}% STAMINA REQUIRED`);
        return g;
      }

      const rawCost = data.superAttack ? (attacker.maxStamina ?? 100) * 0.5 : data.cost;
      const staminaCost = Math.ceil(rawCost * (attacker.staminaCostScale ?? 1));
      if (attacker.stamina < staminaCost) {
        spawnSystemAlert(player, "burnout", `NO STAMINA FOR ${currentMove.toUpperCase()}`);
        return g;
      }

      const totalMs = animDuration(currentMove, attacker.characterId) * 1000;
      const joseHeavyKickTiming = isJose ? {
        // Corrected Jose chain order: heavyKick1 -> heavyKick3 -> heavyKick2.
        // Let each clip breathe long enough to visibly finish before the queued input releases.
        heavyKick1: { min: Math.max(560, totalMs * 0.96), recovery: 70 },
        heavyKick3: { min: Math.max(650, totalMs * 0.96), recovery: 85 },
        heavyKick2: { min: Math.max(860, totalMs * 0.96), recovery: 150 },
      }[currentMove] : null;
      const mockvTiming = isMockv ? {
        min: totalMs,
        recovery: MOCKV_ATTACK_RECOVERY_MS[currentMove] ?? Math.max(80, Math.round(totalMs * 0.14)),
      } : null;
      const minimumVisibleMs = joseHeavyKickTiming?.min ?? mockvTiming?.min ?? (ATTACK_MIN_VISIBLE_MS[currentMove] ?? Math.max(360, totalMs * 0.72));
      // Jose heavyKick1 and heavyKick3 can stun, but they still chain. heavyKick2 ends the chain.
      const isComboEnderMove =
        currentMove === "punch4" ||
        currentMove === "heavyAttack3" ||
        (currentMove === "punch3" && !isMockv) ||
        (currentMove === "kick3" && !isMockv) ||
        (currentMove === "kick2" && isMockv) ||
        currentMove === "heavyKick2" ||
        (data.stun && !(isJose && ["heavyKick1", "heavyKick3"].includes(currentMove)));
      const recoveryMs = joseHeavyKickTiming?.recovery ?? mockvTiming?.recovery ?? (ATTACK_RECOVERY_MS[currentMove] ?? 160);
      // Let the animation complete, then add a small recovery window.
      // Queued inputs release after this, so button-mashing cannot cut the animation short.
      const attackLockMs = Math.max(totalMs + recoveryMs, minimumVisibleMs + recoveryMs) + (isComboEnderMove ? COMBO_FINISHER_RECOVERY_MS : 0);

      actionLocked.current[player] = true;
      scheduleAttackUnlock(player, attackLockMs);

      const joseHeavyChainMove = isJose && ["heavyKick1", "heavyKick3"].includes(currentMove);
      if (isJose && ["heavyKick1", "heavyKick3", "heavyKick2"].includes(currentMove)) {
        joseHeavyKickChain.current[player] = {
          move: currentMove,
          landed: false,
          expiry: now + attackLockMs + 2200,
        };
      }
      comboState.current[player] = {
        move: currentMove,
        landed: false,
        // Jose's S+C chain needs extra time because the player is holding S and waiting for full animation finish.
        expiry: now + attackLockMs + (joseHeavyChainMove ? 1800 : COMBO_WINDOW_MS),
      };

      attacker.stamina -= staminaCost;
      if (attacker.stamina <= LOW_STAMINA_THRESHOLD) {
        spawnSystemAlert(player, "low-stamina", "LOW STAMINA");
      }
      attacker.actionNonce++;
      attacker.lastAction = currentMove;
      const attackToken = (activeAttackToken.current[player] || 0) + 1;
      activeAttackToken.current[player] = attackToken;
      attackStartedAt.current[player] = now;

      if (data.superAttack || data.specialAttack) {
        spawnSystemAlert(player, data.superAttack ? "super-start" : "power-start", data.superAttack ? "SUPER STARTUP" : "POWER MOVE");
      }

      // Fighting-game feel: attacks keep a little forward momentum instead of freezing in place.
      // This makes footsies easier and helps punches/kicks connect without needing to stand on top of the opponent.
      const facingDir = attacker.x < g[defenderKey].x ? 1 : -1;
      const currentDrift = ATTACK_FORWARD_DRIFT[currentMove] ?? 0.045;
      const holdingForward = player === "p1"
        ? isHoldingForward(keys.current, MOVEMENT_CONTROLS.p1, facingDir > 0)
        : matchSettings.mode === "lan" ? isHoldingForward(keys.current, MOVEMENT_CONTROLS.p2, facingDir > 0) : true;
      attacker.vx = attacker.vx * 0.55 + facingDir * currentDrift * (holdingForward ? 1.35 : 0.85);

      const multiFrames = getMultiHitFrames(attacker.characterId, currentMove);

      if (multiFrames) {
        multiFrames.forEach((frame) => {
          const delayMs = (frame / SOURCE_FPS) * 1000;
          setTimeout(() => fireHitbox(player, defenderKey, data, currentMove, data.damage, attackToken), delayMs);
        });
      } else {
        const hitDelay = hitDelayMs(currentMove, attacker.characterId);
        setTimeout(() => fireHitbox(player, defenderKey, data, currentMove, null, attackToken), hitDelay);
      }

      return { ...g, [player]: attacker };
    });
  }

  // Physics + movement loop
  useEffect(() => {
    const loop = setInterval(() => {
      if (screen !== "fight") return;

      setGame((g) => {
        if (roundFlow.phase !== "live" || pauseMenuOpenRef.current) return g;
        if (g.roundOver) return g;

        const p1 = { ...g.p1 };
        const p2 = { ...g.p2 };

        // Safety: never let a finished visual state trap inputs forever.
        // Heavy stun still stays locked through stunLocked; normal idle/walk states are always playable.
        const nowMs = Date.now();
        const p1LockExpired = lockExpiresAt.current.p1 && nowMs > lockExpiresAt.current.p1 + LOCK_FAILSAFE_PAD_MS;
        const p2LockExpired = lockExpiresAt.current.p2 && nowMs > lockExpiresAt.current.p2 + LOCK_FAILSAFE_PAD_MS;
        if (!stunLocked.current.p1 && !knockdownInvulnerable.current.p1 && (!ATTACK_ACTION_SET.has(p1.lastAction) && !["punchReaction", "punch2Reaction", "punch3Reaction", "kickReaction", "heavyPunchReaction", "heavyKickReaction", "heavyHitAttackReaction", "standingReaction", "flyingBackDamageReaction", "getUpAfterDamage", "stunned"].includes(p1.lastAction) || p1LockExpired)) {
          actionLocked.current.p1 = false;
          lockExpiresAt.current.p1 = 0;
        }
        if (!stunLocked.current.p2 && !knockdownInvulnerable.current.p2 && (!ATTACK_ACTION_SET.has(p2.lastAction) && !["punchReaction", "punch2Reaction", "punch3Reaction", "kickReaction", "heavyPunchReaction", "heavyKickReaction", "heavyHitAttackReaction", "standingReaction", "flyingBackDamageReaction", "getUpAfterDamage", "stunned"].includes(p2.lastAction) || p2LockExpired)) {
          actionLocked.current.p2 = false;
          lockExpiresAt.current.p2 = 0;
        }

        updateFighterMovement(
          p1,
          p2,
          keys.current,
          actionLocked.current.p1,
          { ...MOVEMENT_CONTROLS.p1, crouch: controls.p1.crouch, block: controls.p1.block },
          (stunLocked.current.p1 || knockdownInvulnerable.current.p1)
        );

        if (matchSettings.mode === "lan") {
          updateFighterMovement(
            p2,
            p1,
            keys.current,
            actionLocked.current.p2,
            { ...MOVEMENT_CONTROLS.p2, crouch: controls.p2.crouch, block: controls.p2.block },
            (stunLocked.current.p2 || knockdownInvulnerable.current.p2)
          );
        } else {
          updateAIMovement(p2, p1, matchSettings.difficulty, (stunLocked.current.p2 || knockdownInvulnerable.current.p2));
        }

        resolveBodySpacing(p1, p2, matchSettings.stageId);

        let roundOver = false;
        let roundWinner = null;
        let matchWinner = null;
        let roundFinishReason = g.roundFinishReason ?? null;
        let wins = g.wins ?? { p1: 0, p2: 0 };

        if (p1.hp <= 0 || p2.hp <= 0) {
          if (p1.hp <= 0) p1.lastAction = "die";
          if (p2.hp <= 0) p2.lastAction = "die";

          // Draws are rare, but possible if both take damage on the same frame.
          if (p1.hp <= 0 && p2.hp <= 0) {
            roundWinner = "draw";
          } else {
            roundWinner = p1.hp <= 0 ? "p2" : "p1";
            wins = {
              ...wins,
              [roundWinner]: Math.min(ROUNDS_TO_WIN, (wins[roundWinner] ?? 0) + 1),
            };
            if (wins[roundWinner] >= ROUNDS_TO_WIN) matchWinner = roundWinner;
          }

          setRedFlashNonce(n => n + 1);
          if (roundWinner === "draw") {
            spawnSystemAlert("p1", "ko", "DOUBLE KO");
            spawnSystemAlert("p2", "ko", "DOUBLE KO");
            spawnFloatingPopup({ playerKey: "p1", text: "DOUBLE KO", top: "34%", ko: true });
          } else {
            spawnSystemAlert(roundWinner, "ko", "KNOCKOUT");
            spawnFloatingPopup({ playerKey: roundWinner, text: "KNOCKOUT", top: "34%", ko: true });
          }

          roundOver = true;
          roundFinishReason = "ko";
        }

        return {
          ...g,
          p1,
          p2,
          wins,
          roundOver,
          roundWinner,
          roundFinishReason,
          matchOver: !!matchWinner,
          matchWinner,
        };
      });
    }, 16);

    return () => clearInterval(loop);
  }, [screen, matchSettings, roundFlow.phase]);

  function updateAIMovement(ai, player, difficulty, isStunned = false) {
    const profiles = {
      easy: { reaction: 760, aggression: 0.48, blockChance: 0.18, range: 1.82 },
      medium: { reaction: 520, aggression: 0.68, blockChance: 0.30, range: 1.74 },
      hard: { reaction: 360, aggression: 0.84, blockChance: 0.44, range: 1.66 },
      extreme: { reaction: 230, aggression: 0.96, blockChance: 0.58, range: 1.58 },
    };

    const brain = profiles[difficulty] ?? profiles.medium;
    const now = Date.now();
    const dist = Math.abs(ai.x - player.x);
    const facingRight = ai.x < player.x;
    const daBullSpacing = matchSettings.stageId === "daBull";
    const attackRange = daBullSpacing ? 0.84 : brain.range;

    ai.blocking = false;
    ai.crouching = false;

    if (isStunned) {
      ai.blocking = false;
      ai.crouching = false;
      return;
    }

    if (actionLocked.current.p2 || ai.hp <= 0) return;

    if (now - aiBrain.current.lastDecision > brain.reaction) {
      aiBrain.current.lastDecision = now;

      const playerIsAttacking = LOOP_ONCE_SET.has(player.lastAction);

      if (playerIsAttacking && Math.random() < brain.blockChance) {
        ai.blocking = true;
        ai.lastAction = "block";
        ai.actionNonce++;
        guardPressedAt.current.p2 = now;
        return;
      }

      if (dist <= attackRange && now > aiBrain.current.nextAttack && Math.random() < brain.aggression) {
        const choices =
          difficulty === "extreme"
            ? ["lightPunch", "lightKick", "heavyPunch", "heavyKick"]
            : difficulty === "hard"
              ? ["lightPunch", "lightKick", "heavyPunch"]
              : ["lightPunch", "lightKick"];

        const pick = choices[Math.floor(Math.random() * choices.length)];
        attack("p2", pick);
        aiBrain.current.nextAttack = now + brain.reaction + (difficulty === "extreme" ? 330 : difficulty === "hard" ? 430 : 560);
        return;
      }
    }

    const targetGap = daBullSpacing ? 0.74 :
      difficulty === "extreme" ? 1.20 :
      difficulty === "hard" ? 1.30 :
      difficulty === "medium" ? 1.42 :
      1.58;
    const retreatGap = daBullSpacing ? 0.62 : 0.85;

    if (dist > targetGap) {
      ai.vx += facingRight ? 0.012 : -0.012;
    } else if (dist < retreatGap) {
      ai.vx += facingRight ? -0.012 : 0.012;
    }

    ai.x += ai.vx || 0;
    ai.vx *= 0.82;

    if (Math.abs(ai.vx) > 0.01) {
      ai.lastAction = ai.vx * (facingRight ? 1 : -1) > 0 ? "walk" : "back";
    } else {
      ai.lastAction = "idle";
    }
  }

  if (screen === "aiModeSelect") {
    return frameMobileMenu(
      <AiModeSelect
        settings={pendingSettings}
        onBack={() => setScreen("characterSelect")}
        onPick={pickAiMode}
      />
    );
  }

  if (screen === "difficultySelect") {
    return frameMobileMenu(
      <DifficultySelect
        settings={pendingSettings}
        onBack={() => setScreen("aiModeSelect")}
        onPick={pickDifficulty}
      />
    );
  }

  if (screen === "characterSelect") {
    if (pendingSettings?.mode === "lan") {
      return frameMobileMenu(
        <LanCharacterSelect
          settings={pendingSettings}
          onBack={() => setScreen("menu")}
          onConfirm={confirmLanCharacters}
        />
      );
    }

    return frameMobileMenu(
      <CharacterSelect
        settings={pendingSettings}
        onBack={() => setScreen("menu")}
        onSelect={confirmCharacter}
        title="CHOOSE YOUR DANCER"
      />
    );
  }

  if (screen === "p2CharacterSelect") {
    return frameMobileMenu(
      <CharacterSelect
        settings={pendingSettings}
        onBack={() => {
          setPendingSettings(prev => prev ? { ...prev, p2Character: null } : prev);
          setScreen("characterSelect");
        }}
        onSelect={confirmCharacter}
        title="PLAYER 2 SELECT"
        subtitle={`PLAYER 1: ${getCharacterStats(pendingSettings?.p1Character ?? "skitz").name?.toUpperCase?.() ?? "SKITZ"} / PICK PLAYER 2`}
      />
    );
  }

  if (screen === "opponentSelect") {
    return frameMobileMenu(
      <CharacterSelect
        settings={pendingSettings}
        onBack={() => setScreen("difficultySelect")}
        onSelect={confirmCharacter}
        title="CHOOSE OPPONENT"
        subtitle={`PLAYER: ${getCharacterStats(pendingSettings?.p1Character ?? "skitz").name?.toUpperCase?.() ?? "SKITZ"} / PICK WHO TO FIGHT`}
      />
    );
  }

  if (screen === "stageSelect") {
    return frameMobileMenu(
      <StageSelect
        settings={pendingSettings}
        onBack={() => {
          if (pendingSettings?.mode === "lan") setScreen("characterSelect");
          else if (pendingSettings?.mode === "ai" && pendingSettings?.aiMode === "choose") setScreen("opponentSelect");
          else setScreen("difficultySelect");
        }}
        onPick={pickStage}
      />
    );
  }

  if (screen === "menu") {
    return frameMobileMenu(
      <MainMenu
        onStartAI={startAIMatch}
        onStartLAN={startLANMatch}
        controls={controls}
        setControls={setControls}
        musicEnabled={musicEnabled}
        setMusicEnabled={setMusicEnabled}
      />
    );
  }

  const mobileOuterPadding = viewport.isLandscape ? 8 : 10;
  const mobileControllerReserve = viewport.isLandscape ? 132 : 304;
  const mobileAvailableWidth = Math.max(280, viewport.width - mobileOuterPadding * 2);
  const mobileMaxMediaHeight = Math.max(140, viewport.height - mobileControllerReserve - mobileOuterPadding * 2);
  const mobileMediaHeight = Math.floor(Math.min(mobileAvailableWidth * 9 / 16, mobileMaxMediaHeight));
  const mobileMediaWidth = Math.floor(Math.min(mobileAvailableWidth, mobileMediaHeight * 16 / 9));
  const fightViewportKey = isMobileFightLayout
    ? `mobile-${viewport.isLandscape ? "land" : "port"}-${mobileMediaWidth}x${mobileMediaHeight}`
    : "desktop";
  const hudScale = isMobileFightLayout ? (viewport.isLandscape ? 0.64 : 0.56) : 1;
  const badgeScale = isMobileFightLayout ? (viewport.isLandscape ? 0.62 : 0.56) : 1;
  const staminaScale = isMobileFightLayout ? (viewport.isLandscape ? 0.62 : 0.54) : 1;
  const mobileStagePaused = pauseMenuOpen || game.roundOver || game.matchOver;

  const fightRootStyle = isMobileFightLayout
    ? {
        width: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        background: "radial-gradient(circle at 50% 0%, rgba(45,125,255,0.18), transparent 34%), linear-gradient(135deg, #020307 0%, #07101f 46%, #160306 100%)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: viewport.isLandscape ? "6px" : "10px",
        padding: `${mobileOuterPadding}px ${mobileOuterPadding}px 0`,
        touchAction: "none",
      }
    : { width: "100vw", height: "100vh", background: "#000", position: "relative", overflow: "hidden" };

  const fightViewportStyle = isMobileFightLayout
    ? {
        width: `${mobileMediaWidth}px`,
        height: `${mobileMediaHeight}px`,
        position: "relative",
        overflow: "hidden",
        flex: "0 0 auto",
        background: "#000",
        border: "1px solid rgba(192,226,255,0.42)",
        borderRadius: "8px",
        boxShadow: "0 0 28px rgba(45,125,255,0.22), 0 0 34px rgba(255,38,35,0.14), inset 0 0 18px rgba(255,255,255,0.05)",
      }
    : { width: "100%", height: "100%", position: "relative", overflow: "hidden", background: "#000" };

  const hudSlotStyle = (side) => isMobileFightLayout
    ? {
        minWidth: 0,
        height: `${98 * hudScale}px`,
        transform: `scale(${hudScale})`,
        transformOrigin: side === "right" ? "top right" : "top left",
      }
    : { minWidth: 0 };

  const pauseMenu = pauseMenuOpen && !game.roundOver && (
    <PauseMenu
      controls={controls}
      setControls={setControls}
      musicEnabled={musicEnabled}
      setMusicEnabled={setMusicEnabled}
      matchSettings={matchSettings}
      setMatchSettings={setMatchSettings}
      onResume={() => {
        keys.current = {};
        setPauseMenuOpen(false);
      }}
      onMenu={backToMenu}
      mobile={isMobileFightLayout}
    />
  );

  return (
    <div className={`bd-fight-root ${isMobileFightLayout ? "bd-game-shell-mobile" : ""}`} style={fightRootStyle}>
      <div className="bd-game-shell bd-fight-viewport" style={fightViewportStyle}>
        <ScreenImpact shakeEvent={shakeEvent} />
        <Canvas
          key={fightViewportKey}
          shadows={!isMobileFightLayout}
          dpr={isMobileFightLayout ? [1, 1.25] : [1, 2]}
          camera={{ position: [0, 1.6, 6.8], fov: 42 }}
          gl={{ alpha: false, antialias: !isMobileFightLayout, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 0, background: "#000" }}
          resize={{ scroll: false, debounce: { scroll: 80, resize: 60 } }}
          onCreated={({ gl, camera, size }) => {
            gl.setClearColor("#050507", 1);
            gl.setSize(size.width, size.height, false);
            if (camera.isPerspectiveCamera) {
              camera.aspect = Math.max(0.1, size.width / Math.max(1, size.height));
              camera.updateProjectionMatrix();
            }
          }}
        >
          <CanvasSceneErrorBoundary
            resetKey={`${fightViewportKey}-${matchSettings.stageId}-${game.roundNumber}`}
            fallback={null}
          >
            <Suspense fallback={null}>
              <FightScene
                game={game}
                visualEffects={visualEffects}
                shakeEvent={shakeEvent}
                hitStopEvent={hitStopEvent}
                stageId={matchSettings.stageId}
                mobile={isMobileFightLayout}
              />
            </Suspense>
          </CanvasSceneErrorBoundary>
        </Canvas>

        <div
          className="hud-row"
          style={{
            position: "absolute",
            top: isMobileFightLayout ? 6 : 18,
            left: isMobileFightLayout ? 7 : 34,
            right: isMobileFightLayout ? 7 : 34,
            height: isMobileFightLayout ? 68 : 106,
            display: "grid",
            gridTemplateColumns: isMobileFightLayout ? "minmax(0, 1fr) 56px minmax(0, 1fr)" : "minmax(260px, 1fr) 108px minmax(260px, 1fr)",
            gap: isMobileFightLayout ? "3px" : "12px",
            alignItems: "start",
            pointerEvents: "none",
          }}
        >
          <div style={hudSlotStyle("left")}>
            <Hud name={game.p1.name?.toUpperCase?.() ?? "SKITZ"} label="PLAYER 1" hp={game.p1.hp} maxHp={game.p1.maxHp} wins={game.wins?.p1 ?? 0} hype={isComebackActive(game.p1)} />
          </div>
          <div style={isMobileFightLayout ? { transform: `scale(${badgeScale})`, transformOrigin: "top center", display: "flex", justifyContent: "center", height: `${86 * badgeScale}px` } : {}}>
            <RoundBadge roundNumber={game.roundNumber} timer={game.timer} />
          </div>
          <div style={hudSlotStyle("right")}>
            <Hud
              name={(game.p2.name?.toUpperCase?.() ?? "OPPONENT").replace(/\s+(BEGINNER|MEDIUM|HARD|EXTREME|CRITICAL)$/, "")}
              label={matchSettings.mode === "ai" ? `CPU ${matchSettings.difficulty.toUpperCase()}` : "PLAYER 2"}
              hp={game.p2.hp}
              maxHp={game.p2.maxHp}
              wins={game.wins?.p2 ?? 0}
              hype={isComebackActive(game.p2)}
              reverse
            />
          </div>
        </div>

        <div
          className="stamina-row"
          style={{
            position: "absolute",
            left: isMobileFightLayout ? 8 : 42,
            right: isMobileFightLayout ? 8 : 42,
            bottom: isMobileFightLayout ? 7 : 42,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            pointerEvents: "none",
            transform: isMobileFightLayout ? `scale(${staminaScale})` : undefined,
            transformOrigin: "bottom center",
          }}
        >
          <StaminaGauge stamina={game.p1.stamina} maxStamina={game.p1.maxStamina} />
          <StaminaGauge stamina={game.p2.stamina} maxStamina={game.p2.maxStamina} reverse />
        </div>

        <ComboReadout comboHud={comboHud} />
        <DamagePopups popups={combatPopups} />
        <SystemAlerts alerts={systemAlerts} />
        <CriticalFlash nonce={redFlashNonce} />
        <RoundFlowOverlay flow={roundFlow} game={game} matchSettings={matchSettings} />

        {!isMobileFightLayout && (
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 30,
              color: "rgba(255,255,255,0.75)",
              fontFamily: "Impact, fantasy",
              letterSpacing: "1px",
              fontSize: "14px",
              pointerEvents: "none",
            }}
          >
            ESC: PAUSE
          </div>
        )}

        {!isMobileFightLayout && pauseMenu}

        {game.roundOver && (
          <RoundResultOverlay
            game={game}
            matchSettings={matchSettings}
            roundStats={roundStats}
            onRunBack={() => resetMatch()}
            onMenu={backToMenu}
            onNextStory={startNextStoryFight}
            hasNextStory={hasNextStoryOpponent()}
          />
        )}
      </div>

      {isMobileFightLayout && (
        <MobileFightControls
          onHold={setP1TouchHold}
          onAttack={tapP1TouchAttack}
          onTaunt={tapP1TouchTaunt}
          onPause={toggleMobilePause}
          disabled={mobileStagePaused}
        />
      )}

      {isMobileFightLayout && pauseMenu}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  GLB Fighter — animation controller
//
//  Smooth-animation rules (unchanged from previous pass):
//  1. Never call mixer.stopAllAction() — use crossFadeFrom() instead.
//  2. Set LoopOnce / clampWhenFinished BEFORE play().
//  3. "finished" listener auto-returns one-shots to idle.
//  4. timeScale calibrated from real frame counts.
//  5. Crossfade duration tuned per move type.
//
//  New this pass:
//  6. "block" is a looping action (held state), not LOOP_ONCE.
//     It gets a short crossfade in AND out for a smooth guard raise/lower.
// ─────────────────────────────────────────────────────────────────────────────

const LOOP_ONCE_SET = new Set([
  "punch1", "punch2", "punch3", "punch4",
  "heavyPunch1", "heavyPunch2", "heavyAttack3",
  "kick1", "kick2", "kick3", "kick4",
  "heavyKick1", "heavyKick2", "heavyKick3",
  "punchReaction", "punch2Reaction", "punch3Reaction", "kickReaction", "heavyPunchReaction", "heavyKickReaction", "heavyHitAttackReaction", "standingReaction", "flyingBackDamageReaction", "getUpAfterDamage", "faceHit", "stunned",
  "jump",
  // "die" → intentionally excluded (stays clamped on last frame)
  // "block" → intentionally excluded (loops while Shift is held)
]);

function isOneShotAction(key) {
  return LOOP_ONCE_SET.has(key) || key === "die";
}

function crossfadeDuration(key) {
  if (!key) return 0.10;
  if (key === "block") return 0.12;
  if (key === "punchReaction" || key === "punch2Reaction" || key === "punch3Reaction" || key === "heavyPunchReaction") return 0.065;
  if (key === "kickReaction") return 0.11;
  if (key === "heavyKickReaction" || key === "heavyHitAttackReaction") return 0.13;
  if (key === "standingReaction") return 0.075;
  if (key === "flyingBackDamageReaction") return 0.22;
  if (key === "getUpAfterDamage") return 0.28;
  if (key === "punch1" || key === "punch2" || key === "kick1" || key === "kick2") return 0.07;
  if (key === "punch3" || key === "kick3") return 0.095;
  if (key === "heavyKick1" || key === "heavyKick3" || key === "heavyKick2") return 0.07;
  if (key.startsWith("heavy")) return 0.105;
  if (key === "stunned") return 0.14;
  if (key === "die") return 0.16;
  return 0.10;
}

function stabilizedRootMotionClip(clip, key) {
  // Back to original placements: do not rewrite root-motion tracks.
  // The FBX should control its own vertical pose so get-up does not ghost through the floor.
  return clip;
}

const animationClipCache = new Map();

function loadAnimationClip(key, url) {
  const cacheKey = url;
  if (animationClipCache.has(cacheKey)) return animationClipCache.get(cacheKey);

  const promise = new Promise((resolve) => {
    const loader = /\.fbx$/i.test(url) ? new FBXLoader() : new GLTFLoader();
    loader.load(
      url,
      (result) => {
        const clip = result.animations?.[0] ?? result.scene?.animations?.[0];
        if (!clip) {
          console.warn(`[anim] no clip found for "${key}" from ${url}`);
          resolve(null);
          return;
        }
        resolve(clip);
      },
      undefined,
      (err) => {
        console.warn(`[anim] failed "${key}" from ${url}:`, err);
        resolve(null);
      }
    );
  });

  animationClipCache.set(cacheKey, promise);
  return promise;
}

function orderedAnimationEntries(animationUrls) {
  const entries = Object.entries(animationUrls);
  const priority = ANIMATION_LOAD_PRIORITY
    .filter(key => animationUrls[key])
    .map(key => [key, animationUrls[key]]);
  const priorityKeys = new Set(priority.map(([key]) => key));
  const deferred = entries.filter(([key]) => !priorityKeys.has(key));
  return { priority, deferred };
}

function resolvePlayableActionKey(actionMap, key) {
  if (actionMap[key]) return key;
  if (key === "die") {
    if (actionMap.stunned) return "stunned";
    if (actionMap.heavyKickReaction) return "heavyKickReaction";
  }
  if (key === "heavyAttack3" && actionMap.heavyPunch2 && !actionMap.heavyAttack3) return "heavyPunch2";
  if (key === "punch4" && actionMap.punch3 && !actionMap.punch4) return "punch3";
  if (key === "kick4" && actionMap.kick3 && !actionMap.kick4) return "kick3";
  if (key === "kick3" && actionMap.kick2 && !actionMap.kick3) return "kick2";
  if (key === "heavyKick3" && actionMap.heavyKick2 && !actionMap.heavyKick3) return "heavyKick2";
  if (key === "heavyKick2" && actionMap.heavyKick1 && !actionMap.heavyKick2) return "heavyKick1";
  if (key === "heavyPunch2" && actionMap.heavyPunch1 && !actionMap.heavyPunch2) return "heavyPunch1";
  if (key === "heavyPunchReaction" && actionMap.heavyKickReaction && !actionMap.heavyPunchReaction) return "heavyKickReaction";
  if (key === "heavyHitAttackReaction" || key === "stunned") {
    if (actionMap.heavyKickReaction) return "heavyKickReaction";
    if (actionMap.punchReaction) return "punchReaction";
    if (actionMap.standingReaction) return "standingReaction";
  }
  return actionMap.idle ? "idle" : key;
}

function getCharacterModelUrl(characterId = "skitz") {
  if (characterId === "jose") return JOSE_MODEL_URL;
  if (characterId === "mockv") return MOCKV_MODEL_URL;
  if (characterId === "xtra") return XTRA_MODEL_URL;
  if (characterId === "terrorEast") return TERROR_EAST_MODEL_URL;
  if (characterId === "reign") return REIGN_MODEL_URL;
  return MODEL_URL;
}

function getCharacterModelLoader(characterId = "skitz") {
  return characterId === "skitz" ? GLTFLoader : FBXLoader;
}

function GLBFighter({ fighter, opponent, hitStopEvent, stageId = "default" }) {
  const characterId = fighter.characterId ?? "skitz";
  const stagePlacement = useMemo(() => getStageFighterPlacement(stageId), [stageId]);
  const visualTuning = useMemo(() => getStageCharacterVisualTuning(stageId, characterId), [stageId, characterId]);
  const modelUrl = useMemo(() => getCharacterModelUrl(characterId), [characterId]);
  const ModelLoader = useMemo(() => getCharacterModelLoader(characterId), [characterId]);
  const baseAsset = useLoader(ModelLoader, modelUrl);
  const skitzTexture = useLoader(THREE.TextureLoader, characterId === "skitz" ? SKITZ_TEXTURE_URL : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lYzQ8wAAAABJRU5ErkJggg==");
  const animationUrls = useMemo(() => getAnimationUrls(characterId), [characterId]);
  const model = useMemo(() => {
    const root = characterId === "skitz" ? baseAsset.scene : baseAsset;
    const cloned = SkeletonUtils.clone(root);
    cloned.position.set(0, 0, 0);
    cloned.rotation.set(0, 0, 0);
    cloned.scale.setScalar(1);
    const targetHeight = characterId === "jose"
      ? COMBAT_TARGET_HEIGHT.jose
      : characterId === "mockv"
        ? COMBAT_TARGET_HEIGHT.mockv
        : characterId === "xtra"
          ? COMBAT_TARGET_HEIGHT.xtra
          : characterId === "terrorEast"
            ? COMBAT_TARGET_HEIGHT.terrorEast
            : characterId === "reign"
              ? COMBAT_TARGET_HEIGHT.reign
              : COMBAT_TARGET_HEIGHT.skitz;
    const fit = getAutoFitScaleAndFloorOffset(cloned, targetHeight * (stagePlacement.scale ?? 1) * (visualTuning.heightScale ?? 1));
    cloned.scale.setScalar(fit.scale);
    cloned.userData.floorOffset = getStageModelFloorOffset(stageId, characterId, fit.floorOffset);
    cloned.userData.stageYOffset = visualTuning.yOffset ?? 0;
    cloned.userData.stageZOffset = visualTuning.zOffset ?? 0;
    return cloned;
  }, [baseAsset, characterId, stageId, stagePlacement.scale, visualTuning.heightScale, visualTuning.yOffset, visualTuning.zOffset]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);

  useEffect(() => {
    if (characterId === "skitz") applySkitzTextureToCombatModel(model, skitzTexture);
    if (characterId === "jose") brightenJoseModel(model);
    if (characterId === "mockv") brightenMockvModel(model);
    if (characterId === "xtra") brightenXtraModel(model);
    if (characterId === "terrorEast") brightenTerrorEastModel(model);
    if (characterId === "reign") brightenReignModel(model);
  }, [model, skitzTexture, characterId]);

  const actions    = useRef({});
  const activeKey  = useRef(null);
  const lastNonce  = useRef(-1);
  const hitStopUntil = useRef(0);
  const visualYOffset = useRef(0);
  const loadedRef = useRef(false);
  const loadingActions = useRef({});
  const animationLoadGeneration = useRef(0);

  useEffect(() => {
    if (!hitStopEvent?.id) return;
    hitStopUntil.current = performance.now() + (hitStopEvent.critical ? HIT_STOP_MS * 1.8 : HIT_STOP_MS);
  }, [hitStopEvent]);

  // FBX clips can arrive at different times. This version keeps idle alive,
  // then safely swaps into any action that has loaded. Missing/new files no longer
  // kill the animation controller or leave the model sliding with no pose changes.
  function registerLoadedAction(key, clip) {
    if (!clip) return null;
    const preparedClip = stabilizedRootMotionClip(clip.clone(), key);
    preparedClip.name = key;
    const action = mixer.clipAction(preparedClip);
    const expectedDuration = animDuration(key, characterId);
    const baseScale = shouldUseExportedAnimationSpeed(characterId, key)
      ? 1
      : (preparedClip.duration > 0 && expectedDuration > 0 && Math.abs(preparedClip.duration - expectedDuration) > 0.05)
        ? preparedClip.duration / expectedDuration
        : 1;

    action.enabled = true;
    action.setEffectiveWeight(1);
    action.setEffectiveTimeScale(baseScale);
    action.userData = { ...(action.userData ?? {}), baseTimeScale: baseScale };
    actions.current[key] = action;

    if (key === "idle" && !activeKey.current) {
      action.setLoop(THREE.LoopRepeat);
      action.clampWhenFinished = false;
      action.reset().fadeIn(0.05).play();
      activeKey.current = "idle";
      lastNonce.current = fighter.actionNonce ?? 0;
    }

    return action;
  }

  function loadAnimationKey(key, generation = animationLoadGeneration.current) {
    const url = animationUrls[key];
    if (!url) return Promise.resolve(null);
    if (actions.current[key]) return Promise.resolve(actions.current[key]);
    if (loadingActions.current[key]) return loadingActions.current[key];

    const promise = loadAnimationClip(key, url).then((clip) => {
      if (generation !== animationLoadGeneration.current) return null;
      return registerLoadedAction(key, clip);
    });
    loadingActions.current[key] = promise;
    return promise;
  }

  useEffect(() => {
    let cancelled = false;
    const generation = animationLoadGeneration.current + 1;
    animationLoadGeneration.current = generation;
    actions.current = {};
    loadingActions.current = {};
    activeKey.current = null;
    loadedRef.current = false;
    lastNonce.current = -1;

    const { priority, deferred } = orderedAnimationEntries(animationUrls);

    async function loadBatch(entries, size = 2, delayMs = 70) {
      for (let i = 0; i < entries.length && !cancelled; i += size) {
        await Promise.all(entries.slice(i, i + size).map(([key]) => loadAnimationKey(key, generation)));
        if (delayMs) await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    loadBatch(priority, 2, 60).then(() => {
      loadedRef.current = true;
      if (!cancelled && actions.current.idle && (!activeKey.current || fighter.lastAction === "idle")) {
        transitionTo("idle", true);
        lastNonce.current = fighter.actionNonce ?? 0;
      }
      window.setTimeout(() => {
        if (!cancelled) loadBatch(deferred, 1, 120);
      }, 360);
    });

    const onFinished = (e) => {
      const finishedKey = e.action.getClip().name;
      if (finishedKey === "die" || finishedKey === "flyingBackDamageReaction") return;

      if (LOOP_ONCE_SET.has(finishedKey) && activeKey.current === finishedKey) {
        transitionTo("idle", true);
      }
    };

    mixer.addEventListener("finished", onFinished);
    return () => {
      cancelled = true;
      animationLoadGeneration.current += 1;
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
    };
  }, [mixer, model, animationUrls, characterId]);

  function configureAction(action, key) {
    const rawBaseScale = action.userData?.baseTimeScale ?? 1;
    // Jose should not be slowed/retimed here. His folder files are already swapped
    // into the right combo order, so play every Jose FBX at normal exported speed.
    const baseScale = shouldUseExportedAnimationSpeed(characterId, key) ? 1 : rawBaseScale;
    const slowScale = (characterId === "jose" || characterId === "mockv" || characterId === "xtra" || characterId === "terrorEast" || characterId === "reign")
      ? 1
      : key === "kickReaction"
      ? KICK_REACTION_SLOW_SCALE
      : key === "heavyHitAttackReaction"
        ? 0.94
      : key === "flyingBackDamageReaction"
        ? 0.92
        : key === "getUpAfterDamage"
          ? 0.88
          : 1;

    action.enabled = true;
    action.setEffectiveWeight(1);
    action.setEffectiveTimeScale(baseScale * slowScale);

    if (isOneShotAction(key)) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat);
      action.clampWhenFinished = false;
    }
  }

  function transitionTo(nextKey, force = false) {
    const safeKey = actions.current[nextKey] ? nextKey : "idle";
    const nextAction = actions.current[safeKey];
    if (!nextAction) return;

    const currentKey = activeKey.current;
    const prevAction = currentKey ? actions.current[currentKey] : null;
    if (!force && currentKey === safeKey && !LOOP_ONCE_SET.has(safeKey)) return;

    configureAction(nextAction, safeKey);
    const fadeDur = force ? 0.04 : crossfadeDuration(safeKey);

    nextAction.reset();
    nextAction.play();

    if (prevAction && prevAction !== nextAction) {
      // Do not warp time. Warping was making some FBX clips appear frozen/sliding.
      nextAction.crossFadeFrom(prevAction, fadeDur, false);
    } else {
      nextAction.fadeIn(fadeDur);
    }

    activeKey.current = safeKey;
  }

  useFrame((_, delta) => {
    const now = performance.now();
    const currentAnimKey = activeKey.current;
    // Hit-stop stays visual for Skitz, but Jose's new FBX chain felt like slow-mo.
    // Keep Jose's mixer at full speed so heavykick1 -> heavykick3 -> heavykick2 stays smooth.
    const shouldSlowForHitStop = characterId !== "jose" && characterId !== "mockv" && characterId !== "xtra" && now < hitStopUntil.current;
    mixer.update(shouldSlowForHitStop ? delta * 0.55 : delta);

    const targetYOffset = KNOCKDOWN_VISUAL_Y_OFFSET[fighter.lastAction] ?? 0;
    // Smooth the offset so Flyingback -> GetUp -> Idle does not pop or teleport.
    visualYOffset.current = THREE.MathUtils.lerp(visualYOffset.current, targetYOffset, Math.min(1, delta * 10));

    const stageFloorLift = getStageFloorLift(stageId, fighter.x);
    model.position.set(
      fighter.x,
      (fighter.y || 0) + (model.userData.floorOffset || 0) + (model.userData.stageYOffset || 0) + visualYOffset.current + stagePlacement.y + stageFloorLift,
      stagePlacement.z + (model.userData.stageZOffset || 0)
    );
    model.rotation.y = fighter.x < opponent.x ? Math.PI / 2 : -Math.PI / 2;

    const requestedKey = fighter.lastAction;
    if (requestedKey && requestedKey !== "idle" && !actions.current[requestedKey] && animationUrls[requestedKey]) {
      loadAnimationKey(requestedKey);
    }
    const desiredKey = resolvePlayableActionKey(actions.current, requestedKey);
    const nonce = fighter.actionNonce ?? 0;
    const keyChanged = desiredKey !== activeKey.current;
    const nonceChanged = nonce !== lastNonce.current;
    const desiredIsOneShot = isOneShotAction(desiredKey);
    const usingFallbackIdle = desiredKey === "idle" && requestedKey !== "idle" && !actions.current[requestedKey];

    if (desiredIsOneShot) {
      if (nonceChanged) {
        transitionTo(desiredKey, LOOP_ONCE_SET.has(desiredKey));
        lastNonce.current = nonce;
      }
    } else if (keyChanged) {
      transitionTo(desiredKey);
      if (!usingFallbackIdle) lastNonce.current = nonce;
    } else if (nonceChanged && !usingFallbackIdle && requestedKey === desiredKey && !ATTACK_ACTION_SET.has(requestedKey)) {
      lastNonce.current = nonce;
    }

    // If idle somehow never started because the file loaded late, recover automatically.
    if (!activeKey.current && actions.current.idle) {
      transitionTo("idle", true);
    }
  });

  return <primitive object={model} />;
}

// ─────────────────────────────────────────────
//  Movement helpers
// ─────────────────────────────────────────────
const JUMP_LAUNCH_VELOCITY = 0.255;
const JUMP_GRAVITY = 0.0094;
const JUMP_FORWARD_IMPULSE = 0.046;
const AIR_CONTROL_ACCEL = 0.0085;
const AIR_MAX_SPEED = 0.145;
const AIR_DAMPING = 0.975;

function getHorizontalMovementInput(keys, ctrls) {
  const leftHeld = !!keys[ctrls.left];
  const rightHeld = !!keys[ctrls.right];
  if (leftHeld === rightHeld) return 0;
  return rightHeld ? 1 : -1;
}

function isHoldingForward(keys, ctrls, facingRight) {
  const input = getHorizontalMovementInput(keys, ctrls);
  if (!input) return false;
  return facingRight ? input > 0 : input < 0;
}

function updateFighterMovement(f, opp, keys, locked, ctrls, isStunned = false) {
  const friction    = 0.82;
  const accel       = 0.015;
  const facingRight = f.x < opp.x;
  const horizontalInput = getHorizontalMovementInput(keys, ctrls);

  const isAttacking = ATTACK_ACTION_SET.has(f.lastAction);
  const canDriftDuringAttack = locked && isAttacking && f.grounded && f.hp > 0;

  f.crouching = !isStunned && !!keys[ctrls.crouch] && !canDriftDuringAttack;

  // ── Blocking: Shift/down held + grounded + not locked in an attack ──
  // Attacks can drift forward/back, but they cannot turn into block mid-swing.
  const wantsBlock = !isStunned && !!keys[ctrls.block] && f.grounded && !locked && f.hp > 0;
  f.blocking = isStunned ? false : wantsBlock;

  if ((!locked || canDriftDuringAttack) && !wantsBlock && f.hp > 0) {
    const moveAccel = canDriftDuringAttack ? accel * ATTACK_DRIFT_MULTIPLIER : accel;
    f.vx += horizontalInput * moveAccel;
    if (!canDriftDuringAttack && keys[ctrls.jump] && f.grounded) {
      f.vx = THREE.MathUtils.clamp((f.vx || 0) + horizontalInput * JUMP_FORWARD_IMPULSE, -AIR_MAX_SPEED, AIR_MAX_SPEED);
      f.vy = JUMP_LAUNCH_VELOCITY;
      f.grounded = false;
      f.lastAction = "jump";
      f.actionNonce++;
    }
  }

  if (!f.grounded && !locked && !wantsBlock && !isStunned && f.hp > 0) {
    f.vx += horizontalInput * AIR_CONTROL_ACCEL;
    f.vx = THREE.MathUtils.clamp(f.vx || 0, -AIR_MAX_SPEED, AIR_MAX_SPEED);
  }

  f.x  += f.vx || 0;
  f.vx *= f.grounded ? (ATTACK_ACTION_SET.has(f.lastAction) ? 0.91 : friction) : AIR_DAMPING;

  if (!f.grounded) {
    f.y  += f.vy;
    f.vy -= JUMP_GRAVITY;
    if (f.y <= 0) { f.y = 0; f.grounded = true; }
  }

  // Resolve animation state — blocking takes priority over movement
  if (!locked && f.hp > 0) {
    if (wantsBlock)                    f.lastAction = "block";
    else if (!f.grounded)              f.lastAction = "jump";
    else if (f.crouching)              f.lastAction = "crouch";
    else if (Math.abs(f.vx) > 0.01)   f.lastAction = (f.vx * (facingRight ? 1 : -1) > 0) ? "walk" : "back";
    else                               f.lastAction = "idle";
  }
}

function resolveBodySpacing(p1, p2, stageId = "default") {
  const gap = Math.abs(p1.x - p2.x);
  const eitherAirborne = !p1.grounded || !p2.grounded;
  const minBodyGap = getStageBodyGap(stageId);

  // On the ground, keep bodies separated. In the air, let players jump over each other
  // so they can escape corner/wall pressure like a real fighter.
  if (!eitherAirborne && gap < minBodyGap) {
    const push   = (minBodyGap - gap) / 2;
    const p1Left = p1.x < p2.x;
    p1.x += p1Left ? -push :  push;
    p2.x += p1Left ?  push : -push;
  }

  // Keep fighters inside the playable stage so spacing stays readable.
  const bounds = getStageBounds(stageId);
  p1.x = THREE.MathUtils.clamp(p1.x, bounds.min, bounds.max);
  p2.x = THREE.MathUtils.clamp(p2.x, bounds.min, bounds.max);
}

// ─────────────────────────────────────────────
//  Scene + Stage
// ─────────────────────────────────────────────
function FightScene({ game, visualEffects, shakeEvent, hitStopEvent, stageId = "default", mobile = false }) {
  const { camera } = useThree();
  const shakeRef = useRef({ id: 0, start: 0, until: 0, power: 0, critical: false });

  useEffect(() => {
    camera.fov = stageId === "daBull" ? 47 : stageId === "skatebowl" ? 58 : 42;
    camera.updateProjectionMatrix();
  }, [camera, stageId]);

  useEffect(() => {
    if (!shakeEvent?.id) return;
    const duration = shakeEvent.critical ? CRITICAL_SHAKE_MS : SCREEN_SHAKE_MS;
    const now = performance.now();
    shakeRef.current = {
      id: shakeEvent.id,
      start: now,
      until: now + duration,
      power: Math.min(shakeEvent.power || 0.12, shakeEvent.critical ? 0.28 : 0.19),
      critical: !!shakeEvent.critical,
    };
  }, [shakeEvent]);

  useFrame(() => {
    const isRedBullDys = stageId === "redbulldys";
    const isSkateBowl = stageId === "skatebowl";
    const isNcGraffiti = stageId === "ncGraffiti";
    const isDaBull = stageId === "daBull";
    const midX = (game.p1.x + game.p2.x) / 2;
    const cameraX = isDaBull ? midX : midX;
    const lookAtX = isDaBull ? midX : midX;
    const distance = Math.abs(game.p1.x - game.p2.x);
    const p1Low = ((game.p1.hp / Math.max(1, game.p1.maxHp ?? 100)) * 100) <= LOW_HEALTH_CAMERA_THRESHOLD;
    const p2Low = ((game.p2.hp / Math.max(1, game.p2.maxHp ?? 100)) * 100) <= LOW_HEALTH_CAMERA_THRESHOLD;
    const lowHealthPressure = p1Low || p2Low;
    const basePosition = isRedBullDys
      ? new THREE.Vector3(cameraX, 6.45, 7.05 + distance * 0.12 - (lowHealthPressure ? LOW_HEALTH_ZOOM_AMOUNT * 0.45 : 0))
      : isSkateBowl
        ? new THREE.Vector3(cameraX, 1.74, 3.08 + distance * 0.08 - (lowHealthPressure ? LOW_HEALTH_ZOOM_AMOUNT * 0.26 : 0))
        : isNcGraffiti
          ? new THREE.Vector3(cameraX, 1.28, -4.35 + distance * 0.16 - (lowHealthPressure ? LOW_HEALTH_ZOOM_AMOUNT * 0.3 : 0))
        : isDaBull
          ? new THREE.Vector3(cameraX, 1.58, 0.68 + distance * 0.024 - (lowHealthPressure ? LOW_HEALTH_ZOOM_AMOUNT * 0.28 : 0))
          : new THREE.Vector3(cameraX, 1.6, 6.5 + distance * 0.15 - (lowHealthPressure ? LOW_HEALTH_ZOOM_AMOUNT : 0));

    if (performance.now() < shakeRef.current.until && shakeRef.current.critical) {
      const now = performance.now();
      const remaining = Math.max(0, shakeRef.current.until - now);
      const zoomFalloff = Math.min(1, remaining / CRITICAL_ZOOM_MS);
      basePosition.z -= CRITICAL_ZOOM_AMOUNT * zoomFalloff;
      basePosition.y -= (isRedBullDys ? 0.03 : 0.08) * zoomFalloff;
    }

    if (lowHealthPressure) {
      const pressurePulse = 0.025 + Math.sin(performance.now() * 0.018) * 0.012;
      basePosition.x += (Math.random() - 0.5) * pressurePulse;
      basePosition.y += (Math.random() - 0.5) * pressurePulse * 0.55;
    }

    if (performance.now() < shakeRef.current.until) {
      const now = performance.now();
      const remaining = Math.max(0, shakeRef.current.until - now);
      const duration = shakeRef.current.critical ? CRITICAL_SHAKE_MS : SCREEN_SHAKE_MS;
      const falloff = Math.min(1, remaining / duration);
      const strength = shakeRef.current.power * falloff;

      // Old-school dramatic shake, but without remounting Canvas.
      // The offsets are clamped so the camera never snaps behind/inside the stage.
      basePosition.x += THREE.MathUtils.clamp((Math.random() - 0.5) * strength * 2.2, -0.27, 0.27);
      basePosition.y += THREE.MathUtils.clamp((Math.random() - 0.5) * strength * 1.45, -0.17, 0.17);
      basePosition.z += THREE.MathUtils.clamp((Math.random() - 0.5) * strength * 0.85, -0.14, 0.14);
    }

    camera.position.lerp(basePosition, isRedBullDys ? 0.18 : isSkateBowl ? 0.2 : isDaBull ? 0.22 : 0.24);
    camera.lookAt(
      lookAtX,
      isRedBullDys ? 0.25 : isSkateBowl ? 0.9 : isNcGraffiti ? 1.06 : isDaBull ? 1.34 : 1.2,
      isRedBullDys ? 0.36 : isSkateBowl ? 0.16 : isNcGraffiti ? -11.1 : isDaBull ? -1.72 : 0,
    );
  });
  return (
    <>
      <StageLighting stageId={stageId} />
      <Suspense fallback={null}>
        <Stage stageId={stageId} />
      </Suspense>
      <VisualEffects effects={visualEffects} />
      <Suspense fallback={null}>
        <GLBFighter fighter={game.p1} opponent={game.p2} hitStopEvent={hitStopEvent} stageId={stageId} />
      </Suspense>
      <Suspense fallback={null}>
        <GLBFighter fighter={game.p2} opponent={game.p1} hitStopEvent={hitStopEvent} stageId={stageId} />
      </Suspense>
    </>
  );
}

function StageLighting({ stageId }) {
  if (stageId === "redbulldys") {
    return (
      <>
        <ambientLight intensity={0.72} color="#d7e2ff" />
        <hemisphereLight args={["#b7ceff", "#150407", 1.15]} />
        <directionalLight position={[0, 8.5, 3.2]} intensity={1.9} color="#fff6d8" />
        <spotLight position={[0, 8.2, 1.2]} intensity={7.6} color="#fff9e8" angle={0.62} penumbra={0.78} distance={12} />
        <spotLight position={[-5.6, 5.2, 2.4]} intensity={4.2} color="#236bff" angle={0.56} penumbra={0.82} distance={11} />
        <spotLight position={[5.6, 5.2, 2.4]} intensity={4.0} color="#ff1e39" angle={0.56} penumbra={0.82} distance={11} />
        <pointLight position={[0, 2.4, -2.4]} intensity={2.8} color="#ffcf6b" distance={9} />
      </>
    );
  }

  if (stageId === "skatebowl") {
    return (
      <>
        <ambientLight intensity={0.84} color="#d5e2ff" />
        <hemisphereLight args={["#c9d9ff", "#2a1b16", 1.05]} />
        <directionalLight position={[-3.8, 5.6, 3.2]} intensity={1.55} color="#fff1cf" />
        <spotLight position={[0, 5.8, 2.2]} intensity={4.5} color="#fff7e0" angle={0.72} penumbra={0.86} distance={11} />
        <pointLight position={[-5.2, 2.2, -2.6]} intensity={2.4} color="#ffcf6b" distance={7.5} />
        <pointLight position={[5.2, 2.25, -2.2]} intensity={2.0} color="#9ed7ff" distance={7.5} />
      </>
    );
  }

  if (stageId === "ncGraffiti") {
    return (
      <>
        <ambientLight intensity={0.9} color="#d6d8e4" />
        <hemisphereLight args={["#d9e5ff", "#160c13", 1.05]} />
        <directionalLight position={[-4.2, 4.6, 3.4]} intensity={1.65} color="#fff0cc" />
        <spotLight position={[0, 4.7, 2.8]} intensity={3.9} color="#fff8df" angle={0.68} penumbra={0.82} distance={10} />
        <pointLight position={[-4.5, 2.0, -2.1]} intensity={2.1} color="#ff4f9a" distance={7.2} />
        <pointLight position={[4.7, 2.1, -2.1]} intensity={1.9} color="#50dfff" distance={7.2} />
      </>
    );
  }

  if (stageId === "daBull") {
    return (
      <>
        <ambientLight intensity={0.78} color="#d6d3cb" />
        <hemisphereLight args={["#dce7ff", "#1d0d09", 0.95]} />
        <directionalLight position={[-5.8, 4.4, 3.8]} intensity={1.45} color="#ffe6b6" />
        <spotLight position={[0, 5.2, 2.4]} intensity={4.8} color="#fff2ce" angle={0.66} penumbra={0.84} distance={11.5} />
        <pointLight position={[0, 2.7, -2.9]} intensity={3.0} color="#ffbd57" distance={8.8} />
        <pointLight position={[-5.4, 2.3, -1.7]} intensity={1.8} color="#f25536" distance={7.5} />
        <pointLight position={[5.4, 2.4, -1.7]} intensity={1.65} color="#2f74ff" distance={7.5} />
      </>
    );
  }

  if (stageId === "wafflehouse") {
    return (
      <>
        <ambientLight intensity={0.86} color="#b0b8c8" />
        <hemisphereLight args={["#c7d7ff", "#1a1008", 1.0]} />
        <directionalLight position={[-6.5, 2.2, -5.4]} intensity={1.28} color="#ff914f" />
        <directionalLight position={[-4.5, 5.5, 3.5]} intensity={0.9} color="#c9ddff" />
        <pointLight position={[-3.9, 2.45, -3.2]} intensity={3.3} color="#ffc74f" distance={8.5} />
        <pointLight position={[0.1, 2.8, -3.7]} intensity={3.7} color="#fff1b5" distance={9.5} />
        <pointLight position={[4.2, 2.2, -3.2]} intensity={2.9} color="#ffd36a" distance={8} />
        <pointLight position={[-5.2, 3.2, 1.55]} intensity={6.4} color="#fff2bf" distance={7.2} />
        <pointLight position={[5.65, 3.15, 0.65]} intensity={5.4} color="#fff2bf" distance={7} />
        <spotLight position={[0, 5.2, 2.6]} intensity={4.1} color="#f7fbff" angle={0.62} penumbra={0.85} distance={9.5} />
      </>
    );
  }

  return (
    <>
      <ambientLight intensity={1.18} />
      <hemisphereLight args={["#ffffff", "#2b1830", 1.55]} />
      <directionalLight position={[0, 4.8, 4.5]} intensity={2.7} color="#fff7de" />
      <directionalLight position={[-4.5, 3.5, 3.2]} intensity={1.25} color="#9feeff" />
      <pointLight position={[0, 2.2, 2.5]} intensity={3.3} color="#ffffff" distance={8} />
      <spotLight position={[0, 5, -8]} intensity={8.5} color="#ffffff" angle={0.72} penumbra={1} />
    </>
  );
}

function VisualEffects({ effects }) {
  return (
    <group>
      {effects.map(effect => (
        <HitBurst key={effect.id} effect={effect} />
      ))}
    </group>
  );
}

function HitBurst({ effect }) {
  const group = useRef();
  const particles = useMemo(() => {
    const isBlood = effect.type === "blood" || effect.type === "criticalBlood";
    const isClash = effect.type === "clashSpark";
    const count = isBlood ? (effect.type === "criticalBlood" ? 30 : 20) : isClash ? 22 : 10;
    const sizeScale = effect.sizeScale ?? 1;
    return Array.from({ length: count }, (_, i) => {
      const isDrip = isBlood && Math.random() > 0.58;
      return {
        id: i,
        isDrip,
        angle: (Math.PI * 2 * i) / count + Math.random() * 0.9,
        speed: (isDrip ? 0.08 + Math.random() * 0.22 : isClash ? 0.48 + Math.random() * 0.86 : 0.28 + Math.random() * 0.75) * sizeScale,
        size: (isBlood ? 0.025 + Math.random() * (effect.type === "criticalBlood" ? 0.07 : 0.05) : isClash ? 0.024 + Math.random() * 0.042 : 0.025 + Math.random() * 0.025) * sizeScale,
        height: (isDrip ? 0.08 + Math.random() * 0.22 : isClash ? Math.random() * 0.28 : Math.random() * 0.45) * sizeScale,
        dark: Math.random() > 0.45,
      };
    });
  }, [effect.id, effect.type, effect.sizeScale]);

  useFrame(() => {
    if (!group.current) return;
    const lifetime = effect.type === "blockSpark" || effect.type === "clashSpark" ? BLOOD_LIFETIME_MS : BLOOD_DRIP_LIFETIME_MS;
    const age = Math.min(1, (performance.now() - effect.createdAt) / lifetime);
    group.current.position.set(effect.x + effect.dir * age * 0.28, effect.y + age * 0.18, effect.z);
    group.current.scale.setScalar(1 + age * 0.18);
    group.current.children.forEach((child, index) => {
      const p = particles[index];
      if (!p) return;
      const gravity = p.isDrip ? 0.85 : 0.36;
      child.position.set(
        Math.cos(p.angle) * p.speed * age * effect.dir,
        p.height + Math.sin(p.angle) * p.speed * age - age * age * gravity,
        Math.sin(p.angle) * 0.16 * age
      );
      child.scale.y = p.isDrip ? 1.9 + age * 1.8 : 1;
      child.material.opacity = Math.max(0, 1 - age * (p.isDrip ? 0.72 : 1));
    });
  });

  const isBlood = effect.type === "blood" || effect.type === "criticalBlood";
  const isClash = effect.type === "clashSpark";
  const color = isBlood ? "#7f0010" : isClash ? "#ffe16a" : "#65d9ff";

  return (
    <group ref={group} position={[effect.x, effect.y, effect.z]}>
      {particles.map(p => (
        <mesh key={p.id}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={isBlood && p.dark ? "#4b0008" : isClash && p.dark ? "#ffffff" : color} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

function Stage({ stageId = "default" }) {
  if (stageId === "wafflehouse") return <WaffleHouseStage />;
  if (stageId === "redbulldys") return <RedBullDysStage />;
  if (stageId === "skatebowl") return <SkateBowlStage />;
  if (stageId === "ncGraffiti") return <NCGraffitiStage />;
  if (stageId === "daBull") return <DaBullStage />;
  return <DefaultStage />;
}

function RedBullDysEnvironment() {
  const { scene } = useThree();

  useEffect(() => {
    const previousBackground = scene.background;
    scene.background = new THREE.Color("#04060b");
    return () => {
      scene.background = previousBackground;
    };
  }, [scene]);

  return null;
}

function RedBullDysModel() {
  const baseGltf = useLoader(GLTFLoader, REDBULL_DYS_RUNTIME_MODEL_URL);
  const colorMap = useLoader(THREE.TextureLoader, REDBULL_DYS_TEXTURE_URL);
  const emissiveMap = useLoader(THREE.TextureLoader, REDBULL_DYS_EMISSIVE_URL);
  const metalnessMap = useLoader(THREE.TextureLoader, REDBULL_DYS_METALLIC_URL);
  const roughnessMap = useLoader(THREE.TextureLoader, REDBULL_DYS_ROUGHNESS_URL);
  const normalMap = useLoader(THREE.TextureLoader, REDBULL_DYS_NORMAL_URL);
  const model = useMemo(() => SkeletonUtils.clone(baseGltf.scene), [baseGltf]);

  useEffect(() => {
    const allMaps = [colorMap, emissiveMap, metalnessMap, roughnessMap, normalMap];
    allMaps.forEach((texture) => {
      texture.flipY = true;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    });
    colorMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.colorSpace = THREE.SRGBColorSpace;

    model.scale.setScalar(1);
    model.rotation.set(0, 0, 0);
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);

    const rawBox = new THREE.Box3().setFromObject(model);
    const rawSize = new THREE.Vector3();
    rawBox.getSize(rawSize);
    const fitScale = Math.min(
      rawSize.x > 0 ? 25.5 / rawSize.x : 0.08,
      rawSize.z > 0 ? 19.5 / rawSize.z : 0.08,
      rawSize.y > 0 ? 7.2 / rawSize.y : 0.08,
    );
    model.scale.setScalar(Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 0.08);

    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      child.castShadow = false;
      child.receiveShadow = true;

      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const nextMaterials = sourceMaterials.map((material) => {
        const nextMaterial = material.clone();
        nextMaterial.map = colorMap;
        nextMaterial.emissiveMap = emissiveMap;
        nextMaterial.metalnessMap = metalnessMap;
        nextMaterial.roughnessMap = roughnessMap;
        nextMaterial.normalMap = normalMap;
        if (nextMaterial.color) nextMaterial.color.set("#ffffff");
        if ("emissive" in nextMaterial) {
          nextMaterial.emissive = new THREE.Color("#201a24");
          nextMaterial.emissiveIntensity = 0.38;
        }
        if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.max(0.38, Math.min(0.9, nextMaterial.roughness));
        if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(0.42, nextMaterial.metalness + 0.08);
        nextMaterial.side = THREE.DoubleSide;
        nextMaterial.needsUpdate = true;
        return nextMaterial;
      });

      child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
    });

    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.set(-center.x, -box.min.y + 0.005, 0.36 - center.z);
  }, [model, colorMap, emissiveMap, metalnessMap, roughnessMap, normalMap]);

  return <primitive object={model} />;
}

function RedBullDysDanceCircle() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const center = canvas.width / 2;
    const ring = ctx.createRadialGradient(center, center, 70, center, center, 460);
    ring.addColorStop(0, "rgba(255, 244, 214, 0.18)");
    ring.addColorStop(0.36, "rgba(12, 41, 110, 0.42)");
    ring.addColorStop(0.56, "rgba(229, 14, 37, 0.34)");
    ring.addColorStop(0.8, "rgba(255, 244, 214, 0.10)");
    ring.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(center, center, 470, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 244, 214, 0.72)";
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(center, center, 386, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 34, 58, 0.70)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(center, center, 250, -Math.PI * 0.1, Math.PI * 0.88);
    ctx.stroke();

    ctx.strokeStyle = "rgba(44, 108, 255, 0.72)";
    ctx.beginPath();
    ctx.arc(center, center, 250, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0.035, 0.36]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[9.4, 9.4]} />
      <meshBasicMaterial map={texture} transparent opacity={0.82} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function RedBullDysStage() {
  return (
    <group>
      <RedBullDysEnvironment />
      <Suspense fallback={null}>
        <RedBullDysModel />
      </Suspense>

      <mesh position={[0, -0.018, 0.36]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[36, 26]} />
        <meshStandardMaterial color="#08090d" roughness={0.8} metalness={0.08} />
      </mesh>

      <RedBullDysDanceCircle />

      <mesh position={[0, 0.052, 0.36]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.82, 4.95, 128]} />
        <meshBasicMaterial color="#fff4d6" transparent opacity={0.32} depthWrite={false} toneMapped={false} />
      </mesh>

      {[-10.4, 10.4].map((x, index) => (
        <group key={index} position={[x, 0, -2.05]}>
          <mesh position={[0, 2.45, 0]}>
            <boxGeometry args={[0.18, 4.9, 0.18]} />
            <meshStandardMaterial color="#15171d" metalness={0.48} roughness={0.38} />
          </mesh>
          <mesh position={[0, 4.72, 0.7]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[1.55, 0.15, 0.15]} />
            <meshStandardMaterial color="#20242c" metalness={0.52} roughness={0.34} />
          </mesh>
          <mesh position={[0, 4.58, 1.42]} rotation={[0.24, 0, 0]}>
            <boxGeometry args={[0.76, 0.28, 0.44]} />
            <meshBasicMaterial color={index === 0 ? "#2f74ff" : "#ff263f"} transparent opacity={0.86} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StageColorEnvironment({ background = "#050507" }) {
  const { scene } = useThree();

  useEffect(() => {
    const previousBackground = scene.background;
    scene.background = new THREE.Color(background);
    return () => {
      scene.background = previousBackground;
    };
  }, [scene, background]);

  return null;
}

function MeshyFbxStageModel({
  asset,
  fit = { x: 18, y: 5, z: 8 },
  position = [0, 0, -3],
  rotation = [0, 0, 0],
  floorOffset = 0,
  profile = "neutral",
}) {
  const modelUrl = asset.runtimeModel ?? asset.model;
  const StageLoader = /\.glb$|\.gltf$/i.test(modelUrl) ? GLTFLoader : FBXLoader;
  const baseStage = useLoader(StageLoader, modelUrl);
  const [colorMap, emissiveMap, metalnessMap, roughnessMap, normalMap] = useLoader(THREE.TextureLoader, [
    asset.texture,
    asset.emissive,
    asset.metalness,
    asset.roughness,
    asset.normal,
  ]);
  const model = useMemo(() => SkeletonUtils.clone(baseStage.scene ?? baseStage), [baseStage]);

  useEffect(() => {
    const allMaps = [colorMap, emissiveMap, metalnessMap, roughnessMap, normalMap];
    allMaps.forEach((texture) => {
      texture.flipY = true;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    });
    colorMap.colorSpace = THREE.SRGBColorSpace;
    emissiveMap.colorSpace = THREE.SRGBColorSpace;

    model.scale.setScalar(1);
    model.rotation.set(...rotation);
    model.position.set(0, 0, 0);
    model.updateMatrixWorld(true);

    const rawBox = new THREE.Box3().setFromObject(model);
    const rawSize = new THREE.Vector3();
    rawBox.getSize(rawSize);
    const scaleOptions = [
      rawSize.x > 0 && fit.x ? fit.x / rawSize.x : null,
      rawSize.y > 0 && fit.y ? fit.y / rawSize.y : null,
      rawSize.z > 0 && fit.z ? fit.z / rawSize.z : null,
    ].filter(value => Number.isFinite(value) && value > 0);
    const fitScale = (scaleOptions.length ? Math.min(...scaleOptions) : (fit.fallback ?? 0.08)) * (fit.multiplier ?? 1);
    model.scale.setScalar(Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 0.08);

    const profileSettings = {
      skate: { emissive: "#11151c", emissiveIntensity: 0.12, roughnessLift: 0.16, metalnessCap: 0.34 },
      graffiti: { emissive: "#170f18", emissiveIntensity: 0.16, roughnessLift: 0.1, metalnessCap: 0.3 },
      bull: { emissive: "#211208", emissiveIntensity: 0.18, roughnessLift: 0.12, metalnessCap: 0.36 },
      neutral: { emissive: "#121212", emissiveIntensity: 0.1, roughnessLift: 0.1, metalnessCap: 0.32 },
    }[profile] ?? {};

    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      child.castShadow = false;
      child.receiveShadow = true;

      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const nextMaterials = sourceMaterials.map((material) => {
        const nextMaterial = material.clone();
        nextMaterial.map = colorMap;
        nextMaterial.emissiveMap = emissiveMap;
        nextMaterial.metalnessMap = metalnessMap;
        nextMaterial.roughnessMap = roughnessMap;
        nextMaterial.normalMap = normalMap;
        if (nextMaterial.color) nextMaterial.color.set("#ffffff");
        if ("emissive" in nextMaterial) {
          nextMaterial.emissive = new THREE.Color(profileSettings.emissive ?? "#121212");
          nextMaterial.emissiveIntensity = profileSettings.emissiveIntensity ?? 0.1;
        }
        if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.min(0.96, nextMaterial.roughness + (profileSettings.roughnessLift ?? 0.1));
        if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(profileSettings.metalnessCap ?? 0.32, nextMaterial.metalness);
        nextMaterial.side = THREE.DoubleSide;
        nextMaterial.transparent = false;
        nextMaterial.opacity = 1;
        nextMaterial.alphaTest = 0;
        nextMaterial.depthWrite = true;
        nextMaterial.depthTest = true;
        nextMaterial.needsUpdate = true;
        return nextMaterial;
      });

      child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
    });

    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.set(position[0] - center.x, position[1] - box.min.y + floorOffset, position[2] - center.z);
  }, [
    model,
    colorMap,
    emissiveMap,
    metalnessMap,
    roughnessMap,
    normalMap,
    fit.x,
    fit.y,
    fit.z,
    fit.fallback,
    fit.multiplier,
    position[0],
    position[1],
    position[2],
    rotation[0],
    rotation[1],
    rotation[2],
    floorOffset,
    profile,
  ]);

  return <primitive object={model} />;
}

function ConcreteGround({ color = "#3f4042", accent = "#77706a", width = 22, depth = 12, z = 0, y = 0 }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 520; i += 1) {
      const size = 1 + Math.random() * 3.5;
      ctx.fillStyle = Math.random() > 0.46 ? accent : "#151619";
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
    }
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(width / 8, depth / 8);
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, [color, accent, width, depth]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={color} map={texture} roughness={0.92} metalness={0.03} />
    </mesh>
  );
}

function FighterGroundShadows({ xs = [-2.8, 3.35], z = 0.42, y = 0.044, opacity = 0.22 }) {
  return xs.map((x, index) => (
    <mesh key={index} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.22, 0.46, 1]}>
      <circleGeometry args={[1, 48]} />
      <meshBasicMaterial color="#020202" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  ));
}

function SkateBowlInteriorFloor() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#51575a");
    gradient.addColorStop(0.52, "#3d4245");
    gradient.addColorStop(1, "#24272b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.24;
    for (let i = 0; i < 760; i += 1) {
      const shade = Math.random() > 0.52 ? "#707070" : "#17191d";
      ctx.fillStyle = shade;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1 + Math.random() * 4, 1 + Math.random() * 3);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.42, canvas.height * 0.34, -0.07, 0, Math.PI * 2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0.055, 0.62]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.95, 2.18, 1]}>
      <circleGeometry args={[1, 96]} />
      <meshStandardMaterial color="#45494c" map={texture} roughness={0.94} metalness={0.02} />
    </mesh>
  );
}

function SkateBowlCrowdBacking() {
  const panels = [
    { position: [0, 2.62, -4.78], rotation: [0, 0, 0], width: 18.8, height: 3.7, color: "#171b20", opacity: 0.98 },
    { position: [-7.45, 2.48, -3.78], rotation: [0, 0.28, 0], width: 6.4, height: 3.0, color: "#15191e", opacity: 0.94 },
    { position: [7.45, 2.48, -3.78], rotation: [0, -0.28, 0], width: 6.4, height: 3.0, color: "#15191e", opacity: 0.94 },
  ];

  return (
    <group>
      {panels.map((panel, index) => (
        <mesh key={index} position={panel.position} rotation={panel.rotation} renderOrder={-18}>
          <planeGeometry args={[panel.width, panel.height]} />
          <meshBasicMaterial color={panel.color} transparent opacity={panel.opacity} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function SkateBowlStage() {
  const crowdPlanes = useMemo(() => ([
    { position: [0, 2.58, -4.58], width: 16.7, height: 2.18, opacity: 0.98, renderOrder: -4 },
    { position: [-7.25, 2.42, -3.68], rotation: [0, 0.28, 0], width: 5.8, height: 1.96, opacity: 0.86, renderOrder: -4 },
    { position: [7.25, 2.42, -3.68], rotation: [0, -0.28, 0], width: 5.8, height: 1.96, opacity: 0.86, renderOrder: -4 },
  ]), []);

  return (
    <group>
      <StageColorEnvironment background="#070910" />
      <ConcreteGround color="#373a3d" accent="#6a6863" width={22} depth={12} z={0.18} y={-0.026} />
      <SkateBowlInteriorFloor />
      <Suspense fallback={null}>
        <MeshyFbxStageModel
          asset={SKATE_BOWL_STAGE_ASSET}
          fit={{ x: 16.2, y: 4.08, z: 9.2 }}
          position={[0, 0.02, -0.08]}
          floorOffset={-0.1}
          profile="skate"
        />
      </Suspense>
      <SkateBowlCrowdBacking />
      <Suspense fallback={null}>
        <WaffleHouseCrowd planes={crowdPlanes} />
      </Suspense>
      <FighterGroundShadows xs={[-0.92, 0.92]} z={0.78} y={0.18} opacity={0.2} />
    </group>
  );
}

function NCGraffitiStage() {
  const crowdPlanes = useMemo(() => ([
    { textureIndex: 0, position: [-6.25, 1.26, -16.56], rotation: [0, 0.04, 0], width: 3.6, height: 2.02, opacity: 0.9, renderOrder: -5 },
    { textureIndex: 2, position: [-3.25, 1.28, -16.62], rotation: [0, 0.015, 0], width: 3.74, height: 2.1, opacity: 0.94, renderOrder: -4 },
    { textureIndex: 4, position: [0, 1.3, -16.68], width: 3.88, height: 2.18, opacity: 0.96, renderOrder: -3 },
    { textureIndex: 1, position: [3.25, 1.28, -16.62], rotation: [0, -0.015, 0], width: 3.74, height: 2.1, opacity: 0.94, renderOrder: -4 },
    { textureIndex: 3, position: [6.25, 1.26, -16.56], rotation: [0, -0.04, 0], width: 3.6, height: 2.02, opacity: 0.9, renderOrder: -5 },
    { textureIndex: 1, position: [-7.72, 1.11, -15.45], rotation: [0, 0.38, 0], width: 3.15, height: 1.77, opacity: 0.78, renderOrder: -7 },
    { textureIndex: 3, position: [-7.95, 1.02, -13.78], rotation: [0, 0.56, 0], width: 2.82, height: 1.59, opacity: 0.66, renderOrder: -9 },
    { textureIndex: 2, position: [7.72, 1.11, -15.45], rotation: [0, -0.38, 0], width: 3.15, height: 1.77, opacity: 0.78, renderOrder: -7 },
    { textureIndex: 0, position: [7.95, 1.02, -13.78], rotation: [0, -0.56, 0], width: 2.82, height: 1.59, opacity: 0.66, renderOrder: -9 },
  ]), []);

  return (
    <group>
      <StageColorEnvironment background="#07070b" />
      <ConcreteGround color="#24272a" accent="#58565b" width={24} depth={12} z={0.12} y={-0.024} />
      <Suspense fallback={null}>
        <MeshyFbxStageModel
          asset={NC_GRAFFITI_STAGE_ASSET}
          fit={{ x: 54.5, y: 12.8, z: 26.8 }}
          position={[0, -0.34, -11.1]}
          floorOffset={-0.18}
          profile="graffiti"
        />
      </Suspense>
      <Suspense fallback={null}>
        <WaffleHouseCrowd planes={crowdPlanes} />
      </Suspense>
      <FighterGroundShadows xs={[-2.25, 2.25]} z={-11.1} y={0.2} opacity={0.22} />
    </group>
  );
}

function DaBullSkyBackdrop() {
  const texture = useLoader(THREE.TextureLoader, DA_BULL_SKY_URL);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh position={[0, 5.05, -17.5]} renderOrder={-80}>
      <planeGeometry args={[38, 13]} />
      <meshBasicMaterial map={texture} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function DaBullStage() {
  const crowdPlanes = useMemo(() => ([
    { position: [-3.55, 1.22, -2.42], rotation: [0, 0.05, 0], width: 6.4, height: 1.24, opacity: 0.92, renderOrder: -7 },
    { position: [3.55, 1.22, -2.42], rotation: [0, -0.05, 0], width: 6.4, height: 1.24, opacity: 0.92, renderOrder: -7 },
    { position: [-6.25, 1.1, -2.92], rotation: [0, 0.28, 0], width: 5.4, height: 1.05, opacity: 0.76, renderOrder: -11 },
    { position: [6.25, 1.1, -2.92], rotation: [0, -0.28, 0], width: 5.4, height: 1.05, opacity: 0.76, renderOrder: -11 },
  ]), []);

  return (
    <group>
      <StageColorEnvironment background="#090806" />
      <Suspense fallback={null}>
        <DaBullSkyBackdrop />
      </Suspense>
      <Suspense fallback={null}>
        <MeshyFbxStageModel
          asset={DA_BULL_STAGE_ASSET}
          fit={{ x: 29.5, y: 10.2, z: 13.4 }}
          position={[0, 0.12, -5.95]}
          rotation={[0, 0.18, 0]}
          floorOffset={-0.08}
          profile="bull"
        />
      </Suspense>
      <Suspense fallback={null}>
        <WaffleHouseCrowd planes={crowdPlanes} />
      </Suspense>
      <FighterGroundShadows xs={[-0.88, 0.88]} z={-1.72} y={0.78} opacity={0.18} />
    </group>
  );
}

function WaffleHouseModel() {
  const baseGltf = useLoader(GLTFLoader, WAFFLEHOUSE_MODEL_URL);
  const model = useMemo(() => SkeletonUtils.clone(baseGltf.scene), [baseGltf]);

  useEffect(() => {
    model.scale.setScalar(1);
    model.rotation.set(0, 0, 0);
    model.position.set(0, 0, 0);

    model.updateMatrixWorld(true);
    const rawBox = new THREE.Box3().setFromObject(model);
    const rawSize = new THREE.Vector3();
    rawBox.getSize(rawSize);
    const fitScale = Math.min(
      rawSize.x > 0 ? 13.7 / rawSize.x : 0.08,
      rawSize.y > 0 ? 4.25 / rawSize.y : 0.08,
    );
    model.scale.setScalar(Number.isFinite(fitScale) && fitScale > 0 ? fitScale : 0.08);

    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      child.castShadow = false;
      child.receiveShadow = true;

      const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const nextMaterials = sourceMaterials.map((material) => {
        const nextMaterial = material.clone();
        if (nextMaterial.color) nextMaterial.color.set("#ffffff");
        if ("emissive" in nextMaterial) {
          nextMaterial.emissive = new THREE.Color("#1b1308");
          nextMaterial.emissiveIntensity = 0.08;
        }
        if (typeof nextMaterial.roughness === "number") nextMaterial.roughness = Math.min(0.96, nextMaterial.roughness + 0.18);
        if (typeof nextMaterial.metalness === "number") nextMaterial.metalness = Math.min(0.22, nextMaterial.metalness);
        nextMaterial.side = THREE.DoubleSide;
        nextMaterial.needsUpdate = true;
        return nextMaterial;
      });

      child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
    });

    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.set(-center.x, -box.min.y - 0.12, -9.35 - center.z);
  }, [model]);

  return <primitive object={model} />;
}

function WaffleHousePeople() {
  const group = useRef();
  const people = useMemo(() => ([
    { x: -6.5, z: -3.15, s: 0.72, p: 0.2 },
    { x: -5.4, z: -3.35, s: 0.58, p: 1.1 },
    { x: 5.7, z: -3.2, s: 0.64, p: 2.3 },
    { x: 6.8, z: -3.45, s: 0.55, p: 3.2 },
  ]), []);

  useFrame(() => {
    if (!group.current) return;
    const t = performance.now() * 0.004;
    group.current.children.forEach((child, index) => {
      const person = people[index];
      if (!person) return;
      const bob = Math.sin(t + person.p) * 0.045;
      child.position.y = bob;
      child.rotation.z = Math.sin(t * 0.8 + person.p) * 0.08;
    });
  });

  return (
    <group ref={group}>
      {people.map((person, index) => (
        <group key={index} position={[person.x, 0, person.z]} scale={person.s}>
          <mesh position={[0, 0.56, 0]}>
            <capsuleGeometry args={[0.095, 0.48, 6, 10]} />
            <meshStandardMaterial color="#17130f" emissive="#24180a" emissiveIntensity={0.42} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color="#0b0908" emissive="#1f1408" emissiveIntensity={0.34} roughness={0.85} />
          </mesh>
          <mesh position={[-0.14, 0.64, 0]} rotation={[0, 0, 0.55]}>
            <capsuleGeometry args={[0.035, 0.28, 4, 8]} />
            <meshStandardMaterial color="#16110d" roughness={0.82} />
          </mesh>
          <mesh position={[0.14, 0.64, 0]} rotation={[0, 0, -0.55]}>
            <capsuleGeometry args={[0.035, 0.28, 4, 8]} />
            <meshStandardMaterial color="#16110d" roughness={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WaffleHouseTrees() {
  const trees = [
    [-8.8, -4.25, 0.9], [-7.7, -4.55, 0.7], [7.6, -4.5, 0.78], [8.7, -4.25, 0.95],
  ];
  return (
    <group>
      {trees.map(([x, z, s], index) => (
        <group key={index} position={[x, 0, z]} scale={s}>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 1.44, 8]} />
            <meshStandardMaterial color="#27170d" roughness={0.88} />
          </mesh>
          <mesh position={[0, 1.72, 0]}>
            <coneGeometry args={[0.58, 1.65, 10]} />
            <meshStandardMaterial color="#07140c" emissive="#08210f" emissiveIntensity={0.26} roughness={0.8} />
          </mesh>
          <mesh position={[0.18, 2.12, -0.04]}>
            <coneGeometry args={[0.42, 1.18, 10]} />
            <meshStandardMaterial color="#0a1c10" emissive="#0b2c14" emissiveIntensity={0.22} roughness={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WaffleHouseSky() {
  const { scene } = useThree();
  const skyTexture = useLoader(THREE.TextureLoader, WAFFLEHOUSE_SKY_URL);

  useEffect(() => {
    skyTexture.colorSpace = THREE.SRGBColorSpace;
    skyTexture.wrapS = THREE.ClampToEdgeWrapping;
    skyTexture.wrapT = THREE.ClampToEdgeWrapping;
    skyTexture.needsUpdate = true;

    const previousBackground = scene.background;
    scene.background = skyTexture;
    return () => {
      scene.background = previousBackground;
    };
  }, [scene, skyTexture]);

  return null;
}

function WaffleHouseEnvironment() {
  const { scene } = useThree();
  const texture = useLoader(THREE.TextureLoader, WAFFLEHOUSE_ENV_URL);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;

    const previousEnvironment = scene.environment;
    scene.environment = texture;
    return () => {
      scene.environment = previousEnvironment;
    };
  }, [scene, texture]);

  return null;
}

function WaffleHouseHorizon() {
  const shrubs = useMemo(() => (
    Array.from({ length: 28 }, (_, index) => ({
      x: -12 + index * 0.9,
      y: 0.93 + ((index * 19) % 18) * 0.01,
      radius: 0.34 + ((index * 23) % 32) * 0.01,
      scaleY: 0.45 + ((index * 13) % 30) * 0.01,
    }))
  ), []);

  return (
    <group position={[0, 0, -7.08]}>
      <mesh position={[0, 0.66, 0]}>
        <planeGeometry args={[26, 0.32]} />
        <meshBasicMaterial color="#090f08" transparent opacity={0.95} depthWrite={false} />
      </mesh>
      {shrubs.map((shrub, index) => (
        <mesh key={index} position={[shrub.x, shrub.y, 0.02]} scale={[1, shrub.scaleY, 1]}>
          <circleGeometry args={[shrub.radius, 16]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#07150a" : "#0a190d"} transparent opacity={0.98} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function WaffleHouseBuildingBase() {
  return (
    <group>
      <mesh position={[0, 0.024, -3.12]} rotation={[-Math.PI / 2, 0, -0.015]}>
        <planeGeometry args={[21.5, 3.25]} />
        <meshBasicMaterial color="#4f4942" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.035, -2.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20.8, 0.42]} />
        <meshBasicMaterial color="#938981" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.07, -2.32]}>
        <boxGeometry args={[21.2, 0.14, 0.32]} />
        <meshStandardMaterial color="#686057" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.033, -1.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[5.8, 1.02, 1]}>
        <circleGeometry args={[1, 72]} />
        <meshBasicMaterial color="#050505" transparent opacity={0.26} depthWrite={false} />
      </mesh>
      <mesh position={[3.2, 0.036, -1.28]} rotation={[-Math.PI / 2, 0, -0.04]} scale={[2.8, 0.58, 1]}>
        <circleGeometry args={[1, 56]} />
        <meshBasicMaterial color="#d46e37" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

function WaffleHouseRestaurant() {
  const signTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 224;
    const ctx = canvas.getContext("2d");

    const signGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    signGradient.addColorStop(0, "#f0c437");
    signGradient.addColorStop(0.52, "#c7961d");
    signGradient.addColorStop(1, "#f8d95c");
    ctx.fillStyle = signGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(60, 37, 8, 0.36)";
    for (let i = 0; i < 120; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 10 + Math.random() * 44, 1 + Math.random() * 5);
    }

    ctx.strokeStyle = "#3d2405";
    ctx.lineWidth = 18;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.fillStyle = "#10100d";
    ctx.font = "900 88px Arial Black, Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255, 246, 188, 0.55)";
    ctx.shadowBlur = 12;
    ctx.fillText("WAFFLE HOUSE", canvas.width / 2, canvas.height / 2 + 4);
    ctx.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => () => signTexture.dispose(), [signTexture]);

  return (
    <group position={[0, 0, -5.15]} scale={[0.84, 0.84, 1]}>
      <mesh position={[0, 1.68, -0.05]}>
        <boxGeometry args={[18.4, 3.05, 0.36]} />
        <meshStandardMaterial color="#352119" roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.64, 0.16]}>
        <boxGeometry args={[18.8, 1.02, 0.22]} />
        <meshStandardMaterial color="#4c2a1d" roughness={0.88} />
      </mesh>
      <mesh position={[0, 2.62, 0.18]}>
        <boxGeometry args={[19.25, 0.48, 0.62]} />
        <meshStandardMaterial color="#17100b" roughness={0.76} />
      </mesh>
      <mesh position={[0, 3.08, 0.22]}>
        <boxGeometry args={[18.75, 0.18, 0.5]} />
        <meshStandardMaterial color="#0d0b08" roughness={0.7} />
      </mesh>

      <mesh position={[0, 3.26, 0.55]}>
        <boxGeometry args={[9.75, 0.72, 0.12]} />
        <meshBasicMaterial map={signTexture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.26, 0.48]}>
        <boxGeometry args={[10.25, 0.9, 0.08]} />
        <meshBasicMaterial color="#ffd45f" transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>

      <group position={[0, 1.06, 0.23]}>
        <mesh>
          <boxGeometry args={[1.44, 2.05, 0.12]} />
          <meshStandardMaterial color="#211712" emissive="#ffb45f" emissiveIntensity={0.32} roughness={0.42} />
        </mesh>
        <mesh position={[0.42, 0.06, 0.08]}>
          <sphereGeometry args={[0.055, 12, 12]} />
          <meshBasicMaterial color="#ffe7aa" toneMapped={false} />
        </mesh>
      </group>

      {[-8.5, -5.2, -1.1, 1.1, 5.2, 8.5].map((x, index) => (
        <mesh key={index} position={[x, 1.35, 0.34]}>
          <boxGeometry args={[0.16, 2.45, 0.22]} />
          <meshStandardMaterial color="#1f1510" roughness={0.78} />
        </mesh>
      ))}

      <mesh position={[0, 0.09, 0.86]}>
        <boxGeometry args={[20.4, 0.18, 1.28]} />
        <meshStandardMaterial color="#8a8178" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.22, 0.24]}>
        <boxGeometry args={[19.4, 0.24, 0.18]} />
        <meshStandardMaterial color="#40382f" roughness={0.88} />
      </mesh>
    </group>
  );
}

function WaffleHouseAtmosphere() {
  return (
    <group>
      <mesh position={[0, 2.08, -3.72]}>
        <planeGeometry args={[18.8, 2.95]} />
        <meshBasicMaterial color="#ffaf5f" transparent opacity={0.055} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.74, -1.95]}>
        <planeGeometry args={[18.6, 0.42]} />
        <meshBasicMaterial color="#050505" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

function WaffleHouseCrowd({ planes = null } = {}) {
  const group = useRef();
  const sourceTextures = useLoader(THREE.TextureLoader, WAFFLEHOUSE_CROWD_URLS);
  const activePlanes = planes ?? [{ position: [0, 1.04, -2.62], rotation: [0, 0, 0], width: 16.9, height: 2.02, opacity: 1, renderOrder: -2 }];
  const crowdTextures = useMemo(() => sourceTextures.map((sourceTexture) => {
    const source = sourceTexture.image;
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = source.width;
    sourceCanvas.height = source.height;
    const sourceCtx = sourceCanvas.getContext("2d");
    sourceCtx.drawImage(source, 0, 0);

    const sourceData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    let minX = sourceCanvas.width;
    let minY = sourceCanvas.height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < sourceCanvas.height; y += 1) {
      for (let x = 0; x < sourceCanvas.width; x += 1) {
        const offset = (y * sourceCanvas.width + x) * 4;
        const r = sourceData.data[offset];
        const g = sourceData.data[offset + 1];
        const b = sourceData.data[offset + 2];
        const alpha = sourceData.data[offset + 3];
        const isBlackBackdrop = r < 9 && g < 9 && b < 9;
        if (alpha > 12 && !isBlackBackdrop) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    const pad = 10;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(sourceCanvas.width - 1, maxX + pad);
    maxY = Math.min(sourceCanvas.height - 1, maxY + pad);

    const width = Math.max(1, maxX - minX + 1);
    const height = Math.max(1, maxY - minY + 1);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(sourceCanvas, minX, minY, width, height, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;

      const pixelY = Math.floor((i / 4) / width);
      const vertical = pixelY / Math.max(1, height - 1);
      const signLight = 1 - vertical;
      const nightFalloff = vertical;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const blackBackdrop = r < 9 && g < 9 && b < 9;
      if (blackBackdrop) {
        data[i + 3] = 0;
        continue;
      }
      const greenRim = g > 46 && g > r * 1.35 && g > b * 1.25;
      if (greenRim) {
        data[i] = 18;
        data[i + 1] = 18;
        data[i + 2] = 14;
        data[i + 3] = alpha > 12 ? 255 : 0;
        continue;
      }

      data[i] = Math.min(255, Math.round(r * 0.68 + 34 + signLight * 18));
      data[i + 1] = Math.min(255, Math.round(g * 0.62 + 23 + signLight * 14));
      data[i + 2] = Math.min(255, Math.round(b * 0.56 + 24 + nightFalloff * 18));
      data[i + 3] = alpha > 12 ? 255 : 0;
    }
    ctx.putImageData(imageData, 0, 0);

    const shade = ctx.createLinearGradient(0, 0, 0, height);
    shade.addColorStop(0, "rgba(255, 190, 96, 0.18)");
    shade.addColorStop(0.45, "rgba(28, 34, 56, 0.08)");
    shade.addColorStop(1, "rgba(6, 8, 15, 0.1)");
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.userData.aspect = width / Math.max(1, height);
    texture.needsUpdate = true;
    return texture;
  }), [sourceTextures]);
  const crowdWallTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 3200;
    canvas.height = 620;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawCrowd = (texture, x, y, width, height, alpha = 1) => {
      if (!texture?.image) return;
      ctx.globalAlpha = alpha;
      ctx.drawImage(texture.image, x, y, width, height);
      ctx.globalAlpha = 1;
    };

    ctx.save();
    ctx.filter = "blur(10px) saturate(0.86)";
    drawCrowd(crowdTextures[0], -240, 46, 3660, 480, 0.46);
    drawCrowd(crowdTextures[1], 1660, 0, 1690, 550, 0.58);
    drawCrowd(crowdTextures[4], 1940, 20, 1540, 520, 0.62);
    ctx.restore();

    drawCrowd(crowdTextures[0], -180, 68, 3540, 440, 0.92);
    drawCrowd(crowdTextures[2], -130, 18, 1380, 510);
    drawCrowd(crowdTextures[3], -350, 24, 980, 505);
    drawCrowd(crowdTextures[4], 820, 54, 1450, 470);
    drawCrowd(crowdTextures[1], 1750, 26, 1570, 520);
    drawCrowd(crowdTextures[4], 2050, 48, 1450, 480);
    drawCrowd(crowdTextures[2], 2220, 18, 1380, 510);

    const bottomLight = ctx.createLinearGradient(0, canvas.height * 0.72, 0, canvas.height);
    bottomLight.addColorStop(0, "rgba(0, 0, 0, 0)");
    bottomLight.addColorStop(1, "rgba(255, 210, 122, 0.08)");
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = bottomLight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, [crowdTextures]);

  return (
    <group ref={group}>
      {activePlanes.map((plane, index) => (
        <mesh
          key={index}
          position={plane.position}
          rotation={plane.rotation ?? [0, 0, 0]}
          renderOrder={plane.renderOrder ?? -2}
        >
          <planeGeometry args={[plane.width ?? 16.9, plane.height ?? 2.02]} />
          <meshBasicMaterial
            map={Number.isInteger(plane.textureIndex) ? (crowdTextures[plane.textureIndex] ?? crowdWallTexture) : crowdWallTexture}
            transparent
            alphaTest={0.04}
            opacity={plane.opacity ?? 1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function WaffleHouseLightPole() {
  const poles = [
    { x: -7.55, z: -1.65, dir: 1, scale: 0.94 },
    { x: 7.55, z: -1.45, dir: -1, scale: 0.86 },
  ];

  return (
    <group>
      {poles.map((pole, index) => (
        <group key={index} position={[pole.x, 0, pole.z]} scale={pole.scale}>
          <mesh position={[0, 1.7, 0]}>
            <cylinderGeometry args={[0.052, 0.076, 3.4, 14]} />
            <meshStandardMaterial color="#2a2c2f" metalness={0.58} roughness={0.36} />
          </mesh>
          <mesh position={[pole.dir * 0.42, 3.29, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.038, 0.038, 0.88, 12]} />
            <meshStandardMaterial color="#303235" metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh position={[pole.dir * 0.88, 3.16, 0]} rotation={[0, 0, pole.dir * -0.18]}>
            <boxGeometry args={[0.52, 0.22, 0.34]} />
            <meshBasicMaterial color="#fff4c8" toneMapped={false} />
          </mesh>
          <mesh position={[pole.dir * 0.88, 3.14, 0]} rotation={[0, 0, pole.dir * -0.18]}>
            <boxGeometry args={[0.68, 0.3, 0.42]} />
            <meshBasicMaterial color="#fff0b8" transparent opacity={0.18} depthWrite={false} toneMapped={false} />
          </mesh>
          <pointLight position={[pole.dir * 0.88, 3.1, 0]} intensity={4.7} color="#fff1bd" distance={6.4} />
          <mesh position={[pole.dir * 0.2, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.95, 56]} />
            <meshBasicMaterial color="#fff0b8" transparent opacity={0.06} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WaffleHouseStage() {
  const groundMap = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#78736d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 34;
      const warm = Math.random() * 8;
      data[i] = THREE.MathUtils.clamp(data[i] + grain + warm, 0, 255);
      data[i + 1] = THREE.MathUtils.clamp(data[i + 1] + grain + warm * 0.7, 0, 255);
      data[i + 2] = THREE.MathUtils.clamp(data[i + 2] + grain * 0.9, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 260; i += 1) {
      const radius = 0.35 + Math.random() * 1.4;
      ctx.fillStyle = Math.random() > 0.5 ? "#a29b91" : "#4b4945";
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3.2, 2.05);
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => () => groundMap.dispose(), [groundMap]);

  const asphaltPatches = useMemo(() => ([
    { x: 0, z: -3.05, w: 23.0, h: 4.2, color: "#585149", opacity: 0.16 },
    { x: -4.6, z: 1.8, w: 5.4, h: 1.9, color: "#1d1d1c", opacity: 0.08 },
    { x: 4.3, z: 1.35, w: 5.8, h: 1.8, color: "#1e1e1d", opacity: 0.08 },
    { x: 2.8, z: -0.7, w: 7.2, h: 2.4, color: "#906b55", opacity: 0.06 },
  ]), []);
  const tireScuffs = useMemo(() => ([
    { x: -2.8, z: 0.9, sx: 1.9, sz: 0.58, rot: 0.12, opacity: 0.13 },
    { x: -0.9, z: 1.15, sx: 1.55, sz: 0.48, rot: -0.08, opacity: 0.1 },
    { x: 2.7, z: 0.65, sx: 2.1, sz: 0.62, rot: -0.1, opacity: 0.12 },
    { x: 4.5, z: 1.85, sx: 1.45, sz: 0.46, rot: 0.18, opacity: 0.09 },
  ]), []);

  return (
    <group>
      <Suspense fallback={null}>
        <WaffleHouseEnvironment />
      </Suspense>
      <Suspense fallback={null}>
        <WaffleHouseSky />
      </Suspense>
      <WaffleHouseHorizon />
      <WaffleHouseRestaurant />
      <WaffleHouseBuildingBase />
      <Suspense fallback={null}>
        <WaffleHouseCrowd />
      </Suspense>
      <WaffleHouseLightPole />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 14]} />
        <meshStandardMaterial
          color="#b7aea5"
          map={groundMap}
          roughness={0.96}
          metalness={0.02}
        />
      </mesh>

      <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 14]} />
        <meshBasicMaterial color="#26211e" transparent opacity={0.08} />
      </mesh>

      <mesh position={[3.2, 0.021, -2.6]} rotation={[-Math.PI / 2, 0, -0.04]}>
        <circleGeometry args={[4.3, 64]} />
        <meshBasicMaterial color="#ff8f45" transparent opacity={0.08} depthWrite={false} />
      </mesh>

      {asphaltPatches.map((patch, index) => (
        <mesh key={index} position={[patch.x, 0.023 + index * 0.001, patch.z]} rotation={[-Math.PI / 2, 0, index % 2 === 0 ? -0.03 : 0.04]}>
          <planeGeometry args={[patch.w, patch.h]} />
          <meshBasicMaterial color={patch.color} transparent opacity={patch.opacity} depthWrite={false} />
        </mesh>
      ))}

      {tireScuffs.map((mark, index) => (
        <mesh key={index} position={[mark.x, 0.027 + index * 0.001, mark.z]} rotation={[-Math.PI / 2, 0, mark.rot]} scale={[mark.sx, mark.sz, 1]}>
          <ringGeometry args={[0.78, 0.81, 80, 1, 0.18, Math.PI * 1.46]} />
          <meshBasicMaterial color="#080808" transparent opacity={mark.opacity} depthWrite={false} />
        </mesh>
      ))}

      {[-3.9, 3.4].map((x, index) => (
        <mesh key={index} position={[x, 0.027, 1.45]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.56, 28]} />
          <meshStandardMaterial color="#141717" emissive="#0f2830" emissiveIntensity={0.16} roughness={0.34} metalness={0.12} transparent opacity={0.34} />
        </mesh>
      ))}

      <mesh position={[0, 0.032, -0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.88, 54]} />
        <meshBasicMaterial color="#0c0c0c" transparent opacity={0.1} depthWrite={false} />
      </mesh>

      {[-2.8, 3.35].map((x, index) => (
        <mesh key={`fighter-ground-shadow-${index}`} position={[x, 0.041, 0.42]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.28, 0.48, 1]}>
          <circleGeometry args={[1, 56]} />
          <meshBasicMaterial color="#020202" transparent opacity={0.24} depthWrite={false} />
        </mesh>
      ))}
      <WaffleHouseAtmosphere />
    </group>
  );
}

function DefaultStage() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 12]} />
        <meshStandardMaterial color="#10131a" roughness={0.72} metalness={0.06} />
      </mesh>
      <gridHelper args={[24, 24, "#ff4f9a", "#2c3b4d"]} position={[0, 0.012, 0]} />

      <group position={[0, 0, -3.9]}>
        <mesh position={[0, 1.85, 0]}>
          <boxGeometry args={[18, 3.2, 0.12]} />
          <meshStandardMaterial color="#211c2a" emissive="#2a1324" emissiveIntensity={0.85} />
        </mesh>
        <mesh position={[-5.8, 2.3, 0.08]}>
          <boxGeometry args={[3.2, 0.72, 0.12]} />
          <meshStandardMaterial color="#211" emissive="#ff1b6b" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0, 2.25, 0.08]}>
          <boxGeometry args={[4.6, 0.62, 0.12]} />
          <meshStandardMaterial color="#10202b" emissive="#00d5ff" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[5.8, 2.32, 0.08]}>
          <boxGeometry args={[3.6, 0.72, 0.12]} />
          <meshStandardMaterial color="#28130b" emissive="#ffcf6b" emissiveIntensity={0.85} />
        </mesh>
      </group>

      <group position={[-7.4, 0, -3.3]}>
        <mesh position={[0, 1.15, 0]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[1.55, 2.3, 0.2]} />
          <meshStandardMaterial color="#182838" emissive="#102438" emissiveIntensity={0.95} />
        </mesh>
        <mesh position={[0, 2.45, 0.05]}>
          <boxGeometry args={[1.8, 0.36, 0.12]} />
          <meshStandardMaterial color="#1a0d16" emissive="#ff2d75" emissiveIntensity={1.5} />
        </mesh>
      </group>

      <group position={[7.1, 0, -3.2]}>
        <mesh position={[0, 1.35, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[1.9, 2.7, 0.2]} />
          <meshStandardMaterial color="#2a2118" emissive="#261208" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, 2.9, 0.05]}>
          <boxGeometry args={[2.1, 0.36, 0.12]} />
          <meshStandardMaterial color="#19170f" emissive="#ffcf6b" emissiveIntensity={1.2} />
        </mesh>
      </group>

      <mesh position={[0, 0.03, -1.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.68, 64]} />
        <meshBasicMaterial color="#ff2d75" transparent opacity={0.45} />
      </mesh>

      {[STAGE_MIN_X, STAGE_MAX_X].map((x, i) => (
        <group key={`barrier-${i}`} position={[x, 0, -0.4]}>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.12, 2.3, 0.14]} />
            <meshStandardMaterial color="#1a0913" emissive="#ff2d75" emissiveIntensity={1.4} transparent opacity={0.82} />
          </mesh>
          <mesh position={[0, 2.45, 0]}>
            <boxGeometry args={[0.34, 0.18, 0.18]} />
            <meshStandardMaterial color="#ffcf6b" emissive="#ff2d75" emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────
//  HUD
// ─────────────────────────────────────────────
function ComboReadout({ comboHud }) {
  const showP1 = comboHud.p1.hits > 1;
  const showP2 = comboHud.p2.hits > 1;

  return (
    <>
      {showP1 && (
        <div style={comboBoxStyle("left")}>
          <div style={{ fontSize: "42px" }}>{comboHud.p1.hits} HIT COMBO</div>
          <div style={{ fontSize: "18px" }}>{pct(comboHud.p1.damage)} DAMAGE</div>
        </div>
      )}
      {showP2 && (
        <div style={comboBoxStyle("right")}>
          <div style={{ fontSize: "42px" }}>{comboHud.p2.hits} HIT COMBO</div>
          <div style={{ fontSize: "18px" }}>{pct(comboHud.p2.damage)} DAMAGE</div>
        </div>
      )}
    </>
  );
}

function comboBoxStyle(side) {
  return {
    position: "absolute",
    top: "126px",
    [side]: "54px",
    color: "#ffe16a",
    fontFamily: "Impact, fantasy",
    letterSpacing: "2px",
    textShadow: "0 0 12px #ff4b00, 0 0 22px rgba(255,0,0,0.65)",
    pointerEvents: "none",
    textAlign: side === "right" ? "right" : "left",
  };
}

function DamagePopups({ popups }) {
  return (
    <>
      <style>{`
        @keyframes bdDamageFloat {
          0% { opacity: 0; transform: translate(-50%, 14px) scale(0.75); }
          15% { opacity: 1; transform: translate(-50%, 0) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -72px) scale(0.88); }
        }
      `}</style>
      {popups.map(popup => {
        const isPerfectGuard = popup.text === "PERFECT GUARD";
        const isClash = popup.text === "CLASH";
        const isCounter = popup.text === "COUNTER HIT";
        const isWall = popup.text === "WALL BOUNCE";
        const isPunish = popup.text === "TAUNT PUNISH";
        const isPower = popup.text === "POWER HIT" || popup.text === "HEAVY ATTACK 3" || popup.text === "SUPER BLOCKED";
        const isComboGrade = !!popup.comboGrade;
        const isKo = !!popup.ko;
        return (
          <div
            key={popup.id}
            style={{
              position: "absolute",
              left: popup.left,
              top: popup.top,
              color: isKo ? "#fffaf0" : isPerfectGuard ? "#dba6ff" : isClash || isWall || isComboGrade ? "#fff4b8" : isCounter || isPower || isPunish ? "#ffe16a" : popup.talk ? "#fff0b8" : popup.heal ? "#7CFF8D" : popup.blocked ? "#7fe7ff" : "#ff4055",
              fontFamily: "Impact, fantasy",
              fontSize: isKo ? "clamp(78px, 13vw, 156px)" : isClash ? "46px" : isWall ? "38px" : isPerfectGuard ? "30px" : isCounter || isPower || isPunish || isComboGrade ? "32px" : popup.talk ? "28px" : popup.blocked ? "24px" : "34px",
              letterSpacing: isKo ? "8px" : isClash ? "5px" : isPerfectGuard ? "3px" : popup.talk || isCounter || isPower || isPunish || isComboGrade || isWall ? "3px" : "2px",
              textTransform: (popup.talk || isPerfectGuard || isClash || isCounter || isPower || isPunish || isComboGrade || isWall || isKo) ? "uppercase" : "none",
              textShadow: isKo
                ? "5px 5px 0 #000, 0 0 18px #ffffff, 0 0 42px #ff2623, 0 0 58px #2d7dff"
                : isPerfectGuard
                ? "2px 2px 0 #150019, 0 0 12px #ffffff, 0 0 22px #b653ff, 0 0 36px #6b22ff"
                : isClash || isWall || isComboGrade
                  ? "3px 3px 0 #000, 0 0 12px #ffffff, 0 0 28px #ffcf6b, 0 0 42px #2d7dff"
                : isCounter || isPower || isPunish
                  ? "2px 2px 0 #000, 0 0 12px #fff, 0 0 24px #ffcf6b, 0 0 32px #ff2623"
                : popup.talk ? "2px 2px 0 #000, 0 0 12px #ffcf6b, 0 0 22px #ff2d75" : popup.heal ? "0 0 10px #00ff66, 0 0 18px #003b18" : popup.blocked ? "0 0 10px #00d5ff" : "0 0 10px #6b0000, 0 0 18px #ff0000",
              pointerEvents: "none",
              animation: "bdDamageFloat 900ms ease-out forwards",
            }}
          >
            {popup.text}
          </div>
        );
      })}
    </>
  );
}


function SystemAlerts({ alerts }) {
  return (
    <>
      <style>{`
        @keyframes bdSystemAlertIn {
          0% { opacity: 0; transform: translate(-50%, 10px) scale(0.92); filter: blur(1px); }
          16% { opacity: .94; transform: translate(-50%, 0) scale(1); filter: blur(0); }
          78% { opacity: .88; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -8px) scale(0.98); }
        }
      `}</style>
      {alerts.slice(-4).map((alert, index) => {
        const isP1 = alert.playerKey === "p1";
        const palette = alert.type === "stunned" || alert.type === "knockdown"
          ? { bg: "rgba(95,10,10,0.62)", border: "rgba(255,66,66,0.78)", text: "#ffe8e8", accent: "#ffd36a" }
          : alert.type === "perfect-guard"
            ? { bg: "rgba(62,14,102,0.70)", border: "rgba(211,142,255,0.92)", text: "#f4dcff", accent: "#ffffff" }
          : alert.type === "comeback"
            ? { bg: "rgba(114,24,0,0.68)", border: "rgba(255,211,106,0.82)", text: "#fff4d2", accent: "#ff4055" }
          : alert.type === "dash"
            ? { bg: "rgba(16,42,92,0.64)", border: "rgba(126,220,255,0.76)", text: "#ecfbff", accent: "#ffd36a" }
          : alert.type === "clash" || alert.type === "counter-hit" || alert.type === "super-start" || alert.type === "power-start"
            ? { bg: "rgba(90,46,0,0.70)", border: "rgba(255,225,106,0.86)", text: "#fff8d8", accent: "#ff4055" }
          : alert.type === "wall-bounce" || alert.type === "combo-grade" || alert.type === "taunt-punish" || alert.type === "ko"
            ? { bg: "rgba(94,0,18,0.72)", border: "rgba(255,215,95,0.88)", text: "#fff6dc", accent: "#ffffff" }
          : alert.type === "taunt" || alert.type === "taunt-close" || alert.type === "taunt-cooldown"
            ? { bg: "rgba(20,52,98,0.66)", border: "rgba(135,220,255,0.78)", text: "#ecfbff", accent: "#ffd36a" }
          : alert.type === "one-touch" || alert.type === "finish-round"
            ? { bg: "rgba(74,0,26,0.74)", border: "rgba(255,64,120,0.86)", text: "#fff0f6", accent: "#ffe16a" }
          : alert.type === "poison"
            ? { bg: "rgba(18,74,28,0.64)", border: "rgba(102,255,126,0.72)", text: "#eaffef", accent: "#96ff66" }
            : alert.type === "burnout" || alert.type === "spam-lock"
              ? { bg: "rgba(58,34,88,0.62)", border: "rgba(210,117,255,0.72)", text: "#f8e6ff", accent: "#ffd36a" }
              : { bg: "rgba(9,39,62,0.58)", border: "rgba(87,213,255,0.70)", text: "#e9fbff", accent: "#ffd36a" };
        return (
          <div
            key={alert.id}
            style={{
              position: "absolute",
              top: `${40 + index * 30}%`,
              left: isP1 ? "38%" : "62%",
              zIndex: 15,
              minWidth: "118px",
              maxWidth: "230px",
              padding: "6px 10px",
              color: palette.text,
              background: `linear-gradient(90deg, ${palette.bg}, rgba(0,0,0,0.34))`,
              border: `1px solid ${palette.border}`,
              borderLeft: `4px solid ${palette.accent}`,
              borderRadius: "999px",
              boxShadow: `0 0 14px ${palette.border}44`,
              fontFamily: "Trebuchet MS, Arial Black, sans-serif",
              fontWeight: 900,
              letterSpacing: "1px",
              textAlign: "center",
              pointerEvents: "none",
              animation: `bdSystemAlertIn ${SYSTEM_ALERT_LIFETIME_MS}ms ease-out forwards`,
              textTransform: "uppercase",
              backdropFilter: "blur(5px)",
            }}
          >
            <div style={{ fontSize: "11px", lineHeight: 1.1, textShadow: "0 1px 0 #000" }}>{alert.text}</div>
          </div>
        );
      })}
    </>
  );
}

function ScreenImpact({ shakeEvent }) {
  if (!shakeEvent?.id) return null;
  const duration = shakeEvent.critical ? CRITICAL_SHAKE_MS : SCREEN_SHAKE_MS;
  const power = shakeEvent.critical ? 14 : 9;
  return (
    <>
      <style>{`
        @keyframes bdImpactOverlay {
          0% { opacity: 0; transform: scale(1); }
          10% { opacity: ${shakeEvent.critical ? "0.68" : "0.21"}; transform: scale(1.012); }
          35% { opacity: ${shakeEvent.critical ? "0.34" : "0.11"}; transform: scale(1.006); }
          100% { opacity: 0; transform: scale(1); }
        }
        @keyframes bdScreenRumble${shakeEvent.id} {
          0% { transform: translate3d(0,0,0) rotate(0deg); }
          10% { transform: translate3d(${power}px, -${Math.round(power * 0.55)}px, 0) rotate(0.28deg); }
          20% { transform: translate3d(-${Math.round(power * 0.8)}px, ${Math.round(power * 0.55)}px, 0) rotate(-0.24deg); }
          33% { transform: translate3d(${Math.round(power * 0.65)}px, ${Math.round(power * 0.34)}px, 0) rotate(0.18deg); }
          48% { transform: translate3d(-${Math.round(power * 0.50)}px, -${Math.round(power * 0.46)}px, 0) rotate(-0.16deg); }
          66% { transform: translate3d(${Math.round(power * 0.32)}px, ${Math.round(power * 0.24)}px, 0) rotate(0.08deg); }
          100% { transform: translate3d(0,0,0) rotate(0deg); }
        }
        .bd-game-shell { animation: bdScreenRumble${shakeEvent.id} ${duration}ms cubic-bezier(.25,.8,.25,1); }
      `}</style>
      <div
        key={shakeEvent.id}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 6,
          pointerEvents: "none",
          opacity: 0,
          animation: `bdImpactOverlay ${duration}ms ease-out forwards`,
          background: shakeEvent.critical
            ? "radial-gradient(circle at center, rgba(255,0,0,0.18), rgba(90,0,0,0.40) 70%, rgba(0,0,0,0.12))"
            : "radial-gradient(circle at center, rgba(255,255,255,0.08), rgba(255,45,117,0.13) 72%, rgba(0,0,0,0.10))",
          boxShadow: shakeEvent.critical ? "inset 0 0 90px rgba(255,0,0,0.55)" : "inset 0 0 70px rgba(255,45,117,0.28)",
        }}
      />
    </>
  );
}

function CriticalFlash({ nonce }) {
  if (!nonce) return null;

  return (
    <>
      <style>{`
        @keyframes bdCriticalFlash {
          0% { opacity: 0; }
          8% { opacity: 0.86; }
          24% { opacity: 0.38; }
          44% { opacity: 0.72; }
          100% { opacity: 0; }
        }
      `}</style>
      <div
        key={nonce}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 9,
          background: "radial-gradient(circle at center, rgba(255,0,0,0.42), rgba(220,0,0,0.82), rgba(60,0,0,0.92))",
          mixBlendMode: "screen",
          pointerEvents: "none",
          animation: "bdCriticalFlash 620ms ease-out forwards",
        }}
      />
    </>
  );
}

function RoundFlowOverlay({ flow, game, matchSettings }) {
  if (!flow || flow.phase === "idle" || flow.phase === "live" || flow.phase === "roundOver" || flow.phase === "matchOver") return null;

  const loading = flow.phase === "loading";
  const stage = getStageOption(matchSettings?.stageId);
  const p1Name = game?.p1?.name?.toUpperCase?.() ?? "P1";
  const p2Name = game?.p2?.name?.toUpperCase?.() ?? "P2";
  const finalRound = (game?.roundNumber ?? 1) >= MAX_POSSIBLE_ROUNDS;
  const fightSignal = !loading && flow.count === 1;
  const headline = loading ? (finalRound ? "FINAL ROUND" : "LOADING") : fightSignal ? "FIGHT!" : flow.count;
  const subhead = loading
    ? `${stage.name.toUpperCase()} / ROUND ${game.roundNumber}`
    : fightSignal
      ? (finalRound ? "LAST ROUND - SETTLE IT" : "SHOW OUT")
      : finalRound
        ? "FINAL ROUND STARTS"
        : "ROUND STARTS";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        background: loading
          ? "radial-gradient(circle at center, rgba(45,125,255,0.16), rgba(0,0,0,0.78) 55%, rgba(80,0,10,0.24) 100%)"
          : "radial-gradient(circle at center, rgba(255,38,35,0.10), rgba(0,0,0,0.38) 62%, rgba(0,0,0,0.72))",
        color: "#fffaf0",
        fontFamily: MENU_FONT,
        textAlign: "center",
        textShadow: "3px 3px 0 #000, -2px 0 22px rgba(45,125,255,0.46), 2px 0 22px rgba(255,38,35,0.36)",
      }}
    >
      <style>{`
        @keyframes bdRoundPulse { 0%,100%{ transform: scale(1); filter: brightness(1); } 50%{ transform: scale(1.06); filter: brightness(1.18); } }
        @keyframes bdLoadBars { 0%{ transform: translateX(-110%); } 100%{ transform: translateX(110%); } }
      `}</style>
      <div style={{ width: "min(720px, 86vw)" }}>
        <div style={{ fontSize: loading ? "58px" : "132px", letterSpacing: loading ? "5px" : "8px", lineHeight: 0.9, animation: "bdRoundPulse 900ms ease-in-out infinite" }}>
          {headline}
        </div>
        <div style={{ marginTop: "18px", fontSize: "22px", letterSpacing: "4px", color: "#bfdcff" }}>
          {subhead}
        </div>
        <div style={{ marginTop: "12px", fontSize: "18px", letterSpacing: "2px", color: "rgba(255,255,255,0.72)" }}>
          {p1Name} VS {p2Name}
        </div>
        {loading && (
          <div style={{ position: "relative", height: "10px", margin: "28px auto 0", width: "min(440px, 70vw)", overflow: "hidden", borderRadius: "999px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(192,226,255,0.36)" }}>
            <div style={{ position: "absolute", inset: 0, width: "60%", background: "linear-gradient(90deg, transparent, #2d7dff, #ffffff, #ff2623, transparent)", animation: "bdLoadBars 1.1s linear infinite" }} />
          </div>
        )}
      </div>
    </div>
  );
}

function RoundResultOverlay({ game, matchSettings, roundStats, onRunBack, onMenu, onNextStory, hasNextStory }) {
  const cleanName = (name) => (name ?? "FIGHTER").toUpperCase().replace(/\s+(BEGINNER|MEDIUM|HARD|EXTREME|CRITICAL)$/, "");
  const p1Name = cleanName(game.p1?.name);
  const p2Name = cleanName(game.p2?.name);
  const winnerName = game.matchWinner === "p1" ? p1Name : game.matchWinner === "p2" ? p2Name : "";
  const isDraw = game.roundWinner === "draw";
  const roundWinnerFighter = game.roundWinner === "p1" ? game.p1 : game.roundWinner === "p2" ? game.p2 : null;
  const perfectRound = !!roundWinnerFighter && (roundWinnerFighter.hp ?? 0) >= (roundWinnerFighter.maxHp ?? 100) - 0.5;
  const storyCleared = matchSettings.aiMode === "story" && game.matchWinner === "p1" && !hasNextStory;
  const roundOnly = !game.matchOver;

  const title = game.matchOver
    ? storyCleared
      ? "RUN CLEARED"
      : `${winnerName} WINS`
    : isDraw
      ? "DOUBLE KO"
      : perfectRound
        ? "PERFECT"
      : `${game.roundWinner === "p1" ? p1Name : p2Name} TAKES IT`;

  const subtitle = game.matchOver
    ? storyCleared
      ? "THE WHOLE BLOCK GOT WORK"
      : "FIRST TO 3 SETTLED"
    : isDraw
      ? (game.roundFinishReason === "timeout" ? "TIME OVER - NO WINNER" : "SAME BAR. SAME SCARS. RUN IT BACK.")
      : perfectRound
        ? `${game.roundWinner === "p1" ? p1Name : p2Name} DID NOT GET TOUCHED`
        : game.roundFinishReason === "timeout"
          ? `TIME OVER - ${game.roundWinner === "p1" ? p1Name : p2Name} LEADS`
      : `FIRST TO ${ROUNDS_TO_WIN} / NEXT ROUND LOADING`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 22,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "radial-gradient(circle at center, rgba(45,125,255,0.14), rgba(0,0,0,0.70) 54%, rgba(90,0,12,0.42) 100%)",
        color: "#fffaf0",
        fontFamily: MENU_FONT,
        letterSpacing: "2px",
        textShadow: "3px 3px 0 #000, -2px 0 18px rgba(45,125,255,0.42), 2px 0 18px rgba(255,38,35,0.34)",
      }}
    >
      <style>{`
        @keyframes bdResultDrop { from{ opacity:0; transform: translateY(28px) scale(.96); } to{ opacity:1; transform: translateY(0) scale(1); } }
      `}</style>
      <div style={{ position: "relative", width: roundOnly ? "min(560px, 78vw)" : "min(760px, 88vw)", minHeight: roundOnly ? "0" : "unset", padding: roundOnly ? "24px 28px" : "30px 34px", border: "1px solid rgba(192,226,255,0.34)", background: "linear-gradient(135deg, rgba(0,24,76,0.84), rgba(7,7,8,0.94) 48%, rgba(80,0,10,0.84))", boxShadow: "0 0 44px rgba(45,125,255,0.22), 0 0 44px rgba(255,38,35,0.16), inset 0 0 28px rgba(255,255,255,0.08)", borderRadius: "8px", animation: "bdResultDrop 320ms ease-out both", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", boxSizing: "border-box" }}>
        <div style={{ width: "100%", fontSize: roundOnly ? "clamp(40px, 6vw, 74px)" : "clamp(48px, 7vw, 86px)", lineHeight: 0.9, color: isDraw ? "#ffdf8a" : "#fffaf0", textAlign: "center" }}>
          {title}
        </div>
        <div style={{ width: "100%", maxWidth: roundOnly ? "470px" : "620px", marginTop: "14px", fontSize: roundOnly ? "16px" : "18px", letterSpacing: "2px", color: isDraw ? "#f8fbff" : "#bfdcff", textAlign: "center", lineHeight: 1.25 }}>
          {subtitle}
        </div>
        <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: roundOnly ? "20px" : "24px", fontSize: "22px", flexWrap: "wrap", textAlign: "center" }}>
          <ScorePipRow name={p1Name} wins={game.wins?.p1 ?? 0} />
          <ScorePipRow name={p2Name} wins={game.wins?.p2 ?? 0} reverse />
        </div>
        <RoundStatsStrip p1Name={p1Name} p2Name={p2Name} roundStats={roundStats} />
        {!game.matchOver && (
          <div style={{ width: "100%", marginTop: "20px", fontSize: "16px", color: "rgba(232,242,255,0.72)", textAlign: "center" }}>
            AUTO STARTING...
          </div>
        )}
        {game.matchOver && (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "28px" }}>
            {hasNextStory && (
              <button onClick={onNextStory} className="bd-menu-button" style={{ ...menuButtonStyle, width: "260px", marginBottom: 0 }}>
                NEXT BATTLE
              </button>
            )}
            <button onClick={onRunBack} className="bd-menu-button" style={{ ...menuButtonStyle, width: "230px", marginBottom: 0 }}>
              RUN IT BACK
            </button>
            <button onClick={onMenu} className="bd-menu-button" style={{ ...menuButtonStyle, width: "220px", marginBottom: 0 }}>
              MAIN MENU
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PauseMenu({ controls, setControls, musicEnabled, setMusicEnabled, matchSettings, setMatchSettings, onResume, onMenu, mobile = false }) {
  const [listeningFor, setListeningFor] = useState(null);
  const difficultyOptions = [
    { id: "easy", label: "BEGINNER" },
    { id: "medium", label: "STANDARD" },
    { id: "hard", label: "PROUD" },
    { id: "extreme", label: "CRITICAL" },
  ];
  const attackLabels = {
    lightPunch: "LIGHT PUNCH",
    heavyPunch: "HEAVY PUNCH",
    heavyPunch2: "HEAVY PUNCH 2",
    lightKick: "LIGHT KICK",
    heavyKick: "HEAVY KICK",
    crouch: "CROUCH",
    block: "BLOCK",
    taunt: "TAUNT",
  };

  useEffect(() => {
    if (!listeningFor) return;

    const captureKey = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      if (normalizeInputKey(e.key) === "escape") {
        setListeningFor(null);
        return;
      }

      const nextKey = normalizeInputKey(e.key);
      setControls(prev => ({
        ...prev,
        [listeningFor.player]: {
          ...prev[listeningFor.player],
          [listeningFor.action]: nextKey,
        },
      }));
      setListeningFor(null);
    };

    window.addEventListener("keydown", captureKey, { once: true, capture: true });
    return () => window.removeEventListener("keydown", captureKey, { capture: true });
  }, [listeningFor, setControls]);

  const ControlRows = ({ playerKey, title }) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "13px", letterSpacing: "2px", color: "rgba(232,242,255,0.78)", marginBottom: "8px" }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "7px" }}>
        {Object.entries(attackLabels).map(([action, label]) => (
          <button
            key={`${playerKey}-${action}`}
            onClick={() => setListeningFor({ player: playerKey, action })}
            className="bd-menu-button"
            style={{
              ...menuButtonStyle,
              width: "100%",
              minHeight: "0",
              padding: "8px 10px",
              marginBottom: 0,
              fontSize: "12px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span>{label}</span>
            <span style={{ color: "#bfdcff" }}>{(controls[playerKey][action] ?? DEFAULT_CONTROLS[playerKey][action] ?? "").toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={mobile ? "bd-pause-overlay bd-pause-overlay-mobile" : "bd-pause-overlay"}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 35,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center, rgba(45,125,255,0.12), rgba(0,0,0,0.72) 54%, rgba(90,0,12,0.48) 100%)",
        color: "#fffaf0",
        fontFamily: MENU_FONT,
        letterSpacing: mobile ? "1px" : "2px",
        textShadow: "3px 3px 0 #000, -2px 0 18px rgba(45,125,255,0.38), 2px 0 18px rgba(255,38,35,0.30)",
      }}
    >
      <div
        className="bd-pause-panel"
        style={{
          width: mobile ? "min(100%, calc(100vw - 18px))" : "min(930px, 92vw)",
          maxHeight: mobile ? "calc(100dvh - 18px)" : "88vh",
          overflow: "auto",
          padding: mobile ? "12px" : "26px",
          border: "1px solid rgba(192,226,255,0.34)",
          borderRadius: "8px",
          background: "linear-gradient(135deg, rgba(0,24,76,0.88), rgba(7,7,8,0.96) 48%, rgba(80,0,10,0.88))",
          boxShadow: "0 0 44px rgba(45,125,255,0.22), 0 0 44px rgba(255,38,35,0.16), inset 0 0 28px rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: mobile ? "10px" : "18px", alignItems: "center", marginBottom: mobile ? "12px" : "20px", flexWrap: mobile ? "wrap" : "nowrap" }}>
          <div>
            <div style={{ fontSize: mobile ? "clamp(30px, 9vw, 44px)" : "clamp(46px, 6vw, 76px)", lineHeight: 0.86 }}>PAUSED</div>
            <div style={{ marginTop: "8px", fontSize: mobile ? "10px" : "13px", color: "rgba(232,242,255,0.68)" }}>{matchSettings.stageId?.toUpperCase?.() ?? "STAGE"} / ROUND SETTINGS</div>
          </div>
          <button onClick={onResume} className="bd-menu-button" style={{ ...menuButtonStyle, width: mobile ? "140px" : "190px", minHeight: mobile ? "42px" : menuButtonStyle.minHeight, padding: mobile ? "8px 12px" : menuButtonStyle.padding, fontSize: mobile ? "16px" : menuButtonStyle.fontSize, marginBottom: 0 }}>RESUME</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(220px, 0.75fr) minmax(360px, 1.25fr)", gap: mobile ? "12px" : "18px", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "12px" }}>
            <button onClick={() => setMusicEnabled(v => !v)} className="bd-menu-button" style={{ ...menuButtonStyle, width: "100%", marginBottom: 0 }}>
              MUSIC: {musicEnabled ? "ON" : "OFF"}
            </button>
            {matchSettings.mode === "ai" && (
              <div style={{ display: "grid", gap: "8px" }}>
                <div style={{ fontSize: "13px", color: "rgba(232,242,255,0.72)" }}>AI DIFFICULTY</div>
                {difficultyOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setMatchSettings(prev => ({ ...prev, difficulty: option.id }))}
                    className="bd-menu-button"
                    style={{
                      ...menuButtonStyle,
                      ...selectedMenuStyle(matchSettings.difficulty === option.id, { width: "100%", minHeight: "0", padding: "10px 12px", marginBottom: 0, fontSize: "14px" }),
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onMenu} className="bd-menu-button" style={{ ...menuButtonStyle, width: "100%", marginBottom: 0, borderColor: "rgba(255,71,87,0.62)" }}>
              MAIN MENU
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: mobile ? "10px" : "14px" }}>
            <ControlRows playerKey="p1" title="PLAYER 1 CONTROLS" />
            <ControlRows playerKey="p2" title="PLAYER 2 CONTROLS" />
          </div>
        </div>

        {listeningFor && (
          <div style={{ marginTop: "18px", textAlign: "center", color: "#bfdcff", fontSize: "14px" }}>
            SET {attackLabels[listeningFor.action]}...
          </div>
        )}
      </div>
    </div>
  );
}

function RoundStatsStrip({ p1Name, p2Name, roundStats }) {
  const p1 = roundStats?.p1 ?? makePlayerRoundStats();
  const p2 = roundStats?.p2 ?? makePlayerRoundStats();
  const rows = [
    { label: "DMG", p1: damageText(p1.damage), p2: damageText(p2.damage) },
    { label: "BEST", p1: `${p1.bestCombo ?? 0} HIT`, p2: `${p2.bestCombo ?? 0} HIT` },
    { label: "COUNTER", p1: p1.counters ?? 0, p2: p2.counters ?? 0 },
    { label: "P GUARD", p1: p1.perfectGuards ?? 0, p2: p2.perfectGuards ?? 0 },
    { label: "CLASH", p1: p1.clashes ?? 0, p2: p2.clashes ?? 0 },
    { label: "WALL", p1: p1.wallBounces ?? 0, p2: p2.wallBounces ?? 0 },
    { label: "TAUNT", p1: p1.taunts ?? 0, p2: p2.taunts ?? 0 },
    { label: "PUNISH", p1: p1.punishes ?? 0, p2: p2.punishes ?? 0 },
  ];

  return (
    <div style={{ width: "100%", maxWidth: "560px", marginTop: "18px", border: "1px solid rgba(192,226,255,0.28)", borderRadius: "7px", overflow: "hidden", background: "linear-gradient(90deg, rgba(0,20,58,0.42), rgba(0,0,0,0.32), rgba(86,0,11,0.42))", boxShadow: "inset 0 0 16px rgba(255,255,255,0.05)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 92px 1fr", padding: "7px 10px", fontSize: "11px", color: "rgba(232,242,255,0.76)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p1Name}</div>
        <div style={{ textAlign: "center", color: "#fff4c8" }}>ROUND STATS</div>
        <div style={{ textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p2Name}</div>
      </div>
      {rows.map(row => (
        <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1fr 92px 1fr", alignItems: "center", padding: "5px 10px", fontSize: "13px", color: "#f8fbff", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ textAlign: "left", color: "#bfe8ff" }}>{row.p1}</div>
          <div style={{ textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.58)", letterSpacing: "1px" }}>{row.label}</div>
          <div style={{ textAlign: "right", color: "#ffd0cc" }}>{row.p2}</div>
        </div>
      ))}
      {(p1.firstHit || p2.firstHit) && (
        <div style={{ padding: "6px 10px", textAlign: "center", fontSize: "11px", color: "#ffe16a", borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          FIRST HIT: {p1.firstHit ? p1Name : p2Name}
        </div>
      )}
    </div>
  );
}

function ScorePipRow({ name, wins, reverse }) {
  return (
    <div style={{ minWidth: "210px", textAlign: reverse ? "right" : "left" }}>
      <div style={{ fontSize: "12px", letterSpacing: "2px", color: "rgba(232,242,255,0.72)", marginBottom: "7px" }}>{name}</div>
      <div style={{ display: "flex", gap: "7px", justifyContent: reverse ? "flex-end" : "flex-start" }}>
        {Array.from({ length: ROUNDS_TO_WIN }, (_, index) => (
          <div
            key={index}
            style={{
              width: "22px",
              height: "12px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.62)",
              background: index < wins ? "linear-gradient(90deg, #2d7dff, #ffffff, #ff2623)" : "rgba(0,0,0,0.58)",
              boxShadow: index < wins ? "0 0 14px rgba(45,125,255,0.36), 0 0 14px rgba(255,38,35,0.28)" : "inset 0 0 6px rgba(255,255,255,0.14)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RoundBadge({ roundNumber, timer = 99 }) {
  const urgent = timer <= 10;
  return (
    <div
      style={{
        justifySelf: "center",
        width: "96px",
        height: "98px",
        position: "relative",
        color: "#fff7ff",
        fontFamily: "Impact, Arial Black, sans-serif",
        textAlign: "center",
        filter: "drop-shadow(-5px 0 12px rgba(45,125,255,0.58)) drop-shadow(5px 0 12px rgba(255,38,35,0.54))",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "5px 7px 12px",
          border: "2px solid rgba(255,255,255,0.74)",
          background: "linear-gradient(135deg, rgba(0,35,104,0.82), rgba(4,6,14,0.76) 48%, rgba(116,0,14,0.82))",
          boxShadow: "inset 0 0 18px rgba(255,255,255,0.14), -5px 0 18px rgba(45,125,255,0.32), 5px 0 18px rgba(255,38,35,0.30)",
          clipPath: "polygon(12% 0, 88% 0, 100% 50%, 88% 100%, 12% 100%, 0 50%)",
        }}
      />
      <div style={{ position: "relative", fontSize: "42px", lineHeight: "56px", textShadow: "2px 2px 0 #000, -2px 0 12px #2d7dff, 2px 0 12px #ff2623" }}>
        R{roundNumber}
      </div>
      <div style={{ position: "relative", marginTop: "-6px", fontSize: "11px", letterSpacing: "2px", color: "#e7f2ff" }}>
        ROUND
      </div>
      <div style={{ position: "relative", margin: "4px auto 0", width: "62px", padding: "2px 0", borderRadius: "999px", border: `1px solid ${urgent ? "rgba(255,64,85,0.94)" : "rgba(255,244,214,0.56)"}`, background: urgent ? "rgba(96,0,20,0.72)" : "rgba(0,0,0,0.58)", color: urgent ? "#ffdf8a" : "#fffaf0", fontSize: "20px", lineHeight: "22px", boxShadow: urgent ? "0 0 18px rgba(255,45,85,0.52)" : "inset 0 0 8px rgba(255,255,255,0.10)" }}>
        {String(Math.max(0, timer)).padStart(2, "0")}
      </div>
    </div>
  );
}

function Hud({ name, label, hp, maxHp = 100, wins = 0, hype = false, reverse }) {
  const [shownHp, setShownHp] = useState(hp);
  const [damageGhostHp, setDamageGhostHp] = useState(hp);
  const [barBurst, setBarBurst] = useState(null);
  const previousHp = useRef(hp);

  useEffect(() => {
    let frame;
    const tick = () => {
      setShownHp(current => {
        const diff = hp - current;
        if (Math.abs(diff) < 0.12) return hp;
        return current + diff * 0.09;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [hp]);

  useEffect(() => {
    if (hp > damageGhostHp) {
      setDamageGhostHp(hp);
      return;
    }

    const delay = setTimeout(() => {
      let frame;
      const tick = () => {
        setDamageGhostHp(current => {
          const diff = hp - current;
          if (Math.abs(diff) < 0.12) return hp;
          return current + diff * 0.045;
        });
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, 360);

    return () => clearTimeout(delay);
  }, [hp, damageGhostHp]);

  useEffect(() => {
    const lastHp = previousHp.current;
    previousHp.current = hp;

    if (hp >= lastHp - 0.05) return;

    const lossPct = ((lastHp - hp) / Math.max(1, maxHp)) * 100;
    const count = Math.max(7, Math.min(18, Math.ceil(lossPct * 1.05)));
    const direction = reverse ? -1 : 1;
    const nextBurst = {
      id: `${Date.now()}-${Math.random()}`,
      particles: Array.from({ length: count }, (_, index) => ({
        id: index,
        dx: direction * (12 + Math.random() * 68) + (Math.random() - 0.5) * 22,
        dy: -30 + Math.random() * 54,
        size: 4 + Math.random() * 5,
        delay: Math.random() * 80,
        rotate: -120 + Math.random() * 240,
      })),
    };

    setBarBurst(nextBurst);
    const clearBurst = setTimeout(() => setBarBurst(current => current?.id === nextBurst.id ? null : current), 640);
    return () => clearTimeout(clearBurst);
  }, [hp, maxHp, reverse]);

  const hpValue = Math.max(0, Math.min(100, (shownHp / Math.max(1, maxHp)) * 100));
  const ghostValue = Math.max(0, Math.min(100, (damageGhostHp / Math.max(1, maxHp)) * 100));
  const danger = hpValue <= COMEBACK_HEALTH_THRESHOLD;
  const impactEdge = reverse ? 100 - hpValue : hpValue;
  const palette = reverse
    ? { main: "#ff2623", deep: "#7c020b", dark: "#230407", light: "#ffd0cc", glow: "rgba(255,38,35,0.66)", ghost: "rgba(255,160,154,0.54)" }
    : { main: "#2d7dff", deep: "#063d87", dark: "#07172c", light: "#bfe8ff", glow: "rgba(45,125,255,0.68)", ghost: "rgba(159,216,255,0.55)" };
  const frameClip = reverse
    ? "polygon(0 0, 87% 0, 92% 19%, 100% 19%, 94% 50%, 100% 81%, 92% 81%, 87% 100%, 0 100%, 5% 81%, 0 81%, 6% 50%, 0 19%, 5% 19%)"
    : "polygon(0 19%, 8% 19%, 13% 0, 100% 0, 95% 19%, 100% 19%, 94% 50%, 100% 81%, 95% 81%, 100% 100%, 13% 100%, 8% 81%, 0 81%, 6% 50%)";
  const nameClip = reverse
    ? "polygon(0 0, 100% 0, 100% 72%, 93% 72%, 87% 100%, 6% 100%, 12% 78%, 0 78%, 6% 50%, 0 22%, 12% 22%)"
    : "polygon(0 22%, 12% 22%, 6% 0, 94% 0, 88% 22%, 100% 22%, 94% 50%, 100% 78%, 88% 78%, 94% 100%, 13% 100%, 7% 72%, 0 72%, 6% 50%)";
  const barName = String(name ?? "").toUpperCase();
  const barLabel = String(label ?? "").toUpperCase();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minWidth: 0,
        height: "98px",
        color: "white",
        fontFamily: "Arial Black, Impact, sans-serif",
        filter: `drop-shadow(0 0 12px ${palette.glow}) drop-shadow(0 2px 0 rgba(0,0,0,0.9))${hype ? " drop-shadow(0 0 18px rgba(255,211,106,0.72))" : ""}`,
      }}
    >
      <style>{`
        @keyframes bdHypeBadgePulse {
          0%,100% { transform: scale(1); opacity: .82; filter: brightness(1); }
          50% { transform: scale(1.08); opacity: 1; filter: brightness(1.28); }
        }
        @keyframes bdHudHealthShake {
          0% { transform: translate3d(0,0,0) rotate(0deg); }
          14% { transform: translate3d(${reverse ? "-7px" : "7px"}, -2px, 0) rotate(${reverse ? "-0.8deg" : "0.8deg"}); }
          28% { transform: translate3d(${reverse ? "5px" : "-5px"}, 2px, 0) rotate(${reverse ? "0.5deg" : "-0.5deg"}); }
          44% { transform: translate3d(${reverse ? "-3px" : "3px"}, 1px, 0) rotate(${reverse ? "-0.3deg" : "0.3deg"}); }
          64% { transform: translate3d(${reverse ? "2px" : "-2px"}, 0, 0) rotate(0deg); }
          100% { transform: translate3d(0,0,0) rotate(0deg); }
        }
        @keyframes bdHudBloodSpray {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.55) rotate(0deg); }
          12% { opacity: 1; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.25) rotate(var(--rot)); }
        }
        @keyframes bdElectricCrawl {
          0% { background-position: 0 0, 0 0, 0 0; opacity: .54; }
          34% { opacity: .92; }
          100% { background-position: ${reverse ? "-150px" : "150px"} 0, ${reverse ? "118px" : "-118px"} 0, 0 0; opacity: .62; }
        }
        @keyframes bdElectricEdgePulse {
          0%,100% { opacity: .72; transform: translateY(-50%) scaleY(.84); filter: blur(.2px); }
          18% { opacity: 1; transform: translateY(-50%) scaleY(1.18); filter: blur(0); }
          42% { opacity: .44; transform: translateY(-50%) scaleY(.72); }
          68% { opacity: 1; transform: translateY(-50%) scaleY(1.05); }
        }
        @keyframes bdElectricBoltJitter {
          0%,100% { opacity: .34; transform: translate3d(0,0,0) skewX(-18deg); }
          18% { opacity: .94; transform: translate3d(${reverse ? "-5px" : "5px"}, -1px, 0) skewX(-24deg); }
          46% { opacity: .26; transform: translate3d(${reverse ? "4px" : "-4px"}, 1px, 0) skewX(-12deg); }
          72% { opacity: .82; transform: translate3d(${reverse ? "-2px" : "2px"}, 0, 0) skewX(-20deg); }
        }
        @keyframes bdNameElectricCrawl {
          0% { background-position: 0 0, 0 0; opacity: .42; }
          35% { opacity: .92; }
          100% { background-position: ${reverse ? "-110px" : "110px"} 0, ${reverse ? "86px" : "-86px"} 0; opacity: .50; }
        }
        @keyframes bdNameSpark {
          0%,100% { opacity: .35; transform: translate3d(0,0,0) skewX(-20deg); }
          22% { opacity: .95; transform: translate3d(${reverse ? "-4px" : "4px"}, -1px, 0) skewX(-28deg); }
          56% { opacity: .22; transform: translate3d(${reverse ? "3px" : "-3px"}, 1px, 0) skewX(-12deg); }
          78% { opacity: .78; transform: translate3d(${reverse ? "-2px" : "2px"}, 0, 0) skewX(-22deg); }
        }
      `}</style>

      {(hype || danger) && (
        <div
          style={{
            position: "absolute",
            top: "76px",
            [reverse ? "right" : "left"]: reverse ? "98px" : "98px",
            zIndex: 8,
            padding: "3px 9px",
            minWidth: "58px",
            textAlign: "center",
            color: hype ? "#fff4c8" : "#ffd0d0",
            background: hype
              ? "linear-gradient(90deg, rgba(114,52,0,0.88), rgba(255,38,35,0.76), rgba(45,125,255,0.72))"
              : "linear-gradient(90deg, rgba(95,0,12,0.86), rgba(0,0,0,0.72))",
            border: hype ? "1px solid rgba(255,211,106,0.92)" : "1px solid rgba(255,64,84,0.72)",
            boxShadow: hype ? "0 0 18px rgba(255,211,106,0.52), 0 0 20px rgba(255,38,35,0.34)" : "0 0 14px rgba(255,0,32,0.42)",
            fontSize: "11px",
            letterSpacing: "1px",
            textShadow: "2px 2px 0 #000",
            clipPath: "polygon(8% 0, 100% 0, 92% 100%, 0 100%)",
            animation: hype ? "bdHypeBadgePulse 650ms ease-in-out infinite" : "bdHypeBadgePulse 940ms ease-in-out infinite",
          }}
        >
          {hype ? "HYPE" : "DANGER"}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          [reverse ? "right" : "left"]: 0,
          width: "190px",
          height: "34px",
          padding: "4px 24px",
          boxSizing: "border-box",
          clipPath: nameClip,
          background: `linear-gradient(${reverse ? "270deg" : "90deg"}, rgba(255,255,255,0.85), ${palette.main} 12%, rgba(2,4,10,0.98) 36%, ${palette.deep})`,
          borderTop: `1px solid rgba(255,255,255,0.74)`,
          borderBottom: `1px solid ${palette.main}`,
          boxShadow: `inset 0 0 14px ${palette.glow}, 0 0 16px ${palette.glow}, 0 0 24px rgba(255,255,255,0.10)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `
              repeating-linear-gradient(${reverse ? "64deg" : "116deg"}, transparent 0 11px, rgba(255,255,255,0.62) 12px 13px, transparent 14px 25px),
              repeating-linear-gradient(${reverse ? "116deg" : "64deg"}, transparent 0 20px, ${palette.light} 21px 22px, transparent 23px 40px)
            `,
            backgroundSize: "72px 34px, 96px 34px",
            mixBlendMode: "screen",
            opacity: 0.58,
            animation: "bdNameElectricCrawl 760ms linear infinite",
            pointerEvents: "none",
          }}
        />
        {[0, 1].map(index => (
          <div
            key={`name-bolt-${index}`}
            style={{
              position: "absolute",
              [reverse ? "left" : "right"]: `${10 + index * 21}px`,
              top: `${8 + index * 12}px`,
              width: `${42 - index * 9}px`,
              height: "3px",
              background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent, #ffffff, ${palette.light}, transparent)`,
              clipPath: "polygon(0 42%, 34% 42%, 47% 0, 60% 100%, 73% 44%, 100% 44%, 100% 72%, 66% 72%, 55% 100%, 42% 0, 30% 68%, 0 68%)",
              boxShadow: `0 0 8px #fff, 0 0 14px ${palette.main}`,
              mixBlendMode: "screen",
              opacity: 0.54,
              animation: `bdNameSpark ${440 + index * 130}ms steps(2, end) infinite`,
              pointerEvents: "none",
            }}
          />
        ))}
        <div style={{ position: "relative", zIndex: 2, width: "100%", fontSize: "18px", lineHeight: 1, letterSpacing: "1px", color: "#fff7f2", textShadow: "2px 2px 0 #000", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {barName}
        </div>
        <div style={{ position: "relative", zIndex: 2, width: "100%", marginTop: "3px", fontSize: "10px", letterSpacing: "1px", color: "rgba(255,255,255,0.72)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {barLabel}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "6px",
          [reverse ? "left" : "right"]: "12px",
          display: "flex",
          gap: "7px",
          flexDirection: reverse ? "row-reverse" : "row",
        }}
      >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              title={`Round ${i + 1}`}
              style={{
                width: "13px",
                height: "13px",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.78)",
                background: i < wins ? `radial-gradient(circle, #fff7b3 0%, #ffcf6b 42%, ${palette.main} 100%)` : "rgba(0,0,0,0.68)",
                boxShadow: i < wins ? `0 0 12px ${palette.main}` : "inset 0 0 6px rgba(255,255,255,0.22)",
              }}
            />
          ))}
      </div>

      <div
        key={`health-frame-${barBurst?.id ?? "steady"}`}
        style={{
          position: "absolute",
          top: "42px",
          left: reverse ? 0 : "82px",
          right: reverse ? "82px" : 0,
          height: "30px",
          padding: "3px",
          background: `linear-gradient(${reverse ? "270deg" : "90deg"}, rgba(255,255,255,0.98), ${palette.main} 22%, rgba(255,255,255,0.72) 36%, ${palette.deep} 100%)`,
          clipPath: frameClip,
          borderRadius: "0",
          boxShadow: `0 0 18px ${palette.glow}, 0 0 30px ${palette.glow}, inset 0 0 12px rgba(255,255,255,0.26)`,
          overflow: "hidden",
          animation: barBurst ? "bdHudHealthShake 280ms cubic-bezier(.2,.8,.2,1)" : "none",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", background: palette.dark, overflow: "hidden", clipPath: frameClip, borderRadius: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${ghostValue}%`,
              marginLeft: reverse ? "auto" : 0,
              right: reverse ? 0 : "auto",
              background: `linear-gradient(${reverse ? "270deg" : "90deg"}, ${palette.ghost}, rgba(255,255,255,0.28))`,
              transition: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${hpValue}%`,
              marginLeft: reverse ? "auto" : 0,
              right: reverse ? 0 : "auto",
              background: danger
                ? `linear-gradient(${reverse ? "270deg" : "90deg"}, #7b0012, #ff1738, #ffcf6b)`
                : `linear-gradient(${reverse ? "270deg" : "90deg"}, ${palette.deep}, ${palette.main}, ${palette.light})`,
              boxShadow: danger ? "0 0 20px rgba(255,0,0,0.9), 0 0 16px rgba(255,211,106,0.44)" : `0 0 16px ${palette.glow}`,
              transition: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: `${hpValue}%`,
              marginLeft: reverse ? "auto" : 0,
              right: reverse ? 0 : "auto",
              overflow: "hidden",
              background: `
                repeating-linear-gradient(${reverse ? "64deg" : "116deg"}, transparent 0 10px, rgba(255,255,255,0.92) 11px 12px, transparent 13px 24px),
                repeating-linear-gradient(${reverse ? "116deg" : "64deg"}, transparent 0 18px, ${palette.light} 19px 21px, transparent 22px 38px),
                radial-gradient(circle at ${reverse ? "82%" : "18%"} 50%, rgba(255,255,255,0.62), transparent 36%)
              `,
              backgroundSize: "72px 28px, 96px 30px, 100% 100%",
              mixBlendMode: "screen",
              opacity: 0.72,
              animation: "bdElectricCrawl 700ms linear infinite",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `calc(${impactEdge}% - 5px)`,
              top: "50%",
              width: "10px",
              height: "42px",
              borderRadius: "999px",
              background: `linear-gradient(180deg, transparent, #ffffff 18%, ${palette.light} 48%, #ffffff 78%, transparent)`,
              boxShadow: `0 0 14px #ffffff, 0 0 22px ${palette.main}, 0 0 30px ${palette.main}`,
              mixBlendMode: "screen",
              animation: "bdElectricEdgePulse 520ms steps(2, end) infinite",
              pointerEvents: "none",
            }}
          />
          {[0, 1, 2].map(index => (
            <div
              key={`bolt-${index}`}
              style={{
                position: "absolute",
                left: `calc(${impactEdge}% ${reverse ? "+" : "-"} ${18 + index * 13}px)`,
                top: `${5 + index * 6}px`,
                width: `${28 + index * 10}px`,
                height: "3px",
                background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent, #ffffff, ${palette.light}, transparent)`,
                clipPath: "polygon(0 40%, 36% 40%, 48% 0, 62% 100%, 75% 42%, 100% 42%, 100% 70%, 68% 70%, 56% 100%, 43% 0, 31% 68%, 0 68%)",
                boxShadow: `0 0 9px #fff, 0 0 16px ${palette.main}`,
                mixBlendMode: "screen",
                opacity: 0.55,
                animation: `bdElectricBoltJitter ${420 + index * 110}ms steps(2, end) infinite`,
                pointerEvents: "none",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 2px, transparent 2px 22px)",
              mixBlendMode: "screen",
              opacity: 0.42,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(255,255,255,0.24), transparent 48%, rgba(0,0,0,0.28))",
              mixBlendMode: "screen",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: "74px",
          [reverse ? "left" : "right"]: 0,
          minWidth: "82px",
          padding: "3px 8px",
          textAlign: reverse ? "left" : "right",
          color: "#fff8fb",
          fontSize: "13px",
          lineHeight: 1,
          letterSpacing: "1px",
          background: "rgba(0,0,0,0.52)",
          border: `1px solid ${palette.main}`,
          boxShadow: `0 0 10px ${palette.glow}`,
          textShadow: "2px 2px 0 #000, 0 0 8px rgba(255,255,255,0.35)",
          clipPath: reverse
            ? "polygon(0 0, 100% 0, 92% 100%, 0 100%)"
            : "polygon(8% 0, 100% 0, 100% 100%, 0 100%)",
        }}
      >
        {pct(hpValue)} HP
      </div>

      {barBurst && (
        <div
          key={`health-blood-${barBurst.id}`}
          style={{
            position: "absolute",
            top: "34px",
            left: reverse ? 0 : "82px",
            right: reverse ? "82px" : 0,
            height: "62px",
            pointerEvents: "none",
            overflow: "visible",
            zIndex: 4,
          }}
        >
          {barBurst.particles.map(particle => (
            <div
              key={particle.id}
              style={{
                position: "absolute",
                left: `${impactEdge}%`,
                top: "14px",
                width: `${particle.size}px`,
                height: `${Math.max(2, particle.size * 1.45)}px`,
                borderRadius: "999px",
                background: particle.id % 3 === 0
                  ? "radial-gradient(circle at 35% 24%, #ff6b78, #7a0010 66%, #300004)"
                  : "radial-gradient(circle at 35% 24%, #ff4055, #b00019 68%, #4b0008)",
                border: "1px solid rgba(255,76,94,0.32)",
                boxShadow: "0 0 10px rgba(255,0,32,0.82)",
                opacity: 0,
                transformOrigin: "center",
                "--dx": `${particle.dx}px`,
                "--dy": `${particle.dy}px`,
                "--rot": `${particle.rotate}deg`,
                animation: `bdHudBloodSpray 560ms ease-out ${particle.delay}ms forwards`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StaminaGauge({ stamina, maxStamina = 100, reverse }) {
  const staminaValue = (Math.max(0, Math.min(maxStamina ?? 100, stamina)) / Math.max(1, maxStamina ?? 100)) * 100;
  const segments = 10;
  const staminaPct = Math.round(staminaValue);
  const palette = reverse
    ? { main: "#ff2623", deep: "#7c020b", light: "#ffd0cc", glow: "rgba(255,38,35,0.58)", shadow: "#5f0008" }
    : { main: "#2d7dff", deep: "#063d87", light: "#bfe8ff", glow: "rgba(45,125,255,0.58)", shadow: "#003a7a" };
  const staminaEdge = reverse ? 100 - staminaValue : staminaValue;

  return (
      <div
        style={{
          width: "330px",
          height: "58px",
          display: "flex",
          alignItems: "flex-end",
          gap: "10px",
          flexDirection: reverse ? "row-reverse" : "row",
          color: "#dff9ff",
          fontFamily: "Impact, Arial Black, sans-serif",
          filter: `drop-shadow(0 0 12px ${palette.glow}) drop-shadow(0 2px 0 #000)`,
        }}
      >
        <style>{`
          @keyframes bdStaminaElectricCrawl {
            0% { background-position: 0 0, 0 0, 0 0; opacity: .50; }
            40% { opacity: .95; }
            100% { background-position: ${reverse ? "-120px" : "120px"} 0, ${reverse ? "96px" : "-96px"} 0, 0 0; opacity: .62; }
          }
          @keyframes bdStaminaEdgePulse {
            0%,100% { opacity: .65; transform: translateY(-50%) scaleY(.8); }
            22% { opacity: 1; transform: translateY(-50%) scaleY(1.28); }
            48% { opacity: .36; transform: translateY(-50%) scaleY(.68); }
            74% { opacity: .94; transform: translateY(-50%) scaleY(1.08); }
          }
          @keyframes bdStaminaBoltJitter {
            0%,100% { opacity: .32; transform: skewX(-18deg) translate3d(0,0,0); }
            20% { opacity: .88; transform: skewX(-24deg) translate3d(${reverse ? "-4px" : "4px"}, -1px, 0); }
            55% { opacity: .26; transform: skewX(-12deg) translate3d(${reverse ? "3px" : "-3px"}, 1px, 0); }
            78% { opacity: .72; transform: skewX(-20deg) translate3d(${reverse ? "-2px" : "2px"}, 0, 0); }
          }
        `}</style>
        <div
          style={{
            position: "relative",
            flex: 1,
            height: "24px",
            padding: "3px",
            background: `linear-gradient(${reverse ? "270deg" : "90deg"}, rgba(255,255,255,0.9), ${palette.main} 34%, ${palette.deep})`,
            borderRadius: "999px",
            boxShadow: `0 0 16px ${palette.glow}`,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%", background: "#031622", overflow: "hidden", borderRadius: "999px" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${staminaValue}%`,
              marginLeft: reverse ? "auto" : 0,
              right: reverse ? 0 : "auto",
              background: `linear-gradient(${reverse ? "270deg" : "90deg"}, ${palette.main}, ${palette.light})`,
              boxShadow: `0 0 12px ${palette.main}`,
              transition: "width 0.08s",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: `${staminaValue}%`,
              marginLeft: reverse ? "auto" : 0,
              right: reverse ? 0 : "auto",
              overflow: "hidden",
              background: `
                repeating-linear-gradient(${reverse ? "64deg" : "116deg"}, transparent 0 9px, rgba(255,255,255,0.88) 10px 11px, transparent 12px 22px),
                repeating-linear-gradient(${reverse ? "116deg" : "64deg"}, transparent 0 16px, ${palette.light} 17px 19px, transparent 20px 34px),
                radial-gradient(circle at ${reverse ? "82%" : "18%"} 50%, rgba(255,255,255,0.54), transparent 38%)
              `,
              backgroundSize: "62px 22px, 84px 24px, 100% 100%",
              mixBlendMode: "screen",
              opacity: 0.72,
              animation: "bdStaminaElectricCrawl 640ms linear infinite",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `calc(${staminaEdge}% - 4px)`,
              top: "50%",
              width: "8px",
              height: "34px",
              borderRadius: "999px",
              background: `linear-gradient(180deg, transparent, #ffffff 18%, ${palette.light} 48%, #ffffff 78%, transparent)`,
              boxShadow: `0 0 12px #ffffff, 0 0 20px ${palette.main}, 0 0 28px ${palette.main}`,
              mixBlendMode: "screen",
              animation: "bdStaminaEdgePulse 480ms steps(2, end) infinite",
              pointerEvents: "none",
              zIndex: 3,
            }}
          />
          {[0, 1].map(index => (
            <div
              key={`stamina-bolt-${index}`}
              style={{
                position: "absolute",
                left: `calc(${staminaEdge}% ${reverse ? "+" : "-"} ${14 + index * 15}px)`,
                top: `${6 + index * 8}px`,
                width: `${32 + index * 9}px`,
                height: "3px",
                background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent, #ffffff, ${palette.light}, transparent)`,
                clipPath: "polygon(0 42%, 34% 42%, 47% 0, 60% 100%, 73% 44%, 100% 44%, 100% 72%, 66% 72%, 55% 100%, 42% 0, 30% 68%, 0 68%)",
                boxShadow: `0 0 8px #fff, 0 0 14px ${palette.main}`,
                mixBlendMode: "screen",
                opacity: 0.50,
                animation: `bdStaminaBoltJitter ${380 + index * 120}ms steps(2, end) infinite`,
                pointerEvents: "none",
                zIndex: 3,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateColumns: `repeat(${segments}, 1fr)`,
              gap: "3px",
              padding: "1px 2px",
              opacity: 0.78,
            }}
          >
            {Array.from({ length: segments }, (_, index) => (
              <div key={index} style={{ borderRight: index === segments - 1 ? "none" : "2px solid rgba(0,10,18,0.64)" }} />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(255,255,255,0.45), transparent 45%, rgba(0,0,0,0.28))",
              mixBlendMode: "screen",
            }}
          />
        </div>
      </div>
      <div
        style={{
          width: "76px",
          textAlign: reverse ? "right" : "left",
          fontFamily: "Impact, Arial Black, sans-serif",
          color: "#f5fbff",
          textShadow: `2px 2px 0 ${palette.shadow}, 0 0 14px ${palette.main}`,
        }}
      >
        <div style={{ fontSize: "21px", lineHeight: 1 }}>{staminaPct}%</div>
        <div style={{ fontSize: "9px", letterSpacing: "1px", color: "rgba(224,248,255,0.70)" }}>STAMINA</div>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
const root = globalThis.__HANDZ_OR_ROUNDZ_ROOT__ ?? createRoot(container);
globalThis.__HANDZ_OR_ROUNDZ_ROOT__ = root;
root.render(<App />);
