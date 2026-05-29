import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import "./style.css";

const SKITZ_MODEL_URL = "/models/urban_noir_fighter.glb"; // Skitz uses the original GLB body because that build matched his FBX animations best.
const MODEL_URL = SKITZ_MODEL_URL;
const SKITZ_TEXTURE_URL = "/skitz/Meshy_AI_Urban_Noir_0514212211_texture_fbx/Meshy_AI_Urban_Noir_0514212211_texture.png";

function applyTextureToModel(model, texture) {
  if (!model || !texture) return;
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    const nextMaterials = materials.map((mat) => {
      const cloned = mat.clone();
      cloned.map = texture;
      cloned.needsUpdate = true;
      return cloned;
    });
    child.material = Array.isArray(child.material) ? nextMaterials : nextMaterials[0];
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
  heavyKick2:  "/skitz/heavykick2.fbx",
  punchReaction: "/skitz/punchreaction.fbx",
  kickReaction:  "/skitz/kickreaction.fbx",
  heavyKickReaction: "/skitz/heavykickreaction.fbx",
  heavyHitAttackReaction: "/skitz/heavyhitattackreaction.fbx",
  standingReaction: "/skitz/standingreaction.fbx",
  flyingBackDamageReaction: "/skitz/Flyingbackdamagereaction.fbx",
  getUpAfterDamage: "/skitz/gettingupafterdamage.fbx",
  faceHit:     "/skitz/Receive Punch To The Face.fbx",
  stunned:     "/skitz/heavypunch2reaction.fbx",
  die:         "/skitz/die.fbx",
  block:       "/skitz/Block.fbx",          // ← NEW
};

const JOSE_MODEL_URL = "/jose/idle.fbx"; // Jose idle.fbx includes his full skinned mesh.

const JOSE_ANIMATION_URLS = {
  idle:        "/jose/idle.fbx",
  walk:        "/jose/walking.fbx",
  back:        "/jose/walking.fbx",
  crouch:      "/jose/crouch.fbx",
  jump:        "/jose/idle.fbx",
  punch1:      "/jose/punch1.fbx",
  punch2:      "/jose/punch2.fbx",
  punch3:      "/jose/punch3.fbx",
  heavyPunch1: "/jose/heavypunch1.fbx",
  heavyPunch2: "/jose/heavypunch1.fbx",
  kick1:       "/jose/kick1.fbx",
  kick2:       "/jose/kick2.fbx",
  kick3:       "/jose/kick3.fbx",
  heavyKick1:  "/jose/heavykick1.fbx",
  heavyKick2:  "/jose/heavykick2.fbx",
  punchReaction: "/jose/punchreact1.fbx",
  punch2Reaction: "/jose/punch2react.fbx",
  kickReaction:  "/jose/kickreact1.fbx",
  heavyKickReaction: "/jose/heavyattackstun1.fbx",
  heavyHitAttackReaction: "/jose/heavyattackstun2.fbx",
  standingReaction: "/jose/punchreact1.fbx",
  flyingBackDamageReaction: "/jose/heavyattackstun2.fbx",
  getUpAfterDamage: "/jose/getup.fbx",
  faceHit:     "/jose/punchreact1.fbx",
  stunned:     "/jose/heavyattackstun1.fbx",
  die:         "/jose/punchreact1.fbx",
  block:       "/jose/block.fbx",
};

function getAnimationUrls(characterId) {
  return characterId === "jose" ? JOSE_ANIMATION_URLS : ANIMATION_URLS;
}

function getModelUrl(characterId) {
  return characterId === "jose" ? JOSE_MODEL_URL : MODEL_URL;
}

function getModelLoader(characterId) {
  // Hybrid setup:
  // Skitz goes back to the original GLB body from the build where his combat animations worked.
  // Jose stays on his own /jose/idle.fbx skinned mesh because that setup is currently working.
  return characterId === "jose" ? FBXLoader : GLTFLoader;
}

function getLoadedModelRoot(asset) {
  return asset?.scene ?? asset;
}

function brightenFighterMaterials(model, characterId) {
  if (!model) return;
  model.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((mat) => {
      if (!mat) return;
      mat.side = THREE.DoubleSide;
      if (typeof mat.roughness === "number") mat.roughness = Math.min(mat.roughness, 0.58);
      if (typeof mat.metalness === "number") mat.metalness = Math.min(mat.metalness, 0.22);
      if (mat.color) mat.color.multiplyScalar(characterId === "skitz" ? 1.22 : 1.14);
      if ("emissive" in mat) {
        mat.emissive = new THREE.Color(characterId === "skitz" ? "#111111" : "#0b0b0b");
        mat.emissiveIntensity = characterId === "skitz" ? 0.18 : 0.12;
      }
      mat.needsUpdate = true;
    });
  });
}

function fitModelToFighter(model, characterId, targetHeight = 1.95) {
  if (!model) return;
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);

  // Skitz: keep the original GLB scale/rig placement from the working build.
  // Scaling or centering Skitz was what made him sink, crop, or turn sideways during reactions.
  if (characterId === "skitz") {
    model.scale.setScalar(1);
    model.userData.fighterOffset = new THREE.Vector3(0, 0, 0);
    model.userData.fighterScaleReady = true;
    brightenFighterMaterials(model, characterId);
    return;
  }

  // Jose: his FBX imports at different sizes, so normalize only Jose.
  model.scale.setScalar(1);
  let box = new THREE.Box3().setFromObject(model);
  let size = new THREE.Vector3();
  box.getSize(size);
  if (size.y > 0) {
    const fitScale = targetHeight / size.y;
    model.scale.setScalar(fitScale);
  }

  model.userData.fighterOffset = new THREE.Vector3(0, 0, 0);
  model.userData.fighterScaleReady = true;
  brightenFighterMaterials(model, characterId);
}

// ─── Exact frame counts ───────────────────────────────────────────────────────
const ANIM_FRAMES = {
  idle:        422,
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
  stunned:     98,
  die:         64,
  jump:        52,
  block:       41,   // NEW
};

const JOSE_ANIM_FRAMES = {
  idle:        322,
  walk:        60,
  back:        60,
  crouch:      22,
  punch1:      16,
  punch2:      16,
  punch3:      18,
  heavyPunch1: 17,
  heavyPunch2: 17,
  kick1:       15,
  kick2:       15,
  kick3:       36,
  heavyKick1:  17,
  heavyKick2:  36,
  punchReaction: 36,
  punch2Reaction: 37,
  kickReaction: 40,
  heavyKickReaction: 50,
  heavyHitAttackReaction: 35,
  standingReaction: 36,
  flyingBackDamageReaction: 35,
  getUpAfterDamage: 98,
  faceHit:     36,
  stunned:     50,
  die:         36,
  jump:        322,
  block:       24,
};

function getAnimFrames(characterId) {
  return characterId === "jose" ? JOSE_ANIM_FRAMES : ANIM_FRAMES;
}

const SOURCE_FPS = 30;

function animDuration(key, characterId = "skitz") {
  const frames = getAnimFrames(characterId);
  return (frames[key] ?? ANIM_FRAMES[key] ?? 30) / SOURCE_FPS;
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
  punch1:      [ 8 / SOURCE_FPS,  8 / SOURCE_FPS],
  punch2:      [ 8 / SOURCE_FPS,  8 / SOURCE_FPS],
  punch3:      [ 5 / SOURCE_FPS,  5 / SOURCE_FPS],
  kick1:       [14 / SOURCE_FPS, 14 / SOURCE_FPS],
  kick2:       [14 / SOURCE_FPS, 14 / SOURCE_FPS],
  heavyPunch1: [ 8 / SOURCE_FPS,  8 / SOURCE_FPS],
  heavyPunch2: [ 8 / SOURCE_FPS,  8 / SOURCE_FPS],
};

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
  heavyKick1: [4, 9],
  kick3: [16, 21],
  heavyKick2: [14, 20],
};

function getHitWindows(characterId) {
  return characterId === "jose" ? JOSE_HIT_WINDOWS : HIT_WINDOWS;
}

function getMultiHitFrames(characterId, key) {
  return characterId === "jose" ? JOSE_MULTI_HIT_FRAMES[key] : MULTI_HIT_FRAMES[key];
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

const COMBO_WINDOW_MS = 700;
const BLOCK_STAMINA_MULTIPLIER = 1.6;
const STAMINA_GUARD_BREAK_SPILLOVER = 0.35;
const HIT_REACTION_DELAY_MS = 70;
const KICK_REACTION_SLOW_SCALE = 0.78;
const KICK_REACTION_LOCK_MS = 520;
const STANDING_REACTION_LOCK_MS = 360;
const KNOCKDOWN_LOCK_BUFFER_MS = 160;
const HIT_REACTION_LOCK_MS = 90;
const BEST_OF_ROUNDS = 3;
const ROUNDS_TO_WIN = 2;
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
};

// These make combos feel intentional instead of button-mashy.
// Inputs during an attack are queued, then released only after the current move
// has had enough time to visibly play.
const COMBO_QUEUE_BUFFER_MS = 950;
const ATTACK_FINISH_BUFFER_MS = 80;
const PUSHBACK_BASE = 0.095;
const PUSHBACK_HEAVY = 0.19;
const PUSHBACK_CRITICAL = 0.29;
const MULTI_HIT_PUSHBACK = 0.025;
const ATTACKER_RECOIL_BASE = 0.012;
const COMBO_FINISHER_RECOVERY_MS = 360;
const LIGHT_HITSTUN_MS = 260;
const FINISHER_HITSTUN_MS = 340;
const HITBOX_GRACE_RANGE = 0.22;
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
};
const LOCK_FAILSAFE_PAD_MS = 260;
const CRITICAL_ZOOM_MS = 760;
const CRITICAL_ZOOM_AMOUNT = 1.22;
const LOW_HEALTH_CAMERA_THRESHOLD = 28;
const LOW_HEALTH_ZOOM_AMOUNT = 0.52;
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
  // P1: crouch and block are separate. Jose's heavies require crouch + attack.
  p1: { lightPunch: "e", heavyPunch: "f", heavyPunch2: "r", lightKick: "c", heavyKick: "v", crouch: "s", block: "shift" },
  p2: { lightPunch: "u", heavyPunch: "o", heavyPunch2: "p", lightKick: "n", heavyKick: "m", crouch: "k", block: "h" },
};


