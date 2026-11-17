# Denis silhouette and shoulder pass

The pending user notes requested the earlier body silhouette with the new arms,
a proper shoulder/clavicle transition, and a roll that does not compress the
character into a ball. The cat was explicitly approved and remains unchanged.

Changes:

- Restore the full-size head and shorter-leg silhouette from the initial Three.js
  character, retaining all four skinned limb surfaces and planted-foot motion.
- Add a shaped shoulder yoke beneath the collar. Close the upper sleeve with a
  weighted rounded cap and move its root into the torso. A trial with external
  spherical shoulder pads was removed after browser inspection.
- Replace the tightly tucked forward somersault with a longer diagonal shoulder
  roll. The hips retain scale 1 throughout. Knees bend asymmetrically; one leg
  leads the exit. Ground support and interruption by jumping remain enabled.
- Keep the cat factory identical to the previously committed version.

Validation: `node --test tests/*.test.cjs` passes 30 tests. The two new checks
first reproduced the reduced head scale, missing shoulder structure, body
shrinking and extreme knee flexion. They pass after the changes. Existing tests
continue to check weighted vertices, planted feet, roll clearance and support,
jump interruption, camera freezing, route completion and sewer encounters.

The model and roll were inspected in the browser, with screenshots saved in
outputs. No browser console errors were observed. These visual judgments are
not a claim of anatomical motion capture. The roll is an authored diagonal
gameplay roll and remains available for further user review.

GLB exports and the Blender source on D are rebuilt from the updated meshes.
This pass is local; no commit or GitHub publication is included.
