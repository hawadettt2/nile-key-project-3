# Apply Supabase SQL migrations in the required order.
# Usage:
#   .\scripts\migrate-supabase.ps1 -Mode Copy
#   .\scripts\migrate-supabase.ps1 -Mode OpenEditor
#
# This script does not execute SQL automatically because Supabase migrations should be reviewed before production.
# It prepares a combined migration file and opens it for review.

param(
  [ValidateSet('Copy','OpenEditor')]
  [string]$Mode = 'Copy'
)

$root = Split-Path -Parent $PSScriptRoot
$migrations = @(
  (Join-Path $root 'schema.sql'),
  (Join-Path $root 'src\migrations\rbac-hardening.sql'),
  (Join-Path $root 'migrations\01-audit-triggers.sql')
)

foreach ($file in $migrations) {
  if (-not (Test-Path $file)) {
    Write-Host "Missing migration file: $file" -ForegroundColor Red
    exit 1
  }
}

$output = Join-Path $root 'dist\supabase-combined-migrations.sql'
New-Item -ItemType Directory -Force -Path (Split-Path $output) | Out-Null

$header = @"
-- Combined Nile-Key3 Supabase migration bundle
-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- Run in Supabase SQL Editor in this order if not using this combined file:
-- 1. schema.sql
-- 2. src/migrations/rbac-hardening.sql
-- 3. migrations/01-audit-triggers.sql

"@

Set-Content -Path $output -Value $header -Encoding UTF8
foreach ($file in $migrations) {
  Add-Content -Path $output -Value "`r`n-- ============================================================`r`n-- FILE: $file`r`n-- ============================================================`r`n" -Encoding UTF8
  Add-Content -Path $output -Value (Get-Content -Raw -Path $file) -Encoding UTF8
}

Write-Host "Combined migration bundle created:" -ForegroundColor Green
Write-Host $output -ForegroundColor Cyan

if ($Mode -eq 'OpenEditor') {
  Invoke-Item $output
}

Write-Host "`r`nReview the bundle, then run it in Supabase SQL Editor." -ForegroundColor Yellow