const SYSTEM_ALERT_LIFETIME_MS = 1500;
const LOW_STAMINA_THRESHOLD = 24;
const SYSTEM_ALERT_COOLDOWN_MS = 850;

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
    available: true,
  },
  {
    id: "jose",
    name: "Jose",
    tag: "Best stamina in the game",
    maxHp: 100,
    staminaMax: 135,
    staminaRegenScale: 1.55,
    staminaCostScale: 0.72,
    damageScale: 0.95,
    damageTakenScale: 0.96,
    passive: "Abilities: best stamina in the game. Crouch unlocks heavy attacks. Fast kicks and strong pressure.",
    available: true,
  },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `mystery-${i + 1}`,
    name: "???",
    tag: "COMING SOON",
    maxHp: 100,
    staminaMax: 100,
    staminaRegenScale: 1,
    staminaCostScale: 1,
    damageScale: 1,
    damageTakenScale: 1,
    passive: "Mystery fighter slot",
    available: false,
  })),
];

const CHARACTER_STATS = {
  skitz: CHARACTER_ROSTER.find(c => c.id === "skitz"),
  jose: CHARACTER_ROSTER.find(c => c.id === "jose"),
  default: { id: "default", name: "Opponent", maxHp: 100, staminaMax: 100, staminaRegenScale: 1, staminaCostScale: 1, damageScale: 1, damageTakenScale: 1, passive: "None" },
};

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
  punch1:      { cost: 6,  damage: 4, reach: 1.46, stun: false },
  punch2:      { cost: 6,  damage: 4, reach: 1.48, stun: false },
  punch3:      { cost: 8,  damage: 7, reach: 1.52, stun: false },
  heavyPunch1: { cost: 22, damage: 12, reach: 1.54, stun: true  },
  heavyPunch2: { cost: 28, damage: 14, reach: 1.56, stun: true  },
  kick1:       { cost: 7,  damage: 5, reach: 1.58, stun: false },
  kick2:       { cost: 7,  damage: 5, reach: 1.60, stun: false },
  kick3:       { cost: 12, damage: 5, reach: 1.72, stun: false },
  heavyKick1:  { cost: 45, damage: 10, reach: 1.75, stun: true  },
  heavyKick2:  { cost: 45, damage: 12, reach: 1.84, stun: true  },
};

function getMoveData(characterId, moveKey) {
  return (characterId === "jose" ? JOSE_MOVE_DATA : MOVE_DATA)[moveKey];
}

const ATTACK_ACTION_SET = new Set(Object.keys(MOVE_DATA));

