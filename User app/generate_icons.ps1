Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\deept\.gemini\antigravity-ide\brain\bc823b7d-4b3e-4a4a-a356-9e02b5a8ff43\media__1785150787570.jpg"
$baseDir = "c:\website\Yumpass\6amstudio-business-package-v1.0-bdjxuz\package-v1.0\User app"

# Android Launcher Icons
$androidSizes = @{
    "android\app\src\main\res\mipmap-mdpi\ic_launcher.png" = 48
    "android\app\src\main\res\mipmap-hdpi\ic_launcher.png" = 72
    "android\app\src\main\res\mipmap-xhdpi\ic_launcher.png" = 96
    "android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png" = 144
    "android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" = 192
}

# iOS AppIcon Set
$iosSizes = @{
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\20.png" = 20
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\29.png" = 29
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\40.png" = 40
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\50.png" = 50
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\57.png" = 57
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\58.png" = 58
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\60.png" = 60
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\72.png" = 72
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\76.png" = 76
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\80.png" = 80
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\87.png" = 87
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\100.png" = 100
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\114.png" = 114
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\120.png" = 120
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\144.png" = 144
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\152.png" = 152
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\167.png" = 167
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\180.png" = 180
    "ios\Runner\Assets.xcassets\AppIcon.appiconset\1024.png" = 1024
}

$allTargets = $androidSizes + $iosSizes
$srcImage = [System.Drawing.Image]::FromFile($srcPath)

foreach ($relPath in $allTargets.Keys) {
    $size = $allTargets[$relPath]
    $destPath = Join-Path $baseDir $relPath
    
    $destDir = Split-Path $destPath -Parent
    if (!(Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.DrawImage($srcImage, 0, 0, $size, $size)
    
    $bitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

$srcImage.Dispose()
Write-Host "All Android and iOS icons generated successfully!"
