# WC Dash 6.4

Includes the prior local body/shoulder and directional-roll corrections, plus:

- Jump pose follows the take-off stride and velocity, with a stronger apex tuck
  and leg extension as the supporting surface approaches. Running torso lean is
  slightly increased; jump arms counterbalance take-off and ascent.
- Menu cat moves to x=1.55, z=0.25. A scene-geometry check verifies separation
  between the two characters in their menu poses.
- Each incoming train gains two matching-speed followers with 6 m coupling gaps.
  Total: 20 train cars, 12 moving. Roof coins move with their own train and are
  collected independently from static item rows.
- Four additional sewer waves form same-speed relay sequences. Total: 12 waves.
- Active upgraded boots attract collectibles passed below a jump in the current
  lane, without a vertical distance cap. No cross-lane vacuum, no attraction from
  above the runner, no passive attraction without the timed bonus, and no use in
  wing flight. The effect includes keys, letters and gear, and existing done flags
  prevent repeated collection.

37 tests pass, including high-jump pickups, upgrade/lane exclusions, later jump
extension, menu separation, the route with actual jumps and no invulnerability,
and jumping from one approaching train roof to a second across a 6 m gap.

Browser visual QA was attempted with agent-browser installed on D. Automatic
approval review rejected starting Chrome with a remote debugging endpoint,
returning only "blocked by policy". That browser check was not completed; unit,
physics, real Three.js geometry and deployed HTTP asset checks remain available.

Release source and editable character assets are rebuilt before publication.