function makeFighter(x, name, characterId = "default") {
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

const menuButtonStyle = {
  width: "370px",
  padding: "14px 22px",
  marginBottom: "12px",
  background:
    "linear-gradient(90deg, rgba(12,8,11,0.96), rgba(55,8,25,0.86)), repeating-linear-gradient(-8deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 9px)",
  border: "2px solid #ff2d75",
  borderLeft: "0 solid transparent",
  color: "#f8e6ff",
  fontFamily: "Impact, fantasy",
  fontSize: "22px",
  letterSpacing: "2px",
  textAlign: "left",
  cursor: "pointer",
  textShadow: "2px 2px 0 #000, 0 0 10px #ff2d75",
  boxShadow: "0 10px 24px rgba(0,0,0,0.62), inset 0 0 20px rgba(255,255,255,0.04), 0 0 22px rgba(255, 45, 117, 0.30)",
  transform: "skewX(-4deg)",
  borderRadius: "18px 6px 18px 6px",
};

const menuSmallTextStyle = {
  color: "rgba(255, 235, 185, 0.72)",
  fontFamily: "Arial, sans-serif",
  fontSize: "13px",
  letterSpacing: "1px",
  lineHeight: "1.5",
  maxWidth: "430px",
};

function MainMenu({ onStartAI, onStartLAN, controls, setControls, musicEnabled, setMusicEnabled }) {
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [listeningFor, setListeningFor] = useState(null);

  const attackLabels = {
    lightPunch: "LIGHT PUNCH",
    heavyPunch: "HEAVY PUNCH",
    heavyPunch2: "HEAVY PUNCH 2",
    lightKick: "LIGHT KICK",
    heavyKick: "HEAVY KICK",
    crouch: "CROUCH",
    block: "BLOCK",
  };

  useEffect(() => {
    if (!listeningFor) return;

    const captureKey = (e) => {
      e.preventDefault();
      const nextKey = e.key.toLowerCase() === " " ? "space" : e.key.toLowerCase();
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

  const ControlPanel = ({ playerKey, title }) => (
    <div style={{ marginTop: "10px", marginBottom: "16px", width: "390px" }}>
      <div style={{ color: "#ffcf6b", fontFamily: "Impact, fantasy", letterSpacing: "2px", marginBottom: "8px" }}>{title}</div>
      {Object.entries(attackLabels).map(([action, label]) => (
        <button
          key={`${playerKey}-${action}`}
          onClick={() => setListeningFor({ player: playerKey, action })}
          className="bd-menu-button"
          style={{
            ...menuButtonStyle,
            width: "390px",
            fontSize: "15px",
            padding: "9px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <span>{label}</span>
          <span style={{ color: "#ffffff", background: "rgba(0,0,0,0.35)", padding: "3px 9px", borderRadius: "8px" }}>
            {listeningFor?.player === playerKey && listeningFor?.action === action ? "PRESS KEY" : controls[playerKey][action].toUpperCase()}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="bd-menu-shell"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 5px), radial-gradient(circle at 78% 30%, rgba(143,25,78,0.48), transparent 28%), radial-gradient(circle at 70% 75%, rgba(0,213,255,0.20), transparent 30%), linear-gradient(115deg, #020204 0%, #100612 28%, #2b0b18 58%, #05151d 100%)",
        backgroundSize: "150% 150%",
        animation: "bdMenuHeat 8s ease-in-out infinite alternate",
      }}
    >
      <style>{`
        @keyframes bdMenuHeat {
          0% { background-position: 0% 50%; filter: saturate(1); }
          100% { background-position: 100% 50%; filter: saturate(1.28); }
        }
        @keyframes bdMenuSlideIn {
          0% { opacity: 0; transform: translateX(-44px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes bdMenuPulse {
          0%, 100% { transform: scale(1) rotate(-18deg); opacity: 0.32; }
          50% { transform: scale(1.05) rotate(-14deg); opacity: 0.62; }
        }
        @keyframes bdMenuReady {
          0%, 100% { opacity: 0.22; transform: skewX(-8deg) translateY(0); }
          50% { opacity: 0.44; transform: skewX(-8deg) translateY(-8px); }
        }
        @keyframes bdTagDrift {
          0% { transform: translateY(0) rotate(-7deg); opacity: 0.22; }
          50% { transform: translateY(-10px) rotate(-5deg); opacity: 0.36; }
          100% { transform: translateY(0) rotate(-7deg); opacity: 0.22; }
        }
        .bd-menu-title { animation: bdMenuSlideIn 650ms ease-out both; }
        .bd-menu-list { animation: bdMenuSlideIn 850ms ease-out 150ms both; }
        .bd-menu-button { transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease; }
        .bd-menu-button:hover { transform: translateX(14px) skewX(-4deg) scale(1.025); box-shadow: 9px 9px 0 rgba(0,0,0,0.85), 0 0 34px rgba(255, 20, 90, 0.70); filter: contrast(1.15); }
        .bd-menu-button:active { transform: translateX(8px) skewX(-4deg) scale(0.98); }
        .bd-menu-button::selection { background: #ff2d75; color: white; }
      `}</style>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.18) 100%)" }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.42,
          background:
            "repeating-linear-gradient(90deg, transparent 0 38px, rgba(255,45,117,0.08) 39px 40px), repeating-linear-gradient(0deg, transparent 0 18px, rgba(255,255,255,0.035) 19px 20px)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "7%",
          bottom: "8%",
          width: "360px",
          height: "190px",
          transform: "rotate(-5deg)",
          border: "3px dashed rgba(255,207,107,0.22)",
          boxShadow: "inset 0 0 40px rgba(255,45,117,0.18)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "absolute", right: "8%", top: "10%", color: "rgba(255,255,255,0.10)", fontFamily: "Impact, fantasy", fontSize: "110px", letterSpacing: "10px", transform: "rotate(-7deg)", animation: "bdTagDrift 5s ease-in-out infinite" }}>
        NC CYPHER
      </div>
      <div style={{ position: "absolute", right: "10%", top: "29%", color: "rgba(255,60,120,0.18)", fontFamily: "Impact, fantasy", fontSize: "62px", letterSpacing: "7px", transform: "rotate(-7deg)" }}>
        704 / 919
      </div>
      <div style={{ position: "absolute", right: "9%", bottom: "22%", color: "rgba(0,213,255,0.15)", fontFamily: "Impact, fantasy", fontSize: "84px", letterSpacing: "8px", transform: "rotate(4deg)" }}>
        TRAIN TRACK BATTLE
      </div>

      <div style={{ position: "absolute", left: "-70px", bottom: "-110px", width: "660px", height: "660px", opacity: 0.48, borderRadius: "50%", border: "4px solid rgba(255, 30, 110, 0.23)", boxShadow: "0 0 80px rgba(255, 20, 90, 0.24)", transform: "rotate(-18deg)", animation: "bdMenuPulse 5s ease-in-out infinite" }} />

      <div className="bd-menu-title" style={{ position: "absolute", left: "72px", top: "58px", color: "#f8e6ff", textShadow: "0 0 14px #ff246f, 0 0 30px rgba(0,213,255,0.5)", fontFamily: "Impact, fantasy", letterSpacing: "3px" }}>
        <div style={{ fontSize: "48px", lineHeight: "0.95" }}>BATTLE DANCER</div>
        <div style={{ fontSize: "25px", color: "#ffcf6b", marginTop: "8px" }}>HANDS OR ROUNDS?</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginTop: "6px", fontFamily: "Arial Black, Impact, sans-serif", letterSpacing: "2px" }}>
          UNDERPASS MODE • NC NIGHTMARE BUILD
        </div>
        <div style={{ marginTop: "16px", height: "2px", width: "430px", background: "linear-gradient(90deg, #ffcf6b, rgba(255,207,107,0))" }} />
      </div>

      <div className="bd-menu-list" style={{ position: "absolute", left: "82px", top: "195px", display: "flex", flexDirection: "column" }}>
        <button onClick={() => setShowDifficulty(!showDifficulty)} className="bd-menu-button" style={menuButtonStyle}>1 PLAYER VS AI</button>

        {showDifficulty && (
          <div style={{ marginLeft: "24px", marginBottom: "14px" }}>
            {["easy", "medium", "hard", "extreme"].map((difficulty) => (
              <button key={difficulty} onClick={() => onStartAI(difficulty)} className="bd-menu-button" style={{ ...menuButtonStyle, width: "300px", fontSize: "18px", padding: "10px 18px", marginBottom: "8px", borderColor: difficulty === "extreme" ? "#ff4d8f" : "#ffcf6b", color: difficulty === "extreme" ? "#ffbad3" : "#ffe8aa" }}>
                {difficulty.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <button onClick={onStartLAN} className="bd-menu-button" style={menuButtonStyle}>2 PLAYERS LAN</button>

        <button onClick={() => setShowControls(!showControls)} className="bd-menu-button" style={menuButtonStyle}>CHANGE ATTACK CONTROLS</button>

        <button onClick={() => setMusicEnabled(v => !v)} className="bd-menu-button" style={menuButtonStyle}>
          MUSIC: {musicEnabled ? "ON" : "OFF"}
        </button>

        {showControls && (
          <div style={{ maxHeight: "45vh", overflowY: "auto", paddingRight: "14px" }}>
            <ControlPanel playerKey="p1" title="PLAYER 1 ATTACKS" />
            <ControlPanel playerKey="p2" title="PLAYER 2 ATTACKS" />
          </div>
        )}

        <div style={menuSmallTextStyle}>
          Default P1 heavy punch 2 is now R. Put 99buck.mp3 inside your public folder so the game can load it as /99buck.mp3.
        </div>
      </div>

      <div style={{ position: "absolute", right: "48px", bottom: "36px", color: "rgba(255, 218, 152, 0.32)", fontFamily: "Impact, fantasy", fontSize: "90px", letterSpacing: "8px", transform: "skewX(-8deg)", textShadow: "0 0 26px rgba(255, 91, 0, 0.28)", animation: "bdMenuReady 3s ease-in-out infinite" }}>
        READY?
      </div>
    </div>
  );
}


function CharacterPreviewModel({ big = false, locked = false, characterId = "skitz" }) {
  const animationUrls = getAnimationUrls(characterId);
  const baseAsset = useLoader(getModelLoader(characterId), getModelUrl(characterId));
  const skitzTexture = useLoader(THREE.TextureLoader, SKITZ_TEXTURE_URL);
  const idleFbx = useLoader(FBXLoader, animationUrls.idle);
  const model = useMemo(() => SkeletonUtils.clone(getLoadedModelRoot(baseAsset)), [baseAsset]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);

  useEffect(() => {
    fitModelToFighter(model, characterId, big ? 2.75 : 1.75);
  }, [model, characterId, big]);

  useEffect(() => {
    // Apply Skitz's PNG texture onto the GLB body (which has no embedded texture).
    if (characterId === "skitz") applyTextureToModel(model, skitzTexture);
  }, [model, skitzTexture, characterId]);

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
    model.position.set(0, big ? -1.02 : -0.96, 0);
  });

  return <primitive object={model} scale={characterId === "skitz" ? (locked ? 0.82 : big ? 1.28 : 0.9) : 1} />;
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
          "radial-gradient(circle at 52% 38%, rgba(255,207,107,0.22), transparent 23%), radial-gradient(circle at 62% 58%, rgba(255,45,117,0.22), transparent 38%), linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,0.48))",
        borderLeft: "1px solid rgba(255,207,107,0.14)",
      }}
    >
      <div style={{ position: "absolute", right: "7%", top: "8%", fontSize: "118px", letterSpacing: "10px", color: "rgba(255,255,255,0.055)", transform: "rotate(-7deg)", pointerEvents: "none" }}>
        {available ? character.name : "LOCKED"}
      </div>
      {available ? (
        <Canvas camera={{ position: [0, 0.35, 5.7], fov: 36 }}>
          <ambientLight intensity={1.45} />
          <directionalLight position={[2.5, 4, 4]} intensity={1.55} />
          <pointLight position={[-2, 2, 3]} intensity={0.6} color="#ff2d75" />
          <Suspense fallback={null}>
            <CharacterPreviewModel big characterId={character.id} />
          </Suspense>
        </Canvas>
      ) : (
        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "220px", color: "rgba(255,255,255,0.10)", textShadow: "0 0 35px rgba(255,45,117,0.35)" }}>?</div>
      )}
      <div style={{ position: "absolute", left: "8%", bottom: "8%", right: "8%", color: "#fff1bd", fontFamily: "Impact, fantasy", textShadow: "2px 2px 0 #000, 0 0 18px rgba(255,45,117,0.6)" }}>
        <div style={{ fontSize: "68px", letterSpacing: "4px", lineHeight: 0.94 }}>{available ? character.name : "MYSTERY"}</div>
        <div style={{ marginTop: "10px", color: "#ffcf6b", fontSize: "22px", letterSpacing: "2px" }}>{available ? character.tag : "COMING SOON"}</div>
        <div style={{ marginTop: "14px", fontFamily: "Arial Black, Impact, sans-serif", fontSize: "14px", lineHeight: 1.45, maxWidth: "510px", color: "rgba(255,255,255,0.78)" }}>
          {available ? character.passive : "This fighter slot is locked for a future dancer."}
        </div>
      </div>
    </div>
  );
}

function CharacterSlotButton({ character, index, selected, onHover, onSelect }) {
  return (
    <button
      disabled={!character.available}
      onMouseEnter={() => onHover(character.id)}
      onFocus={() => onHover(character.id)}
      onClick={() => character.available && onSelect(character.id)}
      style={{
        minHeight: "86px",
        padding: "12px 14px",
        textAlign: "left",
        cursor: character.available ? "pointer" : "not-allowed",
        border: selected ? "2px solid #ffcf6b" : character.available ? "1px solid rgba(255,207,107,0.45)" : "1px dashed rgba(255,255,255,0.20)",
        borderLeft: selected ? "9px solid #ff2d75" : character.available ? "6px solid rgba(255,45,117,0.65)" : "6px solid rgba(255,255,255,0.12)",
        background: selected
          ? "linear-gradient(90deg, rgba(255,45,117,0.36), rgba(255,207,107,0.16), rgba(0,0,0,0.72))"
          : character.available
            ? "linear-gradient(90deg, rgba(255,45,117,0.16), rgba(0,0,0,0.72))"
            : "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(0,0,0,0.70))",
        color: character.available ? "#fff1bd" : "rgba(255,255,255,0.40)",
        boxShadow: selected ? "0 0 24px rgba(255,45,117,0.48), 8px 8px 0 rgba(0,0,0,0.55)" : "0 10px 20px rgba(0,0,0,0.35)",
        transform: selected ? "translateX(10px) skewX(-3deg)" : "skewX(-3deg)",
        borderRadius: "18px 5px 18px 5px",
        fontFamily: "Impact, fantasy",
        transition: "all 120ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px" }}>
        <div>
          <div style={{ fontSize: character.available ? "30px" : "28px", letterSpacing: "2px" }}>{character.available ? character.name : "???"}</div>
          <div style={{ marginTop: "2px", fontSize: "11px", color: character.available ? "#ffcf6b" : "rgba(255,255,255,0.35)", letterSpacing: "1.5px" }}>
            {character.available ? character.tag : `MYSTERY SLOT ${index}`}
          </div>
        </div>
        <div style={{ fontSize: "18px", color: selected ? "#ffcf6b" : "rgba(255,255,255,0.28)" }}>{selected ? "READY" : character.available ? "PICK" : "LOCKED"}</div>
      </div>
    </button>
  );
}

function CharacterSelect({ settings, onBack, onSelect }) {
  const [selectedId, setSelectedId] = useState("skitz");
  const selectedCharacter = CHARACTER_ROSTER.find(c => c.id === selectedId) ?? CHARACTER_ROSTER[0];

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background:
          "radial-gradient(circle at 72% 18%, rgba(255,45,117,0.28), transparent 30%), radial-gradient(circle at 20% 85%, rgba(0,213,255,0.18), transparent 34%), linear-gradient(135deg, #030305 0%, #110712 50%, #050b12 100%)",
        color: "#f8e6ff",
        fontFamily: "Impact, fantasy",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 6px)" }} />
      <BigCharacterShowcase character={selectedCharacter} />

      <div style={{ position: "absolute", left: "54px", top: "38px", letterSpacing: "3px", textShadow: "0 0 18px #ff2d75", zIndex: 4 }}>
        <div style={{ fontSize: "52px" }}>CHOOSE YOUR DANCER</div>
        <div style={{ fontSize: "16px", color: "#ffcf6b", marginTop: "6px" }}>
          {settings?.mode === "ai" ? `1 PLAYER VS AI • ${settings?.difficulty?.toUpperCase?.() ?? "MEDIUM"}` : "2 PLAYERS LAN"}
        </div>
      </div>

      <div style={{ position: "absolute", left: "54px", top: "136px", width: "42vw", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", zIndex: 4 }}>
        {CHARACTER_ROSTER.map((character, index) => (
          <CharacterSlotButton
            key={character.id}
            character={character}
            index={index}
            selected={selectedId === character.id}
            onHover={setSelectedId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div style={{ position: "absolute", left: "54px", bottom: "38px", display: "flex", gap: "14px", zIndex: 4 }}>
        <button onClick={onBack} className="bd-menu-button" style={{ ...menuButtonStyle, width: "220px" }}>
          BACK
        </button>
        <button
          onClick={() => selectedCharacter.available && onSelect(selectedCharacter.id)}
          disabled={!selectedCharacter.available}
          className="bd-menu-button"
          style={{ ...menuButtonStyle, width: "300px", borderColor: selectedCharacter.available ? "#ffcf6b" : "rgba(255,255,255,0.25)", opacity: selectedCharacter.available ? 1 : 0.45 }}
        >
          SELECT {selectedCharacter.available ? selectedCharacter.name.toUpperCase() : "LOCKED"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("menu");
  const [matchSettings, setMatchSettings] = useState({
    mode: null,
    difficulty: "medium",
    p1Character: "skitz",
  });
  const [pendingSettings, setPendingSettings] = useState(null);
  const [controls, setControls] = useState(DEFAULT_CONTROLS);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioRef = useRef(null);

  const [game, setGame] = useState({
    p1: makeFighter(-2.8, "Skitz", "skitz"),
    p2: makeFighter(2.8, "AI SKITZ", "skitz"),
    roundOver: false,
    matchOver: false,
    roundWinner: null,
    matchWinner: null,
    wins: { p1: 0, p2: 0 },
    roundNumber: 1,
    timer: 99,
  });
  const [visualEffects, setVisualEffects] = useState([]);
  const [combatPopups, setCombatPopups] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [comboHud, setComboHud] = useState({ p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } });
  const [shakeEvent, setShakeEvent] = useState({ id: 0, power: 0, critical: false });
  const [redFlashNonce, setRedFlashNonce] = useState(0);
  const [hitStopEvent, setHitStopEvent] = useState({ id: 0, critical: false });

  const keys = useRef({});
  const actionLocked = useRef({ p1: false, p2: false });
  const lockExpiresAt = useRef({ p1: 0, p2: 0 });
  const comboState = useRef({ p1: null, p2: null });
  const aiBrain = useRef({ lastDecision: 0, nextAttack: 0 });
  const effectId = useRef(1);
  const comboTimers = useRef({ p1: null, p2: null });
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

  function spawnCombatFeedback({ attackerKey, defenderKey, defenderX, damage, blocked, critical = false, textOverride = null, noCombo = false }) {
    const id = effectId.current++;
    const screenSide = defenderKey === "p1" ? "left" : "right";
    const popupLeft = defenderKey === "p1" ? "34%" : "66%";

    const shakePower = blocked ? 0.051 : critical ? 0.204 : 0.136;
    setShakeEvent(prev => ({ id: prev.id + 1, power: shakePower, critical }));
    if (critical) setRedFlashNonce(n => n + 1);
    if (!blocked) setHitStopEvent(prev => ({ id: prev.id + 1, critical }));

    setVisualEffects(list => [
      ...list,
      {
        id,
        type: blocked ? "blockSpark" : critical ? "criticalBlood" : "blood",
        x: defenderX,
        y: 1.15,
        z: 0,
        dir: defenderKey === "p1" ? -1 : 1,
        createdAt: performance.now(),
      },
    ]);

    const talkChance = critical ? CRITICAL_TALK_CHANCE : HIT_TALK_CHANCE;
    const shouldTalk = !blocked && !noCombo && Math.random() < talkChance;
    const talkLines = critical ? CRITICAL_TALK_LINES : HIT_TALK_LINES;
    const talkText = shouldTalk ? talkLines[Math.floor(Math.random() * talkLines.length)] : null;

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
        id: effectId.current++,
        text: talkText,
        left: attackerKey === "p1" ? "38%" : "62%",
        top: `${22 + Math.random() * 18}%`,
        side: attackerKey === "p1" ? "left" : "right",
        blocked: false,
        talk: true,
      }] : []),
    ]);

    if (!noCombo) {
      setComboHud(prev => {
        const current = prev[attackerKey] ?? { hits: 0, damage: 0 };
        return {
          ...prev,
          [attackerKey]: {
            hits: current.hits + 1,
            damage: current.damage + damage,
          },
        };
      });

      if (comboTimers.current[attackerKey]) clearTimeout(comboTimers.current[attackerKey]);
      comboTimers.current[attackerKey] = setTimeout(() => {
        setComboHud(prev => ({
          ...prev,
          [attackerKey]: { hits: 0, damage: 0 },
        }));
      }, 1200);
    }

    setTimeout(() => {
      setVisualEffects(list => list.filter(e => e.id !== id));
      setCombatPopups(list => list.filter(e => e.id !== id));
    }, Math.max(FLOAT_TEXT_LIFETIME_MS, BLOOD_LIFETIME_MS));
  }

  function resetMatch(settings = matchSettings) {
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
    setVisualEffects([]);
    setCombatPopups([]);
    setSystemAlerts([]);
    setShakeEvent({ id: 0, power: 0, critical: false });
    setRedFlashNonce(0);
    setHitStopEvent({ id: 0, critical: false });
    setComboHud({ p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } });

    const p1Stats = getCharacterStats(settings.p1Character ?? "skitz");
    setGame({
      p1: makeFighter(-2.8, p1Stats.name, settings.p1Character ?? "skitz"),
      p2: makeFighter(
        2.8,
        settings.mode === "ai" ? `AI SKITZ ${settings.difficulty.toUpperCase()}` : "SKITZ P2",
        "skitz"
      ),
      roundOver: false,
      matchOver: false,
      roundWinner: null,
      matchWinner: null,
      wins: { p1: 0, p2: 0 },
      roundNumber: 1,
      timer: 99,
    });
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
    setVisualEffects([]);
    setCombatPopups([]);
    setSystemAlerts([]);
    setComboHud({ p1: { hits: 0, damage: 0 }, p2: { hits: 0, damage: 0 } });

    setGame(g => ({
      ...g,
      p1: makeFighter(-2.8, getCharacterStats(matchSettings.p1Character ?? "skitz").name, matchSettings.p1Character ?? "skitz"),
      p2: makeFighter(
        2.8,
        matchSettings.mode === "ai" ? `AI SKITZ ${matchSettings.difficulty.toUpperCase()}` : "SKITZ P2",
        "skitz"
      ),
      roundOver: false,
      matchOver: false,
      roundWinner: null,
      matchWinner: null,
      roundNumber: Math.min(BEST_OF_ROUNDS, g.roundNumber + 1),
      timer: 99,
    }));
  }

  function openCharacterSelect(settings) {
    setPendingSettings(settings);
    setScreen("characterSelect");
  }

  function startAIMatch(difficulty) {
    openCharacterSelect({ mode: "ai", difficulty, p1Character: "skitz" });
  }

  function startLANMatch() {
    openCharacterSelect({ mode: "lan", difficulty: "medium", p1Character: "skitz" });
  }

  function confirmCharacter(characterId = "skitz") {
    const settings = { ...(pendingSettings ?? { mode: "ai", difficulty: "medium" }), p1Character: characterId };
    setMatchSettings(settings);
    resetMatch(settings);
    setScreen("fight");
  }

  function backToMenu() {
    keys.current = {};
    setScreen("menu");
  }

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
        if (g.roundOver || screen !== "fight") return g;
        return {
          ...g,
          p1: { ...g.p1, stamina: Math.min(g.p1.maxStamina ?? 100, g.p1.stamina + 0.15 * (g.p1.staminaRegenScale ?? 1)) },
          p2: { ...g.p2, stamina: Math.min(g.p2.maxStamina ?? 100, g.p2.stamina + 0.15 * (g.p2.staminaRegenScale ?? 1)) },
        };
      });
    }, 16);
    return () => clearInterval(regen);
  }, [screen]);

  // Key listeners
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase();

      if (["shift", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
        e.preventDefault();
      }

      keys.current[k] = true;

      if (screen !== "fight") return;

      if (k === "escape") backToMenu();

      const routeAttackInput = (playerKey, controlSet, fighter) => {
        const crouchHeld = !!keys.current[controlSet.crouch];
        const isJose = fighter?.characterId === "jose";

        // Jose update: heavy punches are normal standing inputs.
        // Only heavy kicks require crouch: S + V = heavyKick1, S + C = heavyKick2.
        if (isJose && crouchHeld && k === controlSet.heavyKick) return attack(playerKey, "heavyKick");
        if (isJose && crouchHeld && k === controlSet.lightKick) return attack(playerKey, "heavyKick2");

        if (k === controlSet.lightPunch) return attack(playerKey, "lightPunch");
        if (k === controlSet.heavyPunch) return attack(playerKey, "heavyPunch");
        if (k === controlSet.heavyPunch2) return attack(playerKey, "heavyPunch2");
        if (k === controlSet.lightKick) return attack(playerKey, "lightKick");
        if (k === controlSet.heavyKick) {
          if (isJose) {
            spawnSystemAlert(playerKey, "crouch-required", "CROUCH + HEAVY KICK");
            return;
          }
          return attack(playerKey, "heavyKick");
        }
      };

      routeAttackInput("p1", controls.p1, game.p1);

      // P2 attacks only in LAN mode. AI controls P2 in AI mode.
      if (matchSettings.mode === "lan") {
        routeAttackInput("p2", controls.p2, game.p2);
      }
    };

    const up = (e) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen, matchSettings, controls, game]);

  // ── Shared hitbox-check helper (used by both single-hit and multi-hit) ──────
  function fireHitbox(player, defenderKey, data, currentMove, damageOverride, attackToken) {
    setGame(latest => {
      if (attackToken && activeAttackToken.current[player] !== attackToken) return latest;
      if (latest[player]?.lastAction !== currentMove && ATTACK_ACTION_SET.has(currentMove)) return latest;
      const def = { ...latest[defenderKey] };
      const atk = latest[player];
      const dist = Math.abs(atk.x - def.x);

      if (knockdownInvulnerable.current[defenderKey]) return latest;
      if (dist > data.reach + HITBOX_GRACE_RANGE || def.hp <= 0 || latest.roundOver) return latest;

      const attackerStats = getCharacterStats(atk.characterId);
      const defenderStats = getCharacterStats(def.characterId);
      const baseDamage = (damageOverride ?? data.damage) * (attackerStats.damageScale ?? 1);
      const scaledDamage = baseDamage * (defenderStats.damageTakenScale ?? def.damageTakenScale ?? 1);
      const rawDamage = Math.max(MIN_DAMAGE_ON_HIT, Math.round(scaledDamage * HEALTH_DAMAGE_SCALE));
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
      let actualDamage = rawDamage;
      let staminaDamage = 0;

      if (wasBlocking) {
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

      if (wasBlocking && actualDamage > 0) {
        def.hp = Math.max(0, def.hp - actualDamage);
      }

      if (wasBlocking && actualDamage === 0) {
        spawnCombatFeedback({
          attackerKey: player,
          defenderKey,
          defenderX: def.x,
          damage: staminaDamage,
          blocked: true,
        });
        return { ...latest, [defenderKey]: def };
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

      const isCriticalDamage = actualDamage >= CRITICAL_DAMAGE_THRESHOLD || def.hp <= 20;
      const pushDir = def.x < atk.x ? -1 : 1;
      const isMultiHitCombo = currentMove === "punch3" || currentMove === "kick3";
      const isFinisher = currentMove === "punch3" || currentMove === "kick3" || data.stun;
      const pushAmount = isMultiHitCombo
        ? MULTI_HIT_PUSHBACK
        : isCriticalDamage
          ? PUSHBACK_CRITICAL
          : data.stun || currentMove.toLowerCase().includes("heavy")
            ? PUSHBACK_HEAVY
            : PUSHBACK_BASE;
      def.vx += pushDir * pushAmount;
      def.x += pushDir * pushAmount * (isMultiHitCombo ? 0.16 : 0.45);
      if (latest[player] && !isMultiHitCombo) {
        // Tiny recoil helps close-range hits read better, but combo finishers stay planted.
        const attackerRecoil = pushDir * -ATTACKER_RECOIL_BASE;
        latest = {
          ...latest,
          [player]: { ...latest[player], vx: (latest[player].vx || 0) + attackerRecoil },
        };
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

      spawnCombatFeedback({
        attackerKey: player,
        defenderKey,
        defenderX: def.x,
        damage: actualDamage,
        blocked: false,
        critical: isCriticalDamage,
      });

      const shouldKnockdown = isCriticalDamage && !data.stun && Math.random() < 0.45;
      const reactionAction = shouldKnockdown
        ? "flyingBackDamageReaction"
        : data.stun
          ? "heavyHitAttackReaction"
          : isKickHit
            ? "kickReaction"
            : (Math.random() < 0.38 ? "standingReaction" : "punchReaction");

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

      // Punch3/kick3 are true enders. They should feel strong, then give both players breathing room.
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

  function resolveComboMove(category, combo, now) {
    const comboLanded = combo && combo.landed && now < combo.expiry && !combo.enderLanded;

    if (category === "heavyPunch2") return "heavyPunch2";
    if (category === "heavyKick2") return "heavyKick2";

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
      if (comboLanded && combo.move === "heavyKick1") return "heavyKick2";
      return "heavyKick1";
    }

    return "";
  }

  function queueAttack(player, category) {
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

      if (screen !== "fight" || g.roundOver) {
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
        const trulyBusy = ATTACK_ACTION_SET.has(currentVisual) || ["punchReaction", "kickReaction", "heavyKickReaction", "heavyHitAttackReaction", "standingReaction", "flyingBackDamageReaction", "getUpAfterDamage", "stunned"].includes(currentVisual);
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
      const currentMove = resolveComboMove(category, combo, now);

      const data = getMoveData(attacker.characterId, currentMove);
      if (!data) return g;

      if (attacker.characterId === "jose" && currentMove.toLowerCase().includes("heavykick") && !keys.current[controls[player].crouch]) {
        spawnSystemAlert(player, "crouch-required", "CROUCH + HEAVY KICK");
        return g;
      }

      const staminaCost = attacker.characterId === "jose" && currentMove.toLowerCase().includes("heavykick")
        ? Math.ceil((attacker.maxStamina ?? 100) * 0.45)
        : Math.ceil(data.cost * (attacker.staminaCostScale ?? 1));
      if (attacker.stamina < staminaCost) {
        spawnSystemAlert(player, "burnout", `NO STAMINA FOR ${currentMove.toUpperCase()}`);
        return g;
      }

      const totalMs = animDuration(currentMove, attacker.characterId) * 1000;
      const minimumVisibleMs = ATTACK_MIN_VISIBLE_MS[currentMove] ?? Math.max(360, totalMs * 0.72);
      const isComboEnderMove = currentMove === "punch3" || currentMove === "kick3" || data.stun;
      const recoveryMs = ATTACK_RECOVERY_MS[currentMove] ?? 160;
      // Let the animation complete, then add a small recovery window.
      // Queued inputs release after this, so button-mashing cannot cut the animation short.
      const attackLockMs = Math.max(totalMs + recoveryMs, minimumVisibleMs + recoveryMs) + (isComboEnderMove ? COMBO_FINISHER_RECOVERY_MS : 0);

      actionLocked.current[player] = true;
      scheduleAttackUnlock(player, attackLockMs);

      comboState.current[player] = {
        move: currentMove,
        landed: false,
        expiry: now + attackLockMs + COMBO_WINDOW_MS,
      };

      attacker.stamina -= staminaCost;
      if (attacker.stamina <= LOW_STAMINA_THRESHOLD) {
        spawnSystemAlert(player, "low-stamina", "LOW STAMINA");
      }
      attacker.actionNonce++;
      attacker.lastAction = currentMove;
      const attackToken = (activeAttackToken.current[player] || 0) + 1;
      activeAttackToken.current[player] = attackToken;

      // Fighting-game feel: attacks keep a little forward momentum instead of freezing in place.
      // This makes footsies easier and helps punches/kicks connect without needing to stand on top of the opponent.
      const facingDir = attacker.x < g[defenderKey].x ? 1 : -1;
      const currentDrift = ATTACK_FORWARD_DRIFT[currentMove] ?? 0.045;
      const holdingForward = player === "p1"
        ? !!keys.current.d
        : matchSettings.mode === "lan" ? !!keys.current.j : true;
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
        if (g.roundOver) return g;

        const p1 = { ...g.p1 };
        const p2 = { ...g.p2 };

        // Safety: never let a finished visual state trap inputs forever.
        // Heavy stun still stays locked through stunLocked; normal idle/walk states are always playable.
        const nowMs = Date.now();
        const p1LockExpired = lockExpiresAt.current.p1 && nowMs > lockExpiresAt.current.p1 + LOCK_FAILSAFE_PAD_MS;
        const p2LockExpired = lockExpiresAt.current.p2 && nowMs > lockExpiresAt.current.p2 + LOCK_FAILSAFE_PAD_MS;
        if (!stunLocked.current.p1 && !knockdownInvulnerable.current.p1 && (!ATTACK_ACTION_SET.has(p1.lastAction) && !["punchReaction", "kickReaction", "heavyKickReaction", "heavyHitAttackReaction", "standingReaction", "flyingBackDamageReaction", "getUpAfterDamage", "stunned"].includes(p1.lastAction) || p1LockExpired)) {
          actionLocked.current.p1 = false;
          lockExpiresAt.current.p1 = 0;
        }
        if (!stunLocked.current.p2 && !knockdownInvulnerable.current.p2 && (!ATTACK_ACTION_SET.has(p2.lastAction) && !["punchReaction", "kickReaction", "heavyKickReaction", "heavyHitAttackReaction", "standingReaction", "flyingBackDamageReaction", "getUpAfterDamage", "stunned"].includes(p2.lastAction) || p2LockExpired)) {
          actionLocked.current.p2 = false;
          lockExpiresAt.current.p2 = 0;
        }

        updateFighterMovement(
          p1,
          p2,
          keys.current,
          actionLocked.current.p1,
          { back: "a", forward: "d", jump: "w", crouch: controls.p1.crouch, block: controls.p1.block },
          (stunLocked.current.p1 || knockdownInvulnerable.current.p1)
        );

        if (matchSettings.mode === "lan") {
          updateFighterMovement(
            p2,
            p1,
            keys.current,
            actionLocked.current.p2,
            { back: "l", forward: "j", jump: "i", crouch: controls.p2.crouch, block: controls.p2.block },
            (stunLocked.current.p2 || knockdownInvulnerable.current.p2)
          );
        } else {
          updateAIMovement(p2, p1, matchSettings.difficulty, (stunLocked.current.p2 || knockdownInvulnerable.current.p2));
        }

        resolveBodySpacing(p1, p2);

        let roundOver = false;
        let roundWinner = null;
        let matchWinner = null;
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

          roundOver = true;
        }

        return {
          ...g,
          p1,
          p2,
          wins,
          roundOver,
          roundWinner,
          matchOver: !!matchWinner,
          matchWinner,
        };
      });
    }, 16);

    return () => clearInterval(loop);
  }, [screen, matchSettings, controls]);

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
        return;
      }

      if (dist <= brain.range && now > aiBrain.current.nextAttack && Math.random() < brain.aggression) {
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

    const targetGap =
      difficulty === "extreme" ? 1.20 :
      difficulty === "hard" ? 1.30 :
      difficulty === "medium" ? 1.42 :
      1.58;

    if (dist > targetGap) {
      ai.vx += facingRight ? 0.012 : -0.012;
    } else if (dist < 0.85) {
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

  if (screen === "characterSelect") {
    return (
      <CharacterSelect
        settings={pendingSettings}
        onBack={() => setScreen("menu")}
        onSelect={confirmCharacter}
      />
    );
  }

  if (screen === "menu") {
    return (
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

  return (
    <div className="bd-game-shell" style={{ width: "100vw", height: "100vh", background: "#000", position: "relative", overflow: "hidden" }}>
      <ScreenImpact shakeEvent={shakeEvent} />
      <Canvas shadows camera={{ position: [0, 1.6, 6.8], fov: 42 }}>
        <Suspense fallback={null}>
          <FightScene game={game} visualEffects={visualEffects} shakeEvent={shakeEvent} hitStopEvent={hitStopEvent} />
        </Suspense>
      </Canvas>

      <div
        className="hud-row"
        style={{
          position: "absolute",
          top: 20,
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          padding: "0 50px",
          pointerEvents: "none",
        }}
      >
        <Hud name={game.p1.name?.toUpperCase?.() ?? "P1"} hp={game.p1.hp} maxHp={game.p1.maxHp} stamina={game.p1.stamina} maxStamina={game.p1.maxStamina} wins={game.wins?.p1 ?? 0} />
        <Hud
          name={matchSettings.mode === "ai" ? `AI ${matchSettings.difficulty.toUpperCase()}` : "OPPONENT"}
          hp={game.p2.hp}
          maxHp={game.p2.maxHp}
          stamina={game.p2.stamina}
          maxStamina={game.p2.maxStamina}
          wins={game.wins?.p2 ?? 0}
          reverse
        />
      </div>

      <ComboReadout comboHud={comboHud} />
      <DamagePopups popups={combatPopups} />
      <SystemAlerts alerts={systemAlerts} />
      <CriticalFlash nonce={redFlashNonce} />

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
        ESC: MAIN MENU
      </div>

      {game.roundOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            background: "rgba(0,0,0,0.55)",
            color: "#ffd36a",
            fontFamily: "Impact, fantasy",
            letterSpacing: "3px",
            textShadow: "0 0 18px #ff4b00",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "8px" }}>
            {game.matchOver
              ? game.matchWinner === "p1" ? "SKITZ WINS MATCH" : "OPPONENT WINS MATCH"
              : game.roundWinner === "draw" ? "DRAW ROUND" : game.roundWinner === "p1" ? "SKITZ TAKES THE ROUND" : "OPPONENT TAKES THE ROUND"}
          </div>

          <div style={{ fontSize: "22px", marginBottom: "20px", color: "#ffe8aa" }}>
            BEST OF 3 • ROUND {game.roundNumber}
          </div>

          {!game.matchOver && (
            <button onClick={startNextRound} style={menuButtonStyle}>
              NEXT ROUND
            </button>
          )}

          <button onClick={() => resetMatch()} style={{ ...menuButtonStyle, marginTop: game.matchOver ? 0 : "12px" }}>
            RUN IT BACK
          </button>

          <button onClick={backToMenu} style={{ ...menuButtonStyle, marginTop: "12px" }}>
            MAIN MENU
          </button>
        </div>
      )}
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
  "punch1", "punch2", "punch3",
  "heavyPunch1", "heavyPunch2",
  "kick1", "kick2", "kick3",
  "heavyKick1", "heavyKick2",
  "punchReaction", "kickReaction", "heavyKickReaction", "heavyHitAttackReaction", "standingReaction", "flyingBackDamageReaction", "getUpAfterDamage", "faceHit", "stunned",
  "jump",
  // "die" → intentionally excluded (stays clamped on last frame)
  // "block" → intentionally excluded (loops while Shift is held)
]);

