@echo off
setlocal enabledelayedexpansion

REM ⚛️ Banking Bot Frontend Setup Script for Windows
REM This script automates the React frontend setup process

echo ⚛️ Banking Bot Frontend Setup Starting...
echo =========================================
echo.

REM Check prerequisites
echo [INFO] Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    echo [ERROR] Please install Node.js 18 or higher from https://nodejs.org
    echo [ERROR] Make sure to check "Add to PATH" during installation
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js %NODE_VERSION% found

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. It should come with Node.js
    pause
    exit /b 1
)

for /f "tokens=1" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm %NPM_VERSION% found

REM Check if we're in the banking-bot-ui directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the banking-bot-ui directory
    echo [ERROR] Current directory: %cd%
    echo [ERROR] Expected files: package.json, src\, public\
    pause
    exit /b 1
)

REM Verify it's the correct package.json
findstr /c:"vite" package.json >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This doesn't appear to be the banking-bot-ui directory
    echo [ERROR] Make sure you're in the correct folder with the React frontend
    pause
    exit /b 1
)

echo [SUCCESS] Running from correct directory: %cd%

REM Step 1: Clean install
echo [INFO] Step 1/4: Cleaning previous installation...

if exist "node_modules" (
    echo [WARNING] Removing existing node_modules...
    rmdir /s /q node_modules
)

if exist "package-lock.json" (
    echo [WARNING] Removing existing package-lock.json...
    del package-lock.json
)

echo [SUCCESS] Cleanup completed

REM Step 2: Install dependencies with fallback strategies
echo [INFO] Step 2/4: Installing frontend dependencies...
echo [WARNING] This may take 1-3 minutes depending on your internet connection...

set INSTALL_SUCCESS=false

REM Strategy 1: Normal install
echo [INFO] Trying: Standard npm install
npm install
if %errorlevel% equ 0 (
    set INSTALL_SUCCESS=true
    echo [SUCCESS] Dependencies installed successfully ^(standard method^)
) else (
    echo [WARNING] Standard install failed, trying fallback strategies...
    
    REM Strategy 2: Legacy peer deps
    echo [INFO] Trying: npm install --legacy-peer-deps
    npm install --legacy-peer-deps
    if !errorlevel! equ 0 (
        set INSTALL_SUCCESS=true
        echo [SUCCESS] Dependencies installed successfully ^(with legacy peer deps^)
    ) else (
        echo [WARNING] Legacy peer deps failed, trying force install...
        
        REM Strategy 3: Force install
        echo [INFO] Trying: npm install --force
        npm install --force
        if !errorlevel! equ 0 (
            set INSTALL_SUCCESS=true
            echo [SUCCESS] Dependencies installed successfully ^(with force^)
        ) else (
            echo [WARNING] Force install failed, trying cache clean...
            
            REM Strategy 4: Clean cache and retry
            echo [INFO] Trying: Clean cache + legacy peer deps
            echo [WARNING] Cleaning npm cache...
            npm cache clean --force
            npm install --legacy-peer-deps
            if !errorlevel! equ 0 (
                set INSTALL_SUCCESS=true
                echo [SUCCESS] Dependencies installed successfully ^(after cache clean^)
            )
        )
    )
)

REM Check if any strategy worked
if "%INSTALL_SUCCESS%"=="false" (
    echo [ERROR] ❌ All installation strategies failed!
    echo.
    echo 🔧 MANUAL TROUBLESHOOTING:
    echo ==========================
    echo 1. Check your internet connection
    echo 2. Try: npm install --legacy-peer-deps
    echo 3. Try: npm install --force
    echo 4. Try: npm cache clean --force ^&^& npm install
    echo 5. Delete node_modules and package-lock.json, then retry
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] ✅ All frontend dependencies installed successfully!

REM Step 3: Verify installation
echo [INFO] Step 3/4: Verifying installation...

REM Check if essential dependencies are installed
if not exist "node_modules" (
    echo [ERROR] node_modules directory not found after installation
    pause
    exit /b 1
)

REM Check for key packages
set REQUIRED_PACKAGES=react vite typescript @types/react
for %%p in (%REQUIRED_PACKAGES%) do (
    if not exist "node_modules\%%p" (
        echo [ERROR] Required package '%%p' not found
        pause
        exit /b 1
    )
)

echo [SUCCESS] Installation verified - all required packages found

REM Step 4: Create startup script
echo [INFO] Step 4/4: Creating startup script...

(
echo @echo off
echo cd /d "%%~dp0"
echo echo ⚛️ Starting Banking Bot Frontend...
echo echo 📍 Frontend URL: http://localhost:3000
echo echo 🔄 Backend API: http://localhost:2024
echo echo Press Ctrl+C to stop the server
echo echo.
echo echo Make sure the backend is running before using the frontend!
echo echo.
echo npm run dev
echo pause
) > start_frontend.bat

echo [SUCCESS] Created start_frontend.bat script

REM Skip build test as it's not essential for workshop
echo [INFO] Skipping build test - development server is ready

echo.
echo 🎉 FRONTEND SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo [SUCCESS] ✅ Node.js and npm verified
echo [SUCCESS] ✅ All dependencies installed
echo [SUCCESS] ✅ Installation verified
echo [SUCCESS] ✅ Startup script created
echo.
echo 📋 NEXT STEPS:
echo ==============
echo.
echo [WARNING] 1. MAKE SURE BACKEND IS RUNNING:
echo    - Go to the BankingBot directory
echo    - Double-click: start_banking_bot.bat
echo    - Verify backend is running at: http://localhost:2024/health
echo.
echo [WARNING] 2. START THE FRONTEND:
echo    Double-click: start_frontend.bat
echo    OR run: npm run dev
echo.
echo [WARNING] 3. OPEN YOUR BROWSER:
echo    http://localhost:3000
echo.
echo 🧪 TEST THE COMPLETE SYSTEM:
echo ============================
echo 1. Open http://localhost:3000
echo 2. Login with test user: sarah_chen / password123 ^(or other workshop accounts^)
echo 3. Ask: 'What is my account balance?'
echo 4. Ask: 'Show me my recent transactions'
echo 5. Ask: 'What are international transfer fees?'
echo.
echo 🔗 USEFUL LINKS:
echo ================
echo Frontend:    http://localhost:3000
echo Backend API: http://localhost:2024/docs
echo Health:      http://localhost:2024/health
echo.
echo [SUCCESS] Happy coding! 🚀
echo.
echo Press any key to continue...
pause >nul
