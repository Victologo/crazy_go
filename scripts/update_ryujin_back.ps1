Add-Type -AssemblyName System.Drawing
$brainDir = "C:\Users\VICTOR\.gemini\antigravity\brain\b6c1ec87-c348-4498-a66d-c66eca4d96d2"
$src = Get-ChildItem "$brainDir\ryujin_back_v2_*.jpg" | Select-Object -First 1
$dest = "C:\Users\VICTOR\Desktop\crazy_go\public\heroes\ryujin_back.png"

if ($src) {
    $bmp = [System.Drawing.Bitmap]::FromFile($src.FullName)
    $output = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $pixel = $bmp.GetPixel($x, $y)
            $r = [int]$pixel.R
            $g = [int]$pixel.G
            $b = [int]$pixel.B

            $brightness = ($r + $g + $b) / 3.0
            $diff = [Math]::Max([Math]::Abs($r - $g), [Math]::Max([Math]::Abs($g - $b), [Math]::Abs($r - $b)))

            if ($brightness -gt 240 -and $diff -lt 18) {
                $newColor = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
            } elseif ($brightness -gt 220 -and $diff -lt 28) {
                $alpha = [int](255 * (1.0 - ($brightness - 220) / 20.0))
                if ($alpha -lt 0) { $alpha = 0 }
                if ($alpha -gt 255) { $alpha = 255 }
                $newColor = [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b)
            } else {
                $newColor = [System.Drawing.Color]::FromArgb(255, $r, $g, $b)
            }

            $output.SetPixel($x, $y, $newColor)
        }
    }

    $output.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $output.Dispose()
    $bmp.Dispose()
    Write-Host "Ryujin back view v2 updated successfully!"
} else {
    Write-Warning "Could not find ryujin_back_v2 in brainDir"
}