function crossfadeDuration(key) {
  if (!key) return 0.10;
  if (key === "block") return 0.12;
  if (key === "punchReaction") return 0.065;
  if (key === "kickReaction") return 0.11;
  if (key === "heavyKickReaction" || key === "heavyHitAttackReaction") return 0.13;
  if (key === "standingReaction") return 0.075;
  if (key === "flyingBackDamageReaction") return 0.22;
  if (key === "getUpAfterDamage") return 0.28;
  if (key === "punch1" || key === "punch2" || key === "kick1" || key === "kick2") return 0.07;
  if (key === "punch3" || key === "kick3") return 0.095;
  if (key.startsWith("heavy")) return 0.115;
  if (key === "stunned") return 0.14;
  if (key === "die") return 0.16;
  return 0.10;
}

function getModelBoneNameSet(model) {
  const names = new Set();
  model?.traverse?.((child) => {
    if (child?.name) names.add(child.name);
  });
  return names;
}

function cleanTrackNodeName(rawName) {
  return String(rawName || "")
    .split("|").pop()
    .split(":").pop()
    .replace(/^mixamorig[:_]?/i, "mixamorig")
    .trim();
}

function retargetClipTrackNamesToModel(clip, model) {
  const boneNames = getModelBoneNameSet(model);
  if (!clip?.tracks?.length || !boneNames.size) return clip;

  let changed = false;
  const tracks = clip.tracks.map((track) => {
    const [rawNodeName, propertyPath] = track.name.split(/\.(.+)/);
    if (!rawNodeName || !propertyPath || boneNames.has(rawNodeName)) return track;

    const cleaned = cleanTrackNodeName(rawNodeName);
    let matchedName = boneNames.has(cleaned) ? cleaned : null;

    if (!matchedName) {
      const lowerCleaned = cleaned.toLowerCase();
      for (const name of boneNames) {
        const lowerName = name.toLowerCase();
        if (lowerName === lowerCleaned || lowerName.endsWith(lowerCleaned) || lowerCleaned.endsWith(lowerName)) {
          matchedName = name;
          break;
        }
      }
    }

    if (!matchedName) return track;

    const cloned = track.clone();
    cloned.name = `${matchedName}.${propertyPath}`;
    changed = true;
    return cloned;
  });

  return changed ? new THREE.AnimationClip(clip.name, clip.duration, tracks, clip.blendMode) : clip;
}

