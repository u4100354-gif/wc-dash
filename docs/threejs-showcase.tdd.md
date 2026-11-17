# Проверки 6.5.0

- 52 теста проходят: `node --test tests/*.test.cjs`.
- Минимальные регрессии сначала подтвердили отсутствие финишного прыжка,
  прежнюю высоту полёта и отсутствие пяти конечных уровней (3 падения).
- Все новые конечные маршруты пройдены симуляцией с обычным управлением полосами,
  без защиты, возрождений и отключения столкновений.
- Позиции поездов проверены с их реальной скоростью на всей длине маршрутов.
- Проверены финишный прыжок, высота таза над сиденьем и положение стоп.
- Центрирование трассы и видимость Дениса проверены по всем полосам на ширинах 320, 390, 430 и 600 px,
  на земле и на высоте полёта.
- Полные сцены всех шести режимов строятся на 390 и 1366 px: обычный кадр,
  полёт и финиш. Используется настоящий Three.js с адаптером GPU-рендерера.
- Свод перед камерой убирается в полёте; дальние арки сохраняются.
- Старые сохранения first/second переносятся в completedLevels. Финальная кнопка
  ведёт на следующий уровень и повторяет пятый, не переключая на марафон.
- GLB с десятью клипами Дениса успешно импортирован в Blender 4.5.16 LTS.

В этом выпуске не выполнена новая визуальная проверка браузерного WebGL и
раскладки на физическом телефоне. Математические проверки камеры и геометрии
не считаются такой проверкой.

---

## Исторический отчёт первого переноса на Three.js

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
