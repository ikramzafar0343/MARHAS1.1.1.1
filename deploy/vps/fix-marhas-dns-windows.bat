@echo off
:: Run as Administrator: right-click -> Run as administrator
:: Fixes marhas.pk not opening (DNS_PROBE_FINISHED_NXDOMAIN) on Pakistani ISP DNS

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Right-click this file and choose "Run as administrator"
    pause
    exit /b 1
)

echo.
echo [1/3] Setting DNS to Cloudflare + Google...
powershell -NoProfile -Command "Set-DnsClientServerAddress -InterfaceAlias 'Wi-Fi' -ServerAddresses @('1.1.1.1','8.8.8.8') -ErrorAction SilentlyContinue"
powershell -NoProfile -Command "Get-NetAdapter | Where-Object Status -eq 'Up' | ForEach-Object { Set-DnsClientServerAddress -InterfaceIndex $_.ifIndex -ServerAddresses @('1.1.1.1','8.8.8.8') -ErrorAction SilentlyContinue }"

echo [2/3] Adding hosts fallback (direct to your VPS)...
set HOSTS=%SystemRoot%\System32\drivers\etc\hosts
findstr /C:"marhas.pk" %HOSTS% >nul 2>&1
if errorlevel 1 (
    echo.>>%HOSTS%
    echo # MARHAS - bypass slow ISP DNS>>%HOSTS%
    echo 132.148.73.92 marhas.pk www.marhas.pk>>%HOSTS%
)

echo [3/3] Flushing DNS cache...
ipconfig /flushdns >nul

echo.
echo Done! Open https://marhas.pk in Chrome now.
echo.
nslookup marhas.pk 1.1.1.1
echo.
pause
