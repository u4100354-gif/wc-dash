# Lean silhouette and directional rolls

User requested a slimmer Denis, an ordinary roll in the direction of running,
and the previous side-roll motion only when changing lanes during a slide.

The torso, hem, hood, shoulder yoke and backpack have been narrowed together;
zipper, drawstrings, pocket and arm roots follow the new silhouette. Head and
cat are unchanged.

Down resets the roll direction to forward. A successful lane change while sliding
on a support restarts a side roll in that direction. A blocked lane change does
not trigger a new roll. Restarting a run and jumping reset the direction.

Forward rolling uses the transverse body axis, while the lateral roll uses an
axial turn with its sign determined by the lane change. Body scale remains 1.
Ground contact is preserved. Forward clearance is 1.38; lateral clearance is
1.04, matching the differing poses. Consequently the lowest crossbars require
a jump rather than allowing the larger forward pose to pass through geometry.

32 tests pass, including direction selection, opposite side rotations, silhouette
dimensions, grounding and forward-roll clearance, interruption and full-route
completion. Browser inspection covered the slimmer menu model and forward roll;
no console errors were returned. Exchange models have nine clips, including
SideRollLeft and SideRollRight. Work remains local.
