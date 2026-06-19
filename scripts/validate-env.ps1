# Validate local environment before build/deploy.
# Does not print secret values.

$required = @(
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
)

$optional = @(
  'RESEND_API_KEY',
  'RESEND_AUDIENCE',
  'EMAIL_FROM',
  'NEXT_PUBLIC_SITE_URL',
  'HUGGINGFACE_API_KEY'
)

$envPath = Join-Path $PSScriptRoot '..\.env.local'
if (Test-Path $envPath) {
  Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line -match '^\s*([^=]+)=') {
      $key = $matches[1].Trim()
      $value = ($line.Substring($line.IndexOf('=') + 1)).Trim().Trim('"').Trim("'")
      Set-Item -Force -Path "Env:$key" -Value $value | Out-Null
    }
  }
}

$missing = @()
foreach ($key in $required) {
  if (-not [Environment]::GetEnvironmentVariable($key)) {
    $missing += $key
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing required environment variables:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  exit 1
}

Write-Host "Required environment variables are present." -ForegroundColor Green
Write-Host "Optional variables:" -ForegroundColor Cyan
foreach ($key in $optional) {
  if ([Environment]::GetEnvironmentVariable($key)) {
    Write-Host "  - $key" -ForegroundColor Green
  } else {
    Write-Host "  - $key (not set)" -ForegroundColor DarkGray
  }
}
