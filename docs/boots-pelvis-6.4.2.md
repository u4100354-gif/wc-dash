# Boots and trouser geometry correction

The reported active boots were blocked by `profile.boots > 0`, which represented
a purchased duration upgrade rather than the timed bonus visible in the HUD.
The regression uses the default upgrade level and coins beneath a 4.2 m jump.
It failed before the change and passes now.

Attraction works with any active boots, in the current lane only, for objects
below the runner. A jump launched with boots retains attraction until landing,
even if the timer expires in midair. Starting wing flight clears that jump flag.
The longitudinal catchment includes passed pickups up to 10 m behind, avoiding
losses while jumping onto or off roofs. Done flags prevent duplicate rewards.

The character previously had no trouser pelvis and open upper thigh surfaces.
Added a solid waist/seat, two overlapping seat volumes and rounded weighted caps
at both thigh roots. They retain the pants palette across skins. The cat remains
unchanged. Editable GLB and Blender exports are regenerated.

42 tests pass, including default-level active boots, upgrade/lane exclusions,
midair timer expiry, pelvis existence, closed thigh caps and all prior physics
and geometry checks. No browser visual pass is claimed for this correction.