function removeProblemRootMotion(clip, key, characterId) {
  if (characterId !== "skitz" || !clip?.tracks?.length) return clip;

  // Skitz's new with-skin FBX is good, but some old animation-only FBX clips carry
  // root Y/Z motion that pulls the mesh below the stage or away from the fighter capsule.
  // Keep bone rotations/poses, but let the game logic control world placement.
  const shouldStabilize = !["idle", "walk", "back", "jump", "flyingBackDamageReaction", "getUpAfterDamage", "die"].includes(key);
  if (!shouldStabilize) return clip;

  const tracks = clip.tracks.filter((track) => {
    const name = track.name.toLowerCase();
    const isRootTranslation =
      name.endsWith(".position") &&
      (name.includes("hips.position") || name.includes("root.position") || name.includes("armature.position"));
    return !isRootTranslation;
  });

  return tracks.length === clip.tracks.length
    ? clip
    : new THREE.AnimationClip(clip.name, clip.duration, tracks, clip.blendMode);
}

function stabilizedRootMotionClip(clip, key, model, characterId) {
  let fixedClip = retargetClipTrackNamesToModel(clip, model);
  fixedClip = removeProblemRootMotion(fixedClip, key, characterId);
  return fixedClip;
}

function resolvePlayableActionKey(actionMap, key) {
  if (actionMap[key]) return key;
  if (key === "heavyHitAttackReaction" || key === "stunned") {
    if (actionMap.heavyKickReaction) return "heavyKickReaction";
    if (actionMap.punchReaction) return "punchReaction";
    if (actionMap.standingReaction) return "standingReaction";
  }
  return actionMap.idle ? "idle" : key;
}

