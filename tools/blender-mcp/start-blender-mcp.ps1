$ErrorActionPreference = "Stop"

$blender = Join-Path $env:LOCALAPPDATA "Programs\BlenderPortable\blender-4.5.0-windows-x64\blender.exe"
$script = Join-Path $PSScriptRoot "start-blender-mcp-server.py"

if (-not (Test-Path -LiteralPath $blender)) {
  throw "Blender executable not found: $blender"
}

& $blender --background --python $script
