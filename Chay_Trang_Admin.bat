@echo off
chcp 65001 >nul
title Trung Tam Quan Tri 20/10 - Danhh Cho Anh

echo ==========================================================
echo 💖 DANG KHOI DONG TRANG QUAN TRI QUA TANG 20/10...
echo ==========================================================
echo.

:: Kiem tra va khoi dong Node Server
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %errorlevel% neq 0 (
    echo [1/2] Dang khoi dong Database Server tai cong 3000...
    start /min "20-10-Server" cmd /c "node server.js"
    timeout /t 2 /nobreak >nul
) else (
    echo [1/2] Database Server da san sang tai cong 3000!
)

:: Mo trinh duyet truc tiep vao trang admin voi ma PIN 0702
echo [2/2] Dang mo trang Quan Tri tren trinh duyet...
start http://localhost:3000/admin.html?pin=0702

echo.
echo ==========================================================
echo ✅ DA MO TRANG QUAN TRI THANH CONG!
echo.
echo 👉 Link Admin Local:    http://localhost:3000/admin.html
echo 👉 Link Web Cua Be:     http://localhost:3000/
echo 👉 Link Admin Online:   https://lavang390-max.github.io/20-10/admin.html
echo 🔑 Ma PIN bao mat:      0702 (hoac 2010)
echo ==========================================================
echo.
echo (Ban co the thu nho cua so nay, khong can tat di de server luon hoat dong)
pause