function GLBFighter({ fighter, opponent, hitStopEvent }) {
  const animationUrls = useMemo(() => getAnimationUrls(fighter.characterId), [fighter.characterId]);
  const baseAsset = useLoader(getModelLoader(fighter.characterId), getModelUrl(fighter.characterId));
  const skitzTexture = useLoader(THREE.TextureLoader, SKITZ_TEXTURE_URL);
  const model    = useMemo(() => SkeletonUtils.clone(getLoadedModelRoot(baseAsset)), [baseAsset]);
  const mixer    = useMemo(() => new THREE.AnimationMixer(model), [model]);

  const actions    = useRef({});
  const activeKey  = useRef(null);
  const lastNonce  = useRef(-1);
  const hitStopUntil = useRef(0);
  const visualYOffset = useRef(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Combat-specific normalization: scale to fighter height, center the mesh,
    // and lift feet to floor. This fixes huge FBX imports and half-buried models.
    fitModelToFighter(model, fighter.characterId, fighter.characterId === "jose" ? 1.95 : 2.02);
  }, [model, fighter.characterId]);

  useEffect(() => {
    // Apply Skitz's PNG texture onto the GLB body.
    if (fighter.characterId === "skitz") applyTextureToModel(model, skitzTexture);
  }, [model, skitzTexture, fighter.characterId]);

  useEffect(() => {
    if (!hitStopEvent?.id) return;
    hitStopUntil.current = performance.now() + (hitStopEvent.critical ? HIT_STOP_MS * 1.8 : HIT_STOP_MS);
  }, [hitStopEvent]);

  // FBX clips can arrive at different times. This version keeps idle alive,
  // then safely swaps into any action that has loaded. Missing/new files no longer
  // kill the animation controller or leave the model sliding with no pose changes.
  useEffect(() => {
    let cancelled = false;
    // Clear stale action refs so the new mixer starts clean.
    actions.current = {};
    activeKey.current = null;
    lastNonce.current = -1;

    const loaders = Object.entries(animationUrls).map(([key, url]) => {
      const loader = /\.fbx$/i.test(url) ? new FBXLoader() : new GLTFLoader();

      return new Promise((resolve) => {
        loader.load(
          url,
          (result) => {
            if (cancelled) return resolve(null);

            const clip = result.animations?.[0] ?? result.scene?.animations?.[0];
            if (!clip) {
              console.warn(`[anim] no clip found for "${key}" from ${url}`);
              return resolve(null);
            }

            const preparedClip = stabilizedRootMotionClip(clip, key, model, fighter.characterId);
            preparedClip.name = key;
            const action = mixer.clipAction(preparedClip);
            const expectedDuration = animDuration(key, fighter.characterId);
            const baseScale = (preparedClip.duration > 0 && expectedDuration > 0 && Math.abs(preparedClip.duration - expectedDuration) > 0.05)
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

            resolve(action);
          },
          undefined,
          (err) => {
            console.warn(`[anim] failed "${key}" from ${url}:`, err);
            resolve(null);
          }
        );
      });
    });

    Promise.all(loaders).then(() => {
      loadedRef.current = true;
      if (!cancelled && !activeKey.current && actions.current.idle) {
        actions.current.idle.setLoop(THREE.LoopRepeat);
        actions.current.idle.reset().fadeIn(0.05).play();
        activeKey.current = "idle";
      }
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
      mixer.removeEventListener("finished", onFinished);
      mixer.stopAllAction();
      // Clear refs on teardown so no stale actions bleed into the next mount.
      actions.current = {};
      activeKey.current = null;
    };
  }, [mixer, model, animationUrls, fighter.characterId]);

  function configureAction(action, key) {
    const baseScale = action.userData?.baseTimeScale ?? 1;
    const slowScale = key === "kickReaction"
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

    if (LOOP_ONCE_SET.has(key) || key === "die") {
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
    mixer.update(now < hitStopUntil.current ? delta * 0.55 : delta);

    const targetYOffset = KNOCKDOWN_VISUAL_Y_OFFSET[fighter.lastAction] ?? 0;
    // Smooth the offset so Flyingback -> GetUp -> Idle does not pop or teleport.
    visualYOffset.current = THREE.MathUtils.lerp(visualYOffset.current, targetYOffset, Math.min(1, delta * 10));

    model.position.set(
      fighter.x,
      (fighter.y || 0) + visualYOffset.current,
      0
    );

    model.rotation.y = fighter.x < opponent.x ? Math.PI / 2 : -Math.PI / 2;

    const desiredKey = resolvePlayableActionKey(actions.current, fighter.lastAction);
    const nonce = fighter.actionNonce ?? 0;
    const keyChanged = desiredKey !== activeKey.current;
    const nonceChanged = nonce !== lastNonce.current;

    if (keyChanged || (nonceChanged && (LOOP_ONCE_SET.has(desiredKey) || desiredKey === "die"))) {
      transitionTo(desiredKey, nonceChanged && LOOP_ONCE_SET.has(desiredKey));
      lastNonce.current = nonce;
    }

    // If idle somehow never started because the file loaded late, recover automatically.
    if (!activeKey.current && actions.current.idle) {
      transitionTo("idle", true);
    }
  });

  return <primitive object={model} scale={1} />;
}

