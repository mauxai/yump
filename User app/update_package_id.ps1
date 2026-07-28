$targetDir = "c:\website\Yumpass\6amstudio-business-package-v1.0-bdjxuz\package-v1.0\User app"
$files = Get-ChildItem -Path $targetDir -Recurse -File -Include "*.kts","*.kt","*.xml","*.json","*.plist","*.txt","*.pbxproj","*.entitlements"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -and $content.Contains("com.lumen.lumen")) {
        $updated = $content.Replace("com.lumen.lumen", "com.yumpass.ai")
        [System.IO.File]::WriteAllText($file.FullName, $updated)
        Write-Host "Updated $($file.FullName)"
    }
}
Write-Host "Package identifier replacement completed."
