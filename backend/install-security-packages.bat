@echo off
REM SetGo Backend - Security Packages Installation Script (Windows)
REM This script installs all new security-related dependencies

echo.
echo 🔐 Installing Security Packages for SetGo Backend
echo ==================================================
echo.

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the backend directory.
    exit /b 1
)

echo 📦 Installing required security packages...
echo.

REM Install security packages
call npm install helmet express-rate-limit express-mongo-sanitize joi

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Installation failed. Please check your npm configuration.
    exit /b 1
)

echo.
echo ✅ Security packages installed successfully!
echo.
echo 📋 Next steps:
echo    1. Run: node scripts/generateSecrets.js
echo    2. Update your .env file with the generated secrets
echo    3. Review DEPLOYMENT_CHECKLIST.md for full deployment guide
echo.
echo 🎉 You're ready to test the security improvements!
echo.

pause
