# Crossbar roll clearance fix

The supplied screenshot shows the thin striped hurdle. Its bottom was still
1.08 m after forward-roll clearance increased to 1.38 m. The actual collision
test therefore rejected a correctly timed down action.

The bottom/top are now 1.46/1.70 m, with 0.08 m of clearance above the forward
roll. Rendering reads those same constants, so the visible opening matches the
collision opening. No obstacle collision or standing-hit behavior is disabled.

The regression reproduced a lost run against a single crossbar after pressing
down. The same scenario now continues past it. A separate check confirms a
standing collision and successful ordinary jump over the top.
