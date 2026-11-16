# Three.js showcase: verification evidence

Scope: a 720 m authored first route, new Three.js rendering, original articulated
Denis and cream cat models. Existing second route, marathon, store and save key
are retained. User journeys were derived from the chat request.

## RED / GREEN history

- `2bef98d`: four route behavior tests failed because the showcase builder was
  absent. `d17a9ac`: the same four passed after implementation.
- `e8bf124`: scene, runner and cat tests failed because their factories were
  absent. `06b0247`: the same three passed after adding them.
- `457196e`: existing world test failed because the old renderer was still used.
  Migration changes make that same test pass with `world.engine === 'three.js'`.
- `30a4be1`: a bounding-box test reproduced a 1.60 m slide pose exceeding the
  intended low clearance. Corrected joint angles reduce the pose to within 1.04 m,
  and keep feet above the test's -0.08 m ground tolerance.

## Validation

```powershell
node --test --experimental-test-coverage --test-coverage-include=showcase.js tests/*.test.cjs
```

The route tests check 30–60 second duration, three train types, incoming traffic,
warning triggers, and an open ground lane over the entire route, sampling every
0.5 m with the actual acceleration curve.

Gameplay tests execute the actual game/trains/shop/endless scripts with a minimal
DOM and audio adapter. They check first-route integration, jumping and fast
descent into a slide, collision with a real approaching train, completion by
steering without invulnerability/revives, and persistence of wallet/cats/skin.

Graphics tests use real Three.js scene graphs and geometries with a renderer
adapter. They check lights/shadows, world integration, finite character matrices
in several poses, cat reference features, and slide clearance. These are not
pixel tests and do not claim to validate browser GPU behavior.

Coverage is reported for the new authored-route module only (100% lines,
branches and functions). No repository-wide 80% coverage claim is made. Mesh
appearance, WebGL, labels, responsive layout, input and pause receive additional
manual browser inspection.

Exports were imported successfully into Blender 4.5.16 LTS and saved as an
editable `.blend` scene. The source mesh groups and animation clips remain
editable; these models use articulated parts rather than weighted skinning.

No GitHub push or deployment is included in this local development task.
