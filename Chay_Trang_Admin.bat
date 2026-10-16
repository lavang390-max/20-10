@echo off
chcp 65001 >nul
title Trung Tam Quan Tri 20/10 - Danh Cho Anh

echo ==========================================================
echo 💖 DANG KHOI DONG HE THONG DONG BO QUA TANG 20/10...
echo ==========================================================
echo.

:: 1. Kiem tra va khoi dong Node Database Server
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [1/3] Dang khoi dong Database Server tai cong 3000...
    start /min "20-10-Server" cmd /c "node server.js"
    timeout /t 2 /nobreak >nul
) else (
    echo [1/3] Database Server da san sang tai cong 3000!
)

:: 2. Kiem tra va khoi dong Cloudflare Tunnel dong bo toan cau
tasklist /fi "imagename eq cloudflared.exe" 2>NUL | find /i "cloudflared.exe" >nul
if %errorlevel% neq 0 (
    echo [2/3] Dang khoi dong Duong Truyen Dong Bo Toan Cau (Cloudflare Tunnel)...
    start /min "Cloudflare-Tunnel-2010" cmd /c "npx -y cloudflared tunnel --url http://localhost:3000"
    timeout /t 3 /nobreak >nul
) else (
    echo [2/3] Duong Truyen Dong Bo Toan Cau da san sang!
)

:: 3. Mo trinh duyet truc tiep vao trang admin
echo [3/3] Dang mo trang Quan Tri tren trinh duyet...
start http://localhost:3000/admin.html?pin=0702

echo.
echo ==========================================================
echo ✅ HE THONG DONG BO TOAN CAU HOAT DONG 100%!
echo.
echo 📱 LINK GUI CHO BE (Mo duoc tren moi dien thoai 4G/Wi-Fi):
echo    https://memphis-likes-timely-privileges.trycloudflare.com/
echo.
echo 💻 LINK QUAN TRI CUA ANH:
echo    http://localhost:3000/admin.html?pin=0702
echo    https://memphis-likes-timely-privileges.trycloudflare.com/admin.html?pin=0702
echo.
echo 🔑 Ma PIN bao mat: 0702
echo ==========================================================
echo.
echo (Ban co the thu nho cua so nay, khong can tat di de server luon hoat dong)
pause
