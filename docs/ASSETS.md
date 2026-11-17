# WC Dash 6.7: assets and tools

All character meshes, articulated animation logic, trains, station props and sign
textures in this version were authored for this project. No paid asset packs or
Subway Surfers assets are included.

- Three.js **0.187.0**, MIT: `vendor/three/`. License is included beside the files.
- Runtime models and poses: `characters.js`; fitted costume details: `costumes.js`.
- The wardrobe renders the same rig through `wardrobe-preview.js`; thumbnails
  are made locally from that renderer. No remote costume images are required.
- Railway environment: `environment.js`.
- Editable exchange models: `assets/models/denis.glb` (21 clips) and
  `assets/models/mars.glb` (13 clips).
- Both rigs include 12 matched clips: RideSlow, Ride, RideSprint, RideTurnLeft,
  RideTurnRight, RideJump, RideBoostJump, RideLand, RideDuck, RideMount,
  RideDismount and RideRecoil. Runtime timing and the saddle contact point are
  shared through `ride-motion.js`. The cat has four articulated leg chains;
  human rolling is replaced by a coordinated mounted duck.
- Denis has four continuous skinned limb surfaces, each controlled by a three-bone
  chain with blended joint weights. Runtime motion includes foot placement, speed
  stages, cross steps and ground contact for a full shoulder roll. The GLB exports
  include the bones and 60 Hz animation tracks for Blender editing.
- The runtime animates the authored hierarchy directly; exchange GLBs are rebuilt
  from that same source. No automatic photo-to-3D reconstruction is claimed.
- The cat design uses the supplied photographs as a visual reference: pale cream
  coat, large ruff, pink nose, long tufted ears and a long bushy tail.
- Original photos are stored only in `D:\WC-Dash\references\Mars`, outside Git.

## Installed on D

- `D:\WC-Dash\tools\blender-4.5.16-windows-x64\blender.exe`: official Blender
  4.5.16 LTS portable build, no system installation or file associations changed.
- Original Blender ZIP and the publisher's checksum list: `D:\WC-Dash\downloads`.
  Verified SHA-256:
  `e258e90a1ebc14798ad65b3426bc5f11f5e0e013541c61cc7c3ee9bbf4ca0ce6`.
- Editable character scene: `D:\WC-Dash\art-source\Denis-and-Mars.blend`.
- Three.js development package: `D:\WC-Dash\tools\node_modules\three`.

## Rebuilding exchange models

From the project root:

```powershell
node scripts/export-models.mjs D:\WC-Dash\tools
& 'D:\WC-Dash\tools\blender-4.5.16-windows-x64\blender.exe' --background --factory-startup --python scripts/blender-source.py -- (Get-Location).Path
```

Game files use a vendored copy of Three.js and do not need npm or Blender to run.
Serve this directory over HTTP. GitHub Pages can still serve the repository root.
Opening `index.html` directly from the filesystem is no longer supported because
ES modules require an HTTP origin.

## Next art pass

Denis currently has an original stylized appearance, since no human reference
photos were supplied. A future sculpt and skinning pass can refine the face,
silhouette, clothes, cat anatomy and authored animation timing in Blender.

OrbitControls from the same Three.js 0.187.0 package is vendored under its MIT
license for the inspection camera. Development freeze uses a separate simulation
clock: mouse camera changes do not advance gameplay, cosmetic time or timers.
