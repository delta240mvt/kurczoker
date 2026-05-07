import math
import os
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "game" / "assets" / "models"
OUT.mkdir(parents=True, exist_ok=True)


def clean():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def mat(name, color, roughness=0.62, metallic=0.0, emission=None, strength=0.0):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = strength
    return material


MAT = {}


def setup_materials():
    MAT.update(
        {
            "feather": mat("warm white layered feathers", (0.93, 0.88, 0.75, 1)),
            "feather_shadow": mat("cream feather shadow", (0.64, 0.56, 0.42, 1)),
            "beak": mat("golden beak and claws", (1.0, 0.57, 0.08, 1), 0.48),
            "red": mat("deep red plume scarf", (0.72, 0.08, 0.04, 1), 0.55),
            "leather": mat("adventure leather", (0.34, 0.19, 0.09, 1), 0.72),
            "steel": mat("brushed knight steel", (0.56, 0.58, 0.58, 1), 0.34, 0.18),
            "dark_feather": mat("obsidian boss feathers", (0.05, 0.05, 0.07, 1), 0.62),
            "lava": mat("molten boss glow", (1.0, 0.23, 0.04, 1), 0.38, 0, (1.0, 0.18, 0.02, 1), 0.9),
            "gold": mat("ornate game gold", (0.98, 0.67, 0.14, 1), 0.4, 0.18),
            "wood": mat("painted medieval wood", (0.45, 0.24, 0.09, 1), 0.78),
            "stone": mat("castle stone", (0.42, 0.40, 0.36, 1), 0.82),
            "moss": mat("mossy grass top", (0.18, 0.52, 0.22, 1), 0.72),
            "banner": mat("red victory banner cloth", (0.68, 0.08, 0.03, 1), 0.66),
            "blue": mat("painted blue enamel", (0.05, 0.23, 0.58, 1), 0.48),
        }
    )


def assign(obj, material):
    obj.data.materials.append(material)
    return obj


