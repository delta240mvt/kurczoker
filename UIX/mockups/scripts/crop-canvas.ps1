# Kopiuje 10 PNG-ow referencyjnych UIX do mockups/assets/canvas/
# z czystymi nazwami 0X-canvas.png.
#
# Decyzja designerska: PNG-i UIX maja zintegrowany painted chrome
# (HUD, statusbar, hint-cards namalowane w obrazie). Zamiast probowac
# je dzielic, mockupy uzywaja PELNEGO PNG jako .shell__canvas content.
# CSS chrome (frame, narozne krysztaly, ornament) sluzy jako prezentacyjna
# ramka wokol PNG - rola CSS to udowodnic, ze chrome da sie zbudowac
# w prawdziwym HTML/CSS, gdy bedzie czas na implementacje.

$root   = Resolve-Path "$PSScriptRoot/../.."
$srcDir = Join-Path $root ""
$dstDir = Join-Path $root "mockups/assets/canvas"

if (-not (Test-Path $dstDir)) {
    New-Item -ItemType Directory -Path $dstDir | Out-Null
}

$mapping = @(
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_08 (1).png";  dst = "01-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_08 (2).png";  dst = "02-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_08 (3).png";  dst = "03-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_09 (4).png";  dst = "04-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_09 (5).png";  dst = "05-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_09 (6).png";  dst = "06-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_10 (7).png";  dst = "07-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_10 (8).png";  dst = "08-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_11 (9).png";  dst = "09-canvas.png" },
    @{ src = "ChatGPT Image 4 maj 2026, 21_12_12 (10).png"; dst = "10-canvas.png" }
)

foreach ($m in $mapping) {
    $srcPath = Join-Path $srcDir $m.src
    $dstPath = Join-Path $dstDir $m.dst

    if (-not (Test-Path $srcPath)) {
        Write-Warning "Missing: $srcPath"
        continue
    }

    Copy-Item -Path $srcPath -Destination $dstPath -Force
    Write-Host "Copied: $($m.dst)"
}

Write-Host ""
Write-Host "Done. Output: $dstDir"
