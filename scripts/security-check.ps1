# Basic security hygiene checks before deployment.
# Does not prove security; it catches common mistakes.
# Local .env files and dependencies are intentionally skipped.

$root = Split-Path -Parent $PSScriptRoot
$fail = $false

Write-Host "Checking repository for secret leaks..." -ForegroundColor Cyan

$patterns = @(
  'SUPABASE_SERVICE_ROLE_KEY\s*=\s*sb_',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*ey',
  'RESEND_API_KEY\s*=\s*re_',
  'sk_[A-Za-z0-9_-]{20,}',
  'ghp_[A-Za-z0-9_]{36,}'
)

$files = Get-ChildItem -Path $root -Recurse -File |
  Where-Object {
    $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\dist\\|\\.git\\' -and
    $_.FullName -notmatch '\\\.env(\.local)?$' -and
    $_.Extension -in @('.json','.ts','.tsx','.md','.sql','.js','.mjs')
  }

foreach ($file in $files) {
  try {
    $content = Get-Content -Raw -Path $file.FullName -ErrorAction Stop
    foreach ($pattern in $patterns) {
      if ($content -match $pattern) {
        Write-Host "Potential secret pattern in $($file.FullName)" -ForegroundColor Red
        $fail = $true
      }
    }
  } catch {}
}

$ignoredEnv = Select-String -Path (Join-Path $root '.gitignore') -Pattern '^\.env'
if (-not $ignoredEnv) {
  Write-Host ".env files are not ignored in .gitignore" -ForegroundColor Red
  $fail = $true
}

if ($fail) {
  Write-Host "Security hygiene check failed. Review before pushing/deploying." -ForegroundColor Red
  exit 1
}

Write-Host "Security hygiene check passed." -ForegroundColor Green
