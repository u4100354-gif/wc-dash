# WC Dash 6.1 — motion, sewers and inspection

Requirements were taken from the user's 20 answers: separate sewer sections,
several rideable flows, dirty/slow first hit and fatal repeat hit without a rescue,
more natural proportions, continuous limbs, sprint stages, crossover movement,
responsive airborne control, tucked jump, quick landing and interruptible full
shoulder roll. Development freeze must retain HUD without a pause modal and
allow free camera, zoom and stepping.

## RED → GREEN

- `ae2801f`: six regressions demonstrated absent sewer encounters, incorrect first
  collision behavior, absent freeze clock, absent skinned limbs and absent body
  rotation. Existing behavior tests remained enabled.
- `cea3b44`: the same tests passed with first-route sewer encounters, per-flow
  support heights, dirty-hit state, independent frozen simulation clock, inspection
  camera and weighted bones for all four limbs.
- `bcad0df`: added planted-foot, three-stage, roll-contact and interruption checks.
  Contact checking exposed stale attached-skin matrices in roll grounding.
- `4d87430`: update the attached meshes' world/bind matrices before measuring
  support. The sampled roll remains near the ground and under the low clearance.

## Verification

`node --test tests/*.test.cjs`: 28 tests passed.

The full route is completed using actual physics without invulnerability or
revives. Flow checks cover first/second impacts, roof landing and one-time roof
coin collection. The frozen clock holds both distance and elapsed time, advances
one 1/60 s step, holds again, then resumes without catching up missed wall time.

Geometry checks use actual Three.js bone deformation, normalized skin weights,
finite transformed vertices, planted-foot world positions, distinct sprint stages
and bounds throughout the central shoulder roll. The tests use real scene graphs
with a renderer adapter; they are not GPU pixel comparisons.

Browser checks: local version starts without console errors; HUD remains visible
during freeze with no modal; single-frame stepping changes the route; dragging
the camera rotates the view while distance remains fixed; H hides only the
development panel. The station/sewer transition and flow geometry were inspected
in a running first-route playthrough.

Blender source and GLB exports were rebuilt, including four skins and seven
animation clips. Free vendored OrbitControls provides orbit, pan and zoom.

`811e11a` reproduced camera movement occurring only once per key event;
`228a31a` makes held-key movement use wall time while the simulation remains
frozen. Releasing keys, losing focus, or exiting inspection clears movement.

The roof-flight bonus now appears later in the route so the first sewer section
can be experienced on foot. Flow spawn extents are checked against their sewer
section boundaries.

Limitations: the automated suite does not claim repository-wide pixel or coverage
validation, and the sprint/roll remains authored game animation rather than
motion-captured footage. Neither GitHub push nor Pages deployment is part of
this local change.
