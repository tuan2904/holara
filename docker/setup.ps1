$ErrorActionPreference = 'Stop'
$target = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $target) {
    throw 'docker/.env already exists. Keep it; this script will not overwrite credentials.'
}
function New-HexSecret {
    $bytes = [byte[]]::new(32)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToHexString($bytes).ToLowerInvariant()
}
$key = [byte[]]::new(32)
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($key) } finally { $rng.Dispose() }
$values = @{
    MYSQL_PASSWORD = (New-HexSecret)
    MYSQL_ROOT_PASSWORD = (New-HexSecret)
    JWT_SECRET = (New-HexSecret)
    INTERNAL_API_KEY = (New-HexSecret)
    LARAVEL_APP_KEY = ('base64:' + [Convert]::ToBase64String($key))
}
$content = Get-Content -LiteralPath (Join-Path $PSScriptRoot '.env.example') -Raw
foreach ($name in $values.Keys) {
    $content = [regex]::Replace($content, "(?m)^$name=[ \t]*\r?$", "$name=$($values[$name])")
}
Set-Content -LiteralPath $target -Value $content -Encoding utf8NoBOM
Write-Output 'Created MeDecode docker/.env with separate credentials. No credentials were printed.'