// ─────────────────────────────────────────────
//  Movement helpers
// ─────────────────────────────────────────────
function updateFighterMovement(f, opp, keys, locked, ctrls, isStunned = false) {
  const friction    = 0.82;
  const accel       = 0.015;
  const facingRight = f.x < opp.x;

  const isAttacking = ATTACK_ACTION_SET.has(f.lastAction);
  const canDriftDuringAttack = locked && isAttacking && f.grounded && f.hp > 0;

  // Crouch and block are separate states now.
  // Holding S should always put the fighter into crouch when grounded and not attacking.
  // Holding block while crouched still guards, but it does not cancel the crouch state.
  const wantsCrouch = !isStunned && !!keys[ctrls.crouch] && f.grounded && !canDriftDuringAttack && f.hp > 0;
  f.crouching = wantsCrouch;

  // ── Blocking: separate block button + grounded + not locked in an attack ──
  // Attacks can drift forward/back, but they cannot turn into block mid-swing.
  const wantsBlock = !isStunned && !!keys[ctrls.block] && f.grounded && !locked && f.hp > 0;
  f.blocking = isStunned ? false : wantsBlock;

  if ((!locked || canDriftDuringAttack) && !wantsBlock && f.hp > 0) {
    const moveAccel = canDriftDuringAttack ? accel * ATTACK_DRIFT_MULTIPLIER : accel;
    if (keys[ctrls.back])    f.vx += facingRight ? -moveAccel :  moveAccel;
    if (keys[ctrls.forward]) f.vx += facingRight ?  moveAccel : -moveAccel;
    if (!canDriftDuringAttack && keys[ctrls.jump] && f.grounded) {
      f.vy = 0.225;
      f.grounded = false;
      f.lastAction = "jump";
      f.actionNonce++;
    }
  }

  f.x  += f.vx || 0;
  f.vx *= ATTACK_ACTION_SET.has(f.lastAction) ? 0.91 : friction;

  if (!f.grounded) {
    f.y  += f.vy;
    f.vy -= 0.01;
    if (f.y <= 0) { f.y = 0; f.grounded = true; }
  }

  // Resolve animation state — crouch stays visible even while the block flag is active.
  // This matters for Jose, because crouch is part of his heavy-input language.
  if (!locked && f.hp > 0) {
    if (!f.grounded)                  f.lastAction = "jump";
    else if (f.crouching)             f.lastAction = "crouch";
    else if (wantsBlock)              f.lastAction = "block";
    else if (Math.abs(f.vx) > 0.01)   f.lastAction = (f.vx * (facingRight ? 1 : -1) > 0) ? "walk" : "back";
    else                              f.lastAction = "idle";
  }
}

function resolveBodySpacing(p1, p2) {
  const gap = Math.abs(p1.x - p2.x);
  const eitherAirborne = !p1.grounded || !p2.grounded;

  // On the ground, keep bodies separated. In the air, let players jump over each other
  // so they can escape corner/wall pressure like a real fighter.
  if (!eitherAirborne && gap < 0.8) {
    const push   = (0.8 - gap) / 2;
    const p1Left = p1.x < p2.x;
    p1.x += p1Left ? -push :  push;
    p2.x += p1Left ?  push : -push;
  }

  // Keep fighters inside the playable stage so spacing stays readable.
  p1.x = THREE.MathUtils.clamp(p1.x, STAGE_MIN_X, STAGE_MAX_X);
  p2.x = THREE.MathUtils.clamp(p2.x, STAGE_MIN_X, STAGE_MAX_X);
}

