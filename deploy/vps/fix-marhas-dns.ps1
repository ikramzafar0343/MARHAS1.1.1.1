# Run as Administrator - fixes marhas.pk DNS on Windows
#Right-click -> Run with PowerShell (as Admin)

$ErrorActionPreference = 'Stop'

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting administrator privileges..."
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

Write-Host "`n=== MARHAS DNS Fix ===" -ForegroundColor Cyan

# 1. Force DNS on all active adapters
Write-Host "[1/4] Setting DNS to 1.1.1.1 and 8.8.8.8 on all active adapters..."
Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.HardwareInterface } | ForEach-Object {
    try {
        Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses @('1.1.1.1','8.8.8.8') -ErrorAction Stop
        Write-Host "  Updated: $($_.Name)" -ForegroundColor Green
    } catch {
        Write-Host "  Skipped: $($_.Name) - $_" -ForegroundColor Yellow
    }
}

# 2. Disable IPv6 DNS preference issues (optional - helps some ISPs)
Write-Host "[2/4] Adding hosts file entries (direct to VPS)..."
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$entries = @(
    "132.148.73.92`tmarhas.pk",
    "132.148.73.92`twww.marhas.pk"
)
$content = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue
foreach ($entry in $entries) {
    $hostname = ($entry -split '\s+')[1]
    if ($content -notmatch [regex]::Escape($hostname)) {
        Add-Content -Path $hostsPath -Value $entry
        Write-Host "  Added: $entry" -ForegroundColor Green
    } else {
        Write-Host "  Already exists: $hostname" -ForegroundColor Gray
    }
}

# 3. Flush DNS
Write-Host "[3/4] Flushing DNS cache..."
ipconfig /flushdns | Out-Null
Clear-DnsClientCache -ErrorAction SilentlyContinue

# 4. Test
Write-Host "[4/4] Testing resolution..."
$resolved = [System.Net.Dns]::GetHostAddresses('marhas.pk') | Select-Object -ExpandProperty IPAddressToString
Write-Host "  marhas.pk resolves to: $($resolved -join ', ')" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri 'https://marhas.pk/api/v1/health' -UseBasicParsing -TimeoutSec 15
    Write-Host "  API health: $($response.StatusCode) $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "  API test: $_" -ForegroundColor Yellow
}

Write-Host "`nDone! Open https://marhas.pk in Chrome now." -ForegroundColor Cyan
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
