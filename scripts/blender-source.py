"""Import the authored GLB models into a reusable Blender source scene."""
import bpy
import sys
from pathlib import Path

root = Path(sys.argv[sys.argv.index('--') + 1])
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for name, x in [('denis', -1.2), ('mars', 1.2)]:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(root / 'assets' / 'models' / (name + '.glb')))
    imported = set(bpy.data.objects) - before
    for obj in imported:
        if obj.parent is None:
            obj.location.x += x
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.world.color = (0.22, 0.29, 0.34)
bpy.ops.wm.save_as_mainfile(filepath=r'D:\WC-Dash\art-source\Denis-and-Mars.blend')
print('Saved editable Blender source with imported character animations.')
