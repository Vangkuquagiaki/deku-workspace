import { NextResponse } from "next/server";

export async function GET() {
  const scriptContent = `@echo off
chcp 65001 >nul
title Deku Workspace - Trinh Cai Dat Ung Dung Desktop Windows
color 0A

echo =======================================================================
echo          DEKU ENTERPRISE WORKSPACE - WINDOWS DESKTOP SETUP
echo =======================================================================
echo.
echo [*] Dang khoi tao ung dung Deku cho he dieu hanh Windows...
echo [*] URL He thong: https://deku-workspace.vercel.app
echo.

set "TARGET_URL=https://deku-workspace.vercel.app"
set "APP_NAME=Deku Workspace"

:: Tao thu muc ung dung va tai icon chinh thuc
set "APP_DIR=%LocalAppData%\\DekuWorkspace"
if not exist "%APP_DIR%" mkdir "%APP_DIR%"
curl -s -k -o "%APP_DIR%\\icon.ico" "https://deku-workspace.vercel.app/favicon.ico" >nul 2>&1

:: Kiem tra trinh duyet phu hop de tao Standalone App Window
set "BROWSER_EXE="
set "BROWSER_TYPE="

if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
    set "BROWSER_TYPE=Microsoft Edge"
) else if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" (
    set "BROWSER_EXE=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
    set "BROWSER_TYPE=Microsoft Edge"
) else if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
    set "BROWSER_TYPE=Google Chrome"
) else if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" (
    set "BROWSER_EXE=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
    set "BROWSER_TYPE=Google Chrome"
) else if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" (
    set "BROWSER_EXE=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
    set "BROWSER_TYPE=Google Chrome"
)

if "%BROWSER_EXE%"=="" (
    echo [!] Khong tim thay Edge hoac Chrome. Khoi chay trinh duyet mac dinh...
    start "" "%TARGET_URL%"
    goto finish
)

echo [+] Phat hien engine: %BROWSER_TYPE%
echo [*] Dang tao loi tat ung dung Desktop rieng biet tren Man hinh chinh...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
    "$icon = [System.IO.Path]::Combine($env:LocalAppData, 'DekuWorkspace', 'icon.ico'); " ^
    "$shortcutPath = [System.IO.Path]::Combine($desktop, '%APP_NAME%.lnk'); " ^
    "$shortcut = $ws.CreateShortcut($shortcutPath); " ^
    "$shortcut.TargetPath = '%BROWSER_EXE%'; " ^
    "$shortcut.Arguments = '--app=\"%TARGET_URL%\"'; " ^
    "$shortcut.Description = 'Nen tang hop tac doanh nghiep, phong hop video va tro ly AI Deku'; " ^
    "if (Test-Path $icon) { $shortcut.IconLocation = $icon; } " ^
    "$shortcut.Save(); " ^
    "$startMenu = [Environment]::GetFolderPath('Programs'); " ^
    "$smShortcutPath = [System.IO.Path]::Combine($startMenu, '%APP_NAME%.lnk'); " ^
    "$smShortcut = $ws.CreateShortcut($smShortcutPath); " ^
    "$smShortcut.TargetPath = '%BROWSER_EXE%'; " ^
    "$smShortcut.Arguments = '--app=\"%TARGET_URL%\"'; " ^
    "$smShortcut.Description = 'Nen tang hop tac doanh nghiep, phong hop video va tro ly AI Deku'; " ^
    "if (Test-Path $icon) { $smShortcut.IconLocation = $icon; } " ^
    "$smShortcut.Save();"

echo [+] Da tao loi tat 'Deku Workspace' tren Desktop va Start Menu thanh cong!
echo [*] Ung dung hoat dong doc lap voi giao dien rieng biet (Standalone App Window).
echo.
echo [*] Dang mo ung dung Deku Workspace...
start "" "%BROWSER_EXE%" --app="%TARGET_URL%"

:finish
echo.
echo =======================================================================
echo          CAI DAT HOAN TAT - CHUC BAN CO TRAI NGHIEM LAM VIEC TOT!
echo =======================================================================
timeout /t 3 >nul
exit
`;

  return new NextResponse(scriptContent, {
    status: 200,
    headers: {
      "Content-Type": "application/x-bat",
      "Content-Disposition": 'attachment; filename="Deku-Workspace-Setup.cmd"',
      "Cache-Control": "no-store",
    },
  });
}