def cube(name, loc, scale, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign(obj, material)
    return obj


def sphere(name, loc, scale, material, segments=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, material)
    return obj


def cyl(name, loc, radius, depth, material, vertices=32, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    return obj


def cone(name, loc, radius1, depth, material, vertices=32, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=0, depth=depth, location=loc, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    assign(obj, material)
    return obj


def shade():
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            try:
                bpy.ops.object.shade_smooth()
            except Exception:
                pass
            obj.select_set(False)


def export_selected(path):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_materials="EXPORT",
        export_texcoords=False,
        export_normals=True,
        export_yup=True,
    )


def make_hero(path):
    clean()
    setup_materials()
    sphere("hero_body_feathered", (0, 0, 0.75), (0.55, 0.42, 0.62), MAT["feather"])
    sphere("hero_belly_shadow", (0.04, -0.08, 0.58), (0.38, 0.25, 0.36), MAT["feather_shadow"], 24, 12)
    sphere("hero_head", (0.05, 0, 1.35), (0.42, 0.36, 0.38), MAT["feather"])
    cone("hero_beak", (0.5, -0.01, 1.34), 0.16, 0.34, MAT["beak"], 24, (0, math.radians(90), 0))
    sphere("hero_eye_left", (0.36, -0.18, 1.46), (0.045, 0.045, 0.045), mat("hero black eye", (0.02, 0.015, 0.01, 1)), 12, 8)
    sphere("hero_eye_right", (0.36, 0.18, 1.46), (0.045, 0.045, 0.045), bpy.data.materials["hero black eye"], 12, 8)
    cyl("hero_helmet", (0.03, 0, 1.58), 0.42, 0.28, MAT["steel"], 32, (math.radians(90), 0, 0))
    cone("hero_helmet_plume_1", (-0.12, 0, 1.84), 0.08, 0.34, MAT["red"], 12, (math.radians(-28), 0, 0))
    cone("hero_helmet_plume_2", (-0.02, 0.08, 1.82), 0.065, 0.3, MAT["red"], 12, (math.radians(-18), 0, math.radians(18)))
    cyl("hero_scarf", (0.08, 0, 1.02), 0.34, 0.12, MAT["red"], 32, (math.radians(90), 0, 0))
    cube("hero_backpack", (-0.42, 0, 0.92), (0.22, 0.42, 0.44), MAT["leather"])
    cyl("hero_left_leg", (0.04, -0.2, 0.15), 0.045, 0.32, MAT["beak"], 12)
    cyl("hero_right_leg", (0.04, 0.2, 0.15), 0.045, 0.32, MAT["beak"], 12)
    cube("hero_left_foot", (0.15, -0.2, -0.03), (0.25, 0.08, 0.05), MAT["beak"])
    cube("hero_right_foot", (0.15, 0.2, -0.03), (0.25, 0.08, 0.05), MAT["beak"])
    sphere("hero_shield", (0.1, -0.46, 0.75), (0.25, 0.08, 0.32), MAT["blue"], 24, 12)
    cube("hero_shield_trim", (0.1, -0.53, 0.75), (0.34, 0.035, 0.44), MAT["gold"])
    shade()
    export_selected(path)


def make_grunt(path):
    clean()
    setup_materials()
    sphere("grunt_body_red", (0, 0, 0.72), (0.52, 0.4, 0.58), MAT["red"])
    sphere("grunt_head", (0.08, 0, 1.28), (0.4, 0.32, 0.34), MAT["red"])
    cone("grunt_beak", (0.48, 0, 1.26), 0.14, 0.28, MAT["beak"], 20, (0, math.radians(90), 0))
    cone("grunt_plume", (-0.08, 0, 1.63), 0.12, 0.34, MAT["red"], 16, (math.radians(-20), 0, 0))
    sphere("grunt_eye", (0.35, -0.13, 1.38), (0.05, 0.05, 0.05), MAT["lava"], 12, 8)
    sphere("grunt_eye_2", (0.35, 0.13, 1.38), (0.05, 0.05, 0.05), MAT["lava"], 12, 8)
    sphere("grunt_pauldron_l", (-0.05, -0.38, 0.95), (0.22, 0.16, 0.18), MAT["steel"], 16, 8)
    sphere("grunt_pauldron_r", (-0.05, 0.38, 0.95), (0.22, 0.16, 0.18), MAT["steel"], 16, 8)
    cyl("grunt_leg_l", (0.02, -0.18, 0.12), 0.045, 0.28, MAT["beak"], 12)
    cyl("grunt_leg_r", (0.02, 0.18, 0.12), 0.045, 0.28, MAT["beak"], 12)
    shade()
    export_selected(path)


def make_boss(path):
    clean()
    setup_materials()
    sphere("boss_massive_body", (0, 0, 0.95), (0.92, 0.68, 0.92), MAT["dark_feather"], 40, 20)
    sphere("boss_chest_glow", (0.28, 0, 0.92), (0.32, 0.2, 0.34), MAT["lava"], 24, 12)
    sphere("boss_head", (0.18, 0, 1.76), (0.58, 0.46, 0.52), MAT["dark_feather"], 32, 16)
    cone("boss_beak", (0.78, 0, 1.72), 0.2, 0.42, MAT["beak"], 24, (0, math.radians(90), 0))
    for i, y in enumerate([-0.34, -0.17, 0, 0.17, 0.34]):
        cone(f"boss_crown_plume_{i}", (-0.1, y, 2.28 - abs(y) * 0.35), 0.13, 0.58, MAT["red"], 14, (math.radians(-18), math.radians(10 * y), 0))
    for y in [-0.22, 0.22]:
        sphere(f"boss_eye_{y}", (0.58, y, 1.9), (0.075, 0.075, 0.075), MAT["lava"], 16, 8)
    for y in [-0.58, 0.58]:
        sphere(f"boss_gold_pauldron_{y}", (0.05, y, 1.24), (0.42, 0.22, 0.28), MAT["gold"], 24, 12)
        cone(f"boss_spike_{y}", (0.06, y * 1.17, 1.28), 0.08, 0.32, MAT["steel"], 12, (math.radians(90), 0, 0))
    for y in [-0.24, 0.24]:
        cyl(f"boss_leg_{y}", (0.1, y, 0.16), 0.07, 0.34, MAT["beak"], 12)
    shade()
    export_selected(path)


def make_props(path):
    clean()
    setup_materials()
    # castle
    cube("castle_keep", (0, 0, 0.75), (0.85, 0.7, 1.5), MAT["stone"])
    for x in [-0.62, 0.62]:
        cyl(f"castle_tower_{x}", (x, 0, 0.85), 0.23, 1.7, MAT["stone"], 18)
        cone(f"castle_roof_{x}", (x, 0, 1.9), 0.32, 0.52, MAT["red"], 18)
    cone("castle_roof_keep", (0, 0, 1.76), 0.5, 0.56, MAT["red"], 24)
    cube("castle_gate", (0, -0.36, 0.28), (0.34, 0.06, 0.52), MAT["wood"])
    # treasure
    cube("treasure_chest_base", (2.2, 0, 0.28), (0.9, 0.52, 0.42), MAT["wood"])
    cyl("treasure_chest_lid", (2.2, 0, 0.54), 0.28, 0.92, MAT["gold"], 24, (math.radians(90), 0, math.radians(90)))
    cube("treasure_lock", (2.2, -0.29, 0.42), (0.18, 0.06, 0.22), MAT["gold"])
    # shop wagon
    cube("shop_wagon", (-2.1, 0, 0.42), (1.12, 0.62, 0.72), MAT["wood"])
    cyl("shop_wheel_l", (-2.55, -0.34, 0.12), 0.18, 0.08, MAT["steel"], 24, (math.radians(90), 0, 0))
    cyl("shop_wheel_r", (-1.65, -0.34, 0.12), 0.18, 0.08, MAT["steel"], 24, (math.radians(90), 0, 0))
    cube("shop_awning", (-2.1, -0.02, 0.88), (1.24, 0.68, 0.14), MAT["blue"])
    # banner
    cyl("banner_pole", (3.5, 0, 0.78), 0.035, 1.55, MAT["wood"], 12)
    cube("banner_cloth", (3.7, 0, 1.18), (0.42, 0.04, 0.6), MAT["banner"])
    shade()
    export_selected(path)


def make_terrain(path):
    clean()
    setup_materials()
    for i, x in enumerate([-2.8, -1.5, -0.2, 1.1, 2.4]):
        cube(f"moss_platform_{i}", (x, 0, 0.18 + (i % 2) * 0.08), (1.1, 0.72, 0.28), MAT["wood"])
        cube(f"moss_top_{i}", (x, 0, 0.36 + (i % 2) * 0.08), (1.04, 0.68, 0.08), MAT["moss"])
        for r in range(3):
            sphere(f"rock_{i}_{r}", (x - 0.35 + r * 0.32, -0.34, 0.52), (0.09, 0.07, 0.07), MAT["stone"], 12, 8)
    shade()
    export_selected(path)


def make_diorama_props(path):
    clean()
    setup_materials()
    # left windmill and cottage, matching the battle reference.
    cube("windmill_house", (-3.2, 0, 0.38), (0.86, 0.58, 0.64), MAT["wood"])
    cone("windmill_roof", (-3.2, 0, 0.92), 0.58, 0.48, MAT["red"], 4, (0, 0, math.radians(45)))
    cyl("windmill_mast", (-3.2, -0.33, 1.08), 0.045, 0.7, MAT["wood"], 10, (math.radians(90), 0, 0))
    for index, angle in enumerate([0, math.pi / 2, math.pi, math.pi * 1.5]):
        blade = cube(f"windmill_blade_{index}", (-3.2, -0.72, 1.08), (0.1, 0.04, 0.78), MAT["stone"])
        blade.rotation_euler[1] = angle

    # boss altar and torches.
    cyl("boss_altar_base", (2.9, 0, 0.22), 0.62, 0.28, MAT["stone"], 32)
    cyl("boss_altar_top", (2.9, 0, 0.48), 0.78, 0.18, MAT["stone"], 32)
    cube("boss_red_carpet", (2.9, -0.46, 0.58), (0.42, 0.58, 0.04), MAT["banner"])
    for x in [2.08, 3.72]:
        cyl(f"torch_pole_{x}", (x, -0.32, 0.65), 0.035, 1.08, MAT["wood"], 10)
        sphere(f"torch_fire_{x}", (x, -0.32, 1.26), (0.13, 0.13, 0.18), MAT["lava"], 16, 8)

    # treasure cave dressing.
    cube("open_chest_base", (-0.15, 0.08, 0.26), (0.92, 0.56, 0.36), MAT["wood"])
    cube("open_chest_lid", (-0.15, 0.32, 0.64), (0.92, 0.16, 0.44), MAT["gold"])
    sphere("chest_light_core", (-0.15, -0.1, 0.56), (0.22, 0.16, 0.12), MAT["gold"], 18, 8)
    for i in range(9):
        sphere(f"coin_scatter_{i}", (-0.68 + i * 0.15, -0.48 + (i % 3) * 0.08, 0.08), (0.055, 0.055, 0.018), MAT["gold"], 14, 6)

    # foreground flowers and stones for the map.
    for i, x in enumerate([-4.2, -3.7, -1.2, 0.9, 2.2, 3.8]):
        sphere(f"flower_head_{i}", (x, -1.1 + (i % 2) * 0.18, 0.22), (0.05, 0.05, 0.05), MAT["gold"], 10, 6)
        cyl(f"flower_stem_{i}", (x, -1.1 + (i % 2) * 0.18, 0.11), 0.01, 0.18, MAT["moss"], 6)
    for i, x in enumerate([-4.4, -2.8, -0.8, 1.4, 3.1, 4.0]):
        sphere(f"foreground_rock_{i}", (x, -1.58 + (i % 2) * 0.1, 0.11), (0.16, 0.1, 0.08), MAT["stone"], 12, 8)

    shade()
    export_selected(path)


def main():
    make_hero(OUT / "kurczoker-hero-knight.glb")
    make_grunt(OUT / "kurczoker-enemy-grunt.glb")
    make_boss(OUT / "kurczoker-boss-rooster.glb")
    make_props(OUT / "kurczoker-map-props.glb")
    make_terrain(OUT / "kurczoker-terrain-kit.glb")
    make_diorama_props(OUT / "kurczoker-diorama-props.glb")


if __name__ == "__main__":
    main()