// ─────────────────────────────────────────────
//  Scene + Stage
// ─────────────────────────────────────────────
function FightScene({ game, visualEffects, shakeEvent, hitStopEvent }) {
  const { camera } = useThree();
  const shakeRef = useRef({ id: 0, start: 0, until: 0, power: 0, critical: false });

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
    const midX = (game.p1.x + game.p2.x) / 2;
    const distance = Math.abs(game.p1.x - game.p2.x);
    const p1Low = ((game.p1.hp / Math.max(1, game.p1.maxHp ?? 100)) * 100) <= LOW_HEALTH_CAMERA_THRESHOLD;
    const p2Low = ((game.p2.hp / Math.max(1, game.p2.maxHp ?? 100)) * 100) <= LOW_HEALTH_CAMERA_THRESHOLD;
    const lowHealthPressure = p1Low || p2Low;
    const basePosition = new THREE.Vector3(midX, 1.6, 6.5 + distance * 0.15 - (lowHealthPressure ? LOW_HEALTH_ZOOM_AMOUNT : 0));

    if (performance.now() < shakeRef.current.until && shakeRef.current.critical) {
      const now = performance.now();
      const remaining = Math.max(0, shakeRef.current.until - now);
      const zoomFalloff = Math.min(1, remaining / CRITICAL_ZOOM_MS);
      basePosition.z -= CRITICAL_ZOOM_AMOUNT * zoomFalloff;
      basePosition.y -= 0.08 * zoomFalloff;
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

    camera.position.lerp(basePosition, 0.24);
    camera.lookAt(midX, 1.2, 0);
  });
  return (
    <>
      <ambientLight intensity={1.05} />
      <hemisphereLight args={["#f7f0ff", "#1b1020", 1.15]} />
      <directionalLight position={[0, 5.5, 5]} intensity={2.8} color="#ffffff" />
      <directionalLight position={[-4, 3.2, 2.4]} intensity={1.65} color="#ffcf6b" />
      <directionalLight position={[4, 3.1, 2.6]} intensity={1.7} color="#65d9ff" />
      <spotLight position={[0, 5, -8]} intensity={11.5} color="#ffffff" angle={0.72} penumbra={1} />
      <Stage />
      <VisualEffects effects={visualEffects} />
      <GLBFighter fighter={game.p1} opponent={game.p2} hitStopEvent={hitStopEvent} />
      <GLBFighter fighter={game.p2} opponent={game.p1} hitStopEvent={hitStopEvent} />
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
    const count = isBlood ? (effect.type === "criticalBlood" ? 30 : 20) : 10;
    return Array.from({ length: count }, (_, i) => {
      const isDrip = isBlood && Math.random() > 0.58;
      return {
        id: i,
        isDrip,
        angle: (Math.PI * 2 * i) / count + Math.random() * 0.9,
        speed: isDrip ? 0.08 + Math.random() * 0.22 : 0.28 + Math.random() * 0.75,
        size: isBlood ? 0.025 + Math.random() * (effect.type === "criticalBlood" ? 0.07 : 0.05) : 0.025 + Math.random() * 0.025,
        height: isDrip ? 0.08 + Math.random() * 0.22 : Math.random() * 0.45,
        dark: Math.random() > 0.45,
      };
    });
  }, [effect.id, effect.type]);

  useFrame(() => {
    if (!group.current) return;
    const lifetime = effect.type === "blockSpark" ? BLOOD_LIFETIME_MS : BLOOD_DRIP_LIFETIME_MS;
    const age = Math.min(1, (performance.now() - effect.createdAt) / lifetime);
    group.current.position.set(effect.x + effect.dir * age * 0.28, effect.y + age * 0.18, effect.z);
    group.current.scale.setScalar(1 + age * 0.28);
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
  const color = isBlood ? "#7f0010" : "#65d9ff";

  return (
    <group ref={group} position={[effect.x, effect.y, effect.z]}>
      {particles.map(p => (
        <mesh key={p.id}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={isBlood && p.dark ? "#4b0008" : color} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

function Stage() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 12]} />
        <meshStandardMaterial color="#050508" roughness={0.78} metalness={0.08} />
      </mesh>
      <gridHelper args={[24, 24, "#ff2d75", "#17202b"]} position={[0, 0.012, 0]} />

      <group position={[0, 0, -3.9]}>
        <mesh position={[0, 1.85, 0]}>
          <boxGeometry args={[18, 3.2, 0.12]} />
          <meshStandardMaterial color="#111018" emissive="#150014" emissiveIntensity={0.65} />
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
          <meshStandardMaterial color="#101820" emissive="#08121b" emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0, 2.45, 0.05]}>
          <boxGeometry args={[1.8, 0.36, 0.12]} />
          <meshStandardMaterial color="#1a0d16" emissive="#ff2d75" emissiveIntensity={1.5} />
        </mesh>
      </group>

      <group position={[7.1, 0, -3.2]}>
        <mesh position={[0, 1.35, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[1.9, 2.7, 0.2]} />
          <meshStandardMaterial color="#18110d" emissive="#130804" emissiveIntensity={0.7} />
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
      {popups.map(popup => (
        <div
          key={popup.id}
          style={{
            position: "absolute",
            left: popup.left,
            top: popup.top,
            color: popup.talk ? "#fff0b8" : popup.heal ? "#7CFF8D" : popup.blocked ? "#7fe7ff" : "#ff4055",
            fontFamily: "Impact, fantasy",
            fontSize: popup.talk ? "28px" : popup.blocked ? "24px" : "34px",
            letterSpacing: popup.talk ? "3px" : "2px",
            textTransform: popup.talk ? "uppercase" : "none",
            textShadow: popup.talk ? "2px 2px 0 #000, 0 0 12px #ffcf6b, 0 0 22px #ff2d75" : popup.heal ? "0 0 10px #00ff66, 0 0 18px #003b18" : popup.blocked ? "0 0 10px #00d5ff" : "0 0 10px #6b0000, 0 0 18px #ff0000",
            pointerEvents: "none",
            animation: "bdDamageFloat 900ms ease-out forwards",
          }}
        >
          {popup.text}
        </div>
      ))}
    </>
  );
}


function SystemAlerts({ alerts }) {
  return (
    <>
      <style>{`
        @keyframes bdSystemAlertIn {
          0% { opacity: 0; transform: translateY(-14px) scale(0.92); filter: blur(2px); }
          12% { opacity: 1; transform: translateY(0) scale(1.04); filter: blur(0); }
          82% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.98); }
        }
      `}</style>
      {alerts.map((alert, index) => {
        const isP1 = alert.playerKey === "p1";
        const palette = alert.type === "stunned" || alert.type === "knockdown"
          ? { bg: "rgba(120,0,0,0.86)", border: "#ff2d2d", text: "#ffe5e5", accent: "#ffcf6b" }
          : alert.type === "burnout"
            ? { bg: "rgba(72,12,92,0.88)", border: "#d45cff", text: "#f8e6ff", accent: "#ffcf6b" }
            : { bg: "rgba(0,34,52,0.88)", border: "#00d5ff", text: "#e9fbff", accent: "#ffcf6b" };
        return (
          <div
            key={alert.id}
            style={{
              position: "absolute",
              top: `${154 + index * 48}px`,
              [isP1 ? "left" : "right"]: "52px",
              zIndex: 15,
              minWidth: "245px",
              padding: "10px 14px 10px 18px",
              color: palette.text,
              background: `linear-gradient(90deg, ${palette.bg}, rgba(0,0,0,0.70))`,
              border: `2px solid ${palette.border}`,
              borderLeft: `9px solid ${palette.accent}`,
              borderRadius: isP1 ? "16px 5px 16px 5px" : "5px 16px 5px 16px",
              boxShadow: `0 0 22px ${palette.border}55, 7px 7px 0 rgba(0,0,0,0.50)`,
              fontFamily: "Arial Black, Impact, sans-serif",
              letterSpacing: "1.4px",
              textAlign: isP1 ? "left" : "right",
              pointerEvents: "none",
              animation: `bdSystemAlertIn ${SYSTEM_ALERT_LIFETIME_MS}ms ease-out forwards`,
              textTransform: "uppercase",
            }}
          >
            <div style={{ fontSize: "10px", color: palette.accent, marginBottom: "3px" }}>{isP1 ? "PLAYER 1" : "PLAYER 2"} STATUS</div>
            <div style={{ fontSize: "20px", textShadow: "2px 2px 0 #000" }}>{alert.text}</div>
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

function Hud({ name, hp, maxHp = 100, stamina, maxStamina = 100, wins = 0, reverse }) {
  const [shownHp, setShownHp] = useState(hp);
  const [damageGhostHp, setDamageGhostHp] = useState(hp);

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

  const hpValue = Math.max(0, Math.min(100, (shownHp / Math.max(1, maxHp)) * 100));
  const ghostValue = Math.max(0, Math.min(100, (damageGhostHp / Math.max(1, maxHp)) * 100));
  const staminaValue = Math.max(0, Math.min(100, (stamina / Math.max(1, maxStamina)) * 100));

  return (
    <div
      style={{
        textAlign: reverse ? "right" : "left",
        width: "420px",
        color: "white",
        fontFamily: "Arial Black, Impact, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: reverse ? "flex-end" : "flex-start",
        filter: "drop-shadow(0 0 10px rgba(0,0,0,0.9))",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: reverse ? "row-reverse" : "row",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            fontSize: "23px",
            letterSpacing: "2px",
            color: "#fff0c8",
            textShadow: "2px 2px 0 #000, 0 0 12px #ff2d75",
            transform: reverse ? "skewX(7deg)" : "skewX(-7deg)",
          }}
        >
          {name}
        </div>

        <div style={{ display: "flex", gap: "7px", flexDirection: reverse ? "row-reverse" : "row" }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              title={`Round ${i + 1}`}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                border: "2px solid #ffcf6b",
                background: i < wins ? "radial-gradient(circle, #fff7b3 0%, #ffcf6b 45%, #ff2d75 100%)" : "rgba(0,0,0,0.55)",
                boxShadow: i < wins ? "0 0 14px #ffcf6b, 0 0 24px #ff2d75" : "inset 0 0 8px rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          width: "410px",
          height: "34px",
          padding: "3px",
          background: "linear-gradient(90deg, #ffcf6b, #ff2d75, #00d5ff)",
          clipPath: reverse
            ? "polygon(0 0, 96% 0, 100% 50%, 96% 100%, 0 100%, 4% 50%)"
            : "polygon(4% 0, 100% 0, 96% 50%, 100% 100%, 4% 100%, 0 50%)",
          boxShadow: "0 0 18px rgba(255,45,117,0.55)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", background: "#12070b", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${ghostValue}%`,
              marginLeft: reverse ? "auto" : 0,
              right: reverse ? 0 : "auto",
              background: "linear-gradient(90deg, rgba(255,255,255,0.55), rgba(255,207,107,0.45))",
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
              background: hpValue <= 25
                ? "linear-gradient(90deg, #7b0012, #ff1738, #ffcf6b)"
                : "linear-gradient(90deg, #ff1738, #ff6a00, #ffcf6b)",
              boxShadow: hpValue <= 25 ? "0 0 20px rgba(255,0,0,0.9)" : "0 0 16px rgba(255,106,0,0.7)",
              transition: "none",
            }}
          />
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
              display: "flex",
              alignItems: "center",
              justifyContent: reverse ? "flex-start" : "flex-end",
              padding: reverse ? "0 0 0 18px" : "0 18px 0 0",
              color: "#fff7cf",
              fontSize: "14px",
              letterSpacing: "1px",
              textShadow: "2px 2px 0 #000, 0 0 8px rgba(255,0,0,0.8)",
            }}
          >
            {pct(hpValue)} HP
          </div>
        </div>
      </div>

      <div
        style={{
          width: "250px",
          height: "12px",
          marginTop: "7px",
          padding: "2px",
          background: "linear-gradient(90deg, #122632, #00d5ff)",
          clipPath: reverse
            ? "polygon(0 0, 96% 0, 100% 50%, 96% 100%, 0 100%)"
            : "polygon(4% 0, 100% 0, 96% 100%, 0 100%)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", background: "#061018" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${staminaValue}%`,
              marginLeft: reverse ? "auto" : 0,
              right: reverse ? 0 : "auto",
              background: "linear-gradient(90deg, #00d5ff, #7ff5ff)",
              boxShadow: "0 0 12px #00d5ff",
              transition: "width 0.08s",
            }}
          />
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
