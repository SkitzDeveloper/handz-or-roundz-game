# Skitz 2.5D Fighter GLB Prototype

This version loads the uploaded Meshy merged-animation GLB.

## Run it

```bash
npm install
npm run dev
```

Open the local Vite URL in your browser.

## Deploy it

This project is ready for Netlify.

```bash
npm run build:netlify
```

Netlify settings:

- Build command: `npm run build:netlify`
- Publish directory: `dist`

The Netlify build runs Vite, then removes deploy-only source archives and unused raw model exports from `dist`. Your original files in `public` stay untouched.

## Model used

`public/models/urban_noir_fighter.glb`

This is the merged Meshy GLB with 20 animations.

## Current animation mapping

- idle/block: `Boxing_Guard_Prep_Straight_Punch`
- walk: `Walking`
- light punch: `Boxing_Guard_Prep_Straight_Punch`
- heavy punch: `Punch_Combo`
- light kick: `Sweep_Kick`
- heavy kick: `Spartan_Kick`
- hit: `Face_Punch_Reaction`
- KO: `falling_down`

## Controls

P1:
A back, D forward, W/Space jump, S crouch/block, Shift block, E/F punches, C/V kicks

P2:
L back, J forward, I/Alt jump, K crouch/block, Alt block, U/H punches, M/N kicks

## Notes

The GLB has no obvious neutral idle-only clip, so the current prototype uses the guard/punch prep clip as the idle base. If you export a clean idle later, replace `ANIM.idle` in `src/main.jsx`.
