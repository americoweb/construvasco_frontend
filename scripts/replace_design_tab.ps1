$file = "src\app\modules\admin\job-cards\detail\job-card-detail.component.html"
$newSection = Get-Content -Raw "scripts\design_tab_section.html" -Encoding UTF8
$lines = Get-Content -Encoding UTF8 $file
$total = $lines.Count
$before = $lines[0..401]
$after  = $lines[663..($total-1)]
$newLines = $newSection -split "`n"
$combined = $before + $newLines + $after
$combined | Set-Content -Encoding UTF8 $file
Write-Host "Done. Total lines: $($combined.Count)"
