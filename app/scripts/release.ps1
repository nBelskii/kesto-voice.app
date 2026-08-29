# Публікує реліз Kesto на kesto-releases одним запуском.
#
# Разове налаштування (один раз, назавжди):
#   1. github.com/settings/tokens -> Generate new token -> Fine-grained token
#   2. Resource owner: твій акаунт. Repository access: Only select repositories -> kesto-releases
#   3. Permissions -> Repository permissions -> Contents -> Read and write
#   4. Згенеруй, скопіюй значення, і в PowerShell виконай (з реальним токеном):
#        setx KESTO_RELEASES_TOKEN "твій_токен_тут"
#      Потім ЗАКРИЙ і ЗАНОВО ВІДКРИЙ PowerShell (setx діє тільки в нових вікнах).
#
# Використання (після того як підняв версію в 3 файлах і закомітив):
#   cd app
#   .\scripts\release.ps1

$ErrorActionPreference = "Stop"

if (-not $env:KESTO_RELEASES_TOKEN) {
    Write-Host "KESTO_RELEASES_TOKEN не встановлено. Дивись інструкцію на початку цього файлу." -ForegroundColor Red
    exit 1
}

$config = Get-Content "src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
$version = $config.version
$tag = "v$version"
Write-Host "Версія: $version (тег $tag)"

Write-Host "Збираю застосунок..."
npm run tauri build

$bundleDir = "src-tauri/target/release/bundle/nsis"
$exe = Get-ChildItem "$bundleDir/*.exe" | Select-Object -First 1
$sig = Get-ChildItem "$bundleDir/*.exe.sig" | Select-Object -First 1
if (-not $exe -or -not $sig) {
    Write-Host "Не знайдено .exe/.exe.sig в $bundleDir — збірка не вдалась?" -ForegroundColor Red
    exit 1
}
$sigContent = (Get-Content $sig.FullName -Raw).Trim()

$latest = @{
    version   = $version
    notes     = "Реліз $tag"
    pub_date  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    platforms = @{
        "windows-x86_64" = @{
            signature = $sigContent
            url       = "https://github.com/nBelskii/kesto-releases/releases/download/$tag/$($exe.Name)"
        }
    }
} | ConvertTo-Json -Depth 5
Set-Content -Path "latest.json" -Value $latest -Encoding utf8

$headers = @{
    Authorization = "token $env:KESTO_RELEASES_TOKEN"
    Accept        = "application/vnd.github+json"
}
$body = @{ tag_name = $tag; name = $tag; body = "Реліз $tag" } | ConvertTo-Json

Write-Host "Створюю реліз $tag на kesto-releases..."
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/nBelskii/kesto-releases/releases" -Method Post -Headers $headers -Body $body -ContentType "application/json"
$uploadBase = ($release.upload_url -replace '\{.*\}', '')

foreach ($file in @($exe.FullName, $sig.FullName, (Resolve-Path "latest.json").Path)) {
    $name = Split-Path $file -Leaf
    Write-Host "Заливаю $name..."
    Invoke-RestMethod -Uri "$uploadBase?name=$name" -Method Post -Headers $headers -InFile $file -ContentType "application/octet-stream" | Out-Null
}

Remove-Item "latest.json"
Write-Host "Готово: https://github.com/nBelskii/kesto-releases/releases/tag/$tag" -ForegroundColor Green
