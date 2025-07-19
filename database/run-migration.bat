@echo off
title MTI Attendance System - Database Migration Tool

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                MTI Attendance System                         ║
echo ║                Database Migration Tool                       ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ package.json not found
    echo Please run this script from the database directory
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
)

REM Run the migration tool
echo 🚀 Starting Migration Tool...
echo.
node migration-tool.js

echo.
echo 👋 Migration tool finished
pause