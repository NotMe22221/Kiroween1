@echo off
echo.
echo ========================================
echo   🧪 Testing ShadowCache Demo
echo ========================================
echo.

echo [1/3] Building packages...
cd ..
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Checking demo files...
cd demo
if not exist index.html (
    echo ❌ index.html not found!
    pause
    exit /b 1
)
if not exist app.js (
    echo ❌ app.js not found!
    pause
    exit /b 1
)
if not exist styles.css (
    echo ❌ styles.css not found!
    pause
    exit /b 1
)

echo ✅ All demo files present!
echo.
echo [3/3] Starting demo server...
echo.
echo ========================================
echo   🎉 Demo is ready!
echo ========================================
echo.
echo   Open your browser to:
echo   http://localhost:3000
echo.
echo   Press Ctrl+C to stop
echo ========================================
echo.

npx serve . -p 3000
