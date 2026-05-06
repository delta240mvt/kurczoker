# KURCZOKER MCP Asset Pipeline

This project is prepared for a browser-first R3F/Rapier rewrite with MCP-assisted asset production.

## Installed Runtime Stack

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `@react-three/rapier`
- `zustand`

## Configured MCP/API Tooling

1. `blender` via `uvx blender-mcp`
   - Controls Blender through the Blender MCP addon.
   - Handles scene creation, object manipulation, GLB export, Poly Haven, Sketchfab search/download, and Hyper3D/Rodin when keys are present.

2. Asset search/download
   - Primary free sources: Poly Pizza, Quaternius, Kenney, Poly Haven.
   - Sketchfab is available through Blender MCP integration when `SKETCHFAB_API_TOKEN` is set. Do not add the abandoned `sketchfab` npm package; it pulls deprecated vulnerable dependencies.
   - Every imported asset must have a recorded source URL and license.

3. Hyper3D/Rodin
   - Available through Blender MCP when `HYPER3D_API_KEY` is set.
   - Use for custom hero, boss, and signature props only.
   - If Hyper3D is not available, use the Blender MCP Hunyuan3D local API mode (`HUNYUAN3D_API_URL`) or a manual local image-to-3D workflow, then optimize/export through Blender.
   - The local `.env` has a tested Hyper3D key; keep it out of git.

4. `threejs-devtools`
   - Installed as `threejs-devtools-mcp`.
   - Use while the local app is running to inspect and tune Three.js/R3F scenes, materials, cameras, lights, and shaders.

5. `cloudflare`
   - Installed as `@cloudflare/mcp-server-cloudflare`.
   - Use after `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are set for Cloudflare API workflows.

## Required Local Setup

- Blender 4.5 portable is installed at `%LOCALAPPDATA%\Programs\BlenderPortable\blender-4.5.0-windows-x64\blender.exe`.
- The Blender MCP `addon.py` is stored at `tools/blender-mcp/addon.py`.
- The addon is installed into Blender 4.5 user preferences.
- Start the local Blender socket bridge with:

```powershell
npm run blender:mcp
```

This runs Blender in background mode and starts the addon socket server on `localhost:9876`.

- Put real secrets in `.env`; never commit `.env`.

## Asset Storage Convention

Use this structure for imported/generated assets:

```text
public/game/assets/
  manifest.json
  models/
  textures/
  sprites/
  portraits/
  icons/
  licenses/
```

`manifest.json` should map stable asset ids to file paths, source URLs, author names, license names, and optimization notes.
