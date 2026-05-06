import time

import bpy


def main():
    if "addon" not in bpy.context.preferences.addons:
        bpy.ops.preferences.addon_enable(module="addon")

    scene = bpy.context.scene
    scene.blendermcp_port = 9876

    if not scene.blendermcp_server_running:
        bpy.ops.blendermcp.start_server()

    print("BLENDER_MCP_SOCKET_READY localhost:9876", flush=True)

    while True:
        time.sleep(1)


main()
