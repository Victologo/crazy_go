Add-Type -AssemblyName System.Drawing

function Remove-BlackBackground($srcPath, $dstPath) {
    $bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
    $outBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $pixel = $bmp.GetPixel($x, $y)
            $brightness = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
            
            if ($brightness -lt 18) {
                $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } elseif ($brightness -lt 40) {
                $alpha = [int](($brightness - 18) / 22.0 * 255)
                $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
            } else {
                $outBmp.SetPixel($x, $y, $pixel)
            }
        }
    }
    $bmp.Dispose()
    $outBmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
    Write-Host "Processed $dstPath"
}

$baseDir = "C:\Users\VICTOR\.gemini\antigravity\brain\bea40b08-d082-47d0-bf90-e0c0d152f645"
Remove-BlackBackground "$baseDir\nature_pine_tree_1787822840938.jpg" "public\nature\nature_pine.png"
Remove-BlackBackground "$baseDir\nature_sakura_tree_1787822855335.jpg" "public\nature\nature_sakura.png"
Remove-BlackBackground "$baseDir\nature_bamboo_cluster_1787822870487.jpg" "public\nature\nature_bamboo.png"
Remove-BlackBackground "$baseDir\nature_vines_moss_1787822885148.jpg" "public\nature\nature_vines.png"

# Copy to dist as well
New-Item -ItemType Directory -Force -Path "dist\nature"
Copy-Item "public\nature\*" -Destination "dist\nature\" -Force
