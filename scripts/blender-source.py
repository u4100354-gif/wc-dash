"""Import the authored GLB models into a reusable Blender source scene."""
import bpy
import sys
from pathlib import Path
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
root = Path(args[0]).resolve()
output = Path(args[1]).resolve() if len(args) > 1 else root.parent / 'art-source' / 'Denis-and-Mars.blend'
scene = bpy.context.scene
scene.render.fps = 60
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for name, label, x in [('denis', 'Denis', -1.2), ('mars', 'Mars', 1.2)]:
    collection = bpy.data.collections.new(label)
    scene.collection.children.link(collection)
    anchor = bpy.data.objects.new(f'{label} · placement', None)
    collection.objects.link(anchor)
    anchor.empty_display_size = 0.15
    anchor.location.x = x
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(root / 'assets' / 'models' / (name + '.glb')))
    imported = set(bpy.data.objects) - before
    for obj in imported:
        if obj.parent is None:
            obj.parent = anchor
        for old_collection in list(obj.users_collection):
            old_collection.objects.unlink(obj)
        collection.objects.link(obj)

scene.frame_set(1)
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.world.color = (0.22, 0.29, 0.34)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            view = area.spaces.active
            view.region_3d.view_location = (0, 0, 0.8)
            view.region_3d.view_distance = 5.8
            view.region_3d.view_rotation = Vector((-0.32, 1, -0.26)).to_track_quat('-Z', 'Y')
            view.shading.color_type = 'MATERIAL'
            view.shading.show_cavity = True

output.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(output))
print(f'Saved editable Blender source with {len(bpy.data.actions)} imported actions: {output}')
