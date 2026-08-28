Add-Type -AssemblyName System.Drawing

$brainDir = "C:\Users\VICTOR\.gemini\antigravity\brain\b6c1ec87-c348-4498-a66d-c66eca4d96d2"
$heroesTargetDir = "C:\Users\VICTOR\Desktop\crazy_go\public\heroes"
$publicDir = "C:\Users\VICTOR\Desktop\crazy_go\public"

# Copy background images
Copy-Item "$brainDir\bg_rogue_choice_dojo_*.jpg" "$publicDir\bg_choice_dojo.jpg" -Force
Copy-Item "$brainDir\bg_rogue_choice_map_path_*.jpg" "$publicDir\bg_choice_map.jpg" -Force
Write-Host "Backgrounds copied successfully."

# Function to remove white background with soft alpha thresholding
function Convert-ToTransparentPng($srcPath, $destPath) {
    Write-Host "Processing $srcPath -> $destPath"
    $bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
    $output = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $pixel = $bmp.GetPixel($x, $y)
            $r = [int]$pixel.R
            $g = [int]$pixel.G
            $b = [int]$pixel.B

            # Calculate brightness and color saturation
            $brightness = ($r + $g + $b) / 3.0
            $diff = [Math]::Max([Math]::Abs($r - $g), [Math]::Max([Math]::Abs($g - $b), [Math]::Abs($r - $b)))

            # If pixel is near white/light grey with very low color saturation
            if ($brightness -gt 242 -and $diff -lt 15) {
                # Completely transparent
                $newColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
            } elseif ($brightness -gt 225 -and $diff -lt 25) {
                # Smooth alpha falloff
                $alpha = [int](255 * (1.0 - ($brightness - 225) / 17.0))
                if ($alpha -lt 0) { $alpha = 0 }
                if ($alpha -gt 255) { $alpha = 255 }
                $newColor = [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b)
            } else {
                $newColor = [System.Drawing.Color]::FromArgb(255, $r, $g, $b)
            }

            $output.SetPixel($x, $y, $newColor)
        }
    }

    $output.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $output.Dispose()
    $bmp.Dispose()
    Write-Host "Saved $destPath"
}

$heroes = @("tengu", "ronin", "kitsune", "ryujin", "himiko", "alchemist", "normal")

foreach ($hero in $heroes) {
    $src = Get-ChildItem "$brainDir\${hero}_back_*.jpg" | Select-Object -First 1
    if ($src) {
        $dest = "$heroesTargetDir\${hero}_back.png"
        Convert-ToTransparentPng $src.FullName $dest
    } else {
        Write-Warning "Could not find asset for $hero in $brainDir"
    }
}

Write-Host "All hero back views processed!"
