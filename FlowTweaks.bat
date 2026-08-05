
@echo off
title Flow Tweaks
color 0A
setlocal EnableDelayedExpansion

:: ============================================================
:: FLOW TWEAKS - AUTOMATED OPTIMIZATION SCRIPT
:: Run as Administrator
:: ============================================================

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo  [!] ERROR: Please run this script as Administrator.
    echo  [!] Right-click the file and select "Run as administrator"
    echo.
    pause
    exit /b
)

cls
echo.
echo  ███████╗██╗      ██████╗ ██╗    ██╗    ████████╗██╗    ██╗███████╗ █████╗ ██╗  ██╗███████╗
echo  ██╔════╝██║     ██╔═══██╗██║    ██║    ╚══██╔══╝██║    ██║██╔════╝██╔══██╗██║ ██╔╝██╔════╝
echo  █████╗  ██║     ██║   ██║██║ █╗ ██║       ██║   ██║ █╗ ██║█████╗  ███████║█████╔╝ ███████╗
echo  ██╔══╝  ██║     ██║   ██║██║███╗██║       ██║   ██║███╗██║██╔══╝  ██╔══██║██╔═██╗ ╚════██║
echo  ██║     ███████╗╚██████╔╝╚███╔███╔╝       ██║   ╚███╔███╔╝███████╗██║  ██║██║  ██╗███████║
echo  ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝        ╚═╝    ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
echo.
echo                          Automated PC Optimization Script
echo                    ----------------------------------------
echo.
echo  [!] Make sure you are connected to the internet before continuing.
echo  [!] This script will make system changes. A restore point will be created first.
echo  [!] At any step, type SKIP and press Enter to skip that tweak.
echo.
pause


:: ============================================================
echo.
echo  ============================================================
echo  [1/16] Creating restore point...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step1="> "
if /i "!step1!"=="skip" (
    echo  [SKIPPED] Restore point.
) else (
    echo  [..] Creating restore point - please wait...
    powershell -Command "Checkpoint-Computer -Description 'Flow Tweaks' -RestorePointType 'MODIFY_SETTINGS'"
    echo  [OK] Restore point created.
)


:: ============================================================
echo.
echo  ============================================================
echo  [2/16] Enabling Game Mode...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step2="> "
if /i "!step2!"=="skip" (
    echo  [SKIPPED] Game Mode.
) else (
    echo  [..] Adding registry keys...
    reg add "HKCU\Software\Microsoft\GameBar" /v "AllowAutoGameMode" /t REG_DWORD /d 1 /f
    reg add "HKCU\Software\Microsoft\GameBar" /v "AutoGameModeEnabled" /t REG_DWORD /d 1 /f
    echo  [OK] Game Mode enabled.
)


:: ============================================================
echo.
echo  ============================================================
echo  [3/16] Enabling Hardware Accelerated GPU Scheduling (HAGS)...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step3="> "
if /i "!step3!"=="skip" (
    echo  [SKIPPED] HAGS.
) else (
    echo  [..] Adding registry key...
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\GraphicsDrivers" /v "HwSchMode" /t REG_DWORD /d 2 /f
    echo  [OK] HAGS enabled.
)


:: ============================================================
echo.
echo  ============================================================
echo  [4/16] Disabling Memory Integrity (Core Isolation)...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step4="> "
if /i "!step4!"=="skip" (
    echo  [SKIPPED] Memory Integrity.
) else (
    echo  [..] Adding registry key...
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity" /v "Enabled" /t REG_DWORD /d 0 /f
    echo  [OK] Memory Integrity disabled.
)


:: ============================================================
echo.
echo  ============================================================
echo  [5/16] Setting Ultimate Performance power plan...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step5="> "
if /i "!step5!"=="skip" (
    echo  [SKIPPED] Ultimate Performance power plan.
) else (
    echo  [..] Duplicating power scheme...
    powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61
    echo  [..] Activating Ultimate Performance...
    for /f "tokens=4" %%i in ('powercfg -list ^| findstr /i "Ultimate Performance"') do (
        powercfg -setactive %%i
    )
    echo  [OK] Ultimate Performance power plan activated.
)


:: ============================================================
echo.
echo  ============================================================
echo  [6/16] Disabling Fast Startup...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step6="> "
if /i "!step6!"=="skip" (
    echo  [SKIPPED] Fast Startup.
) else (
    echo  [..] Adding registry key...
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Power" /v "HiberbootEnabled" /t REG_DWORD /d 0 /f
    echo  [OK] Fast Startup disabled.
)


:: ============================================================
echo.
echo  ============================================================
echo  [7/16] Disabling SysMain (Superfetch)...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step7="> "
if /i "!step7!"=="skip" (
    echo  [SKIPPED] SysMain.
) else (
    echo  [..] Stopping SysMain service...
    sc stop "SysMain"
    echo  [..] Disabling SysMain service...
    sc config "SysMain" start=disabled
    echo  [OK] SysMain disabled.
)


:: ============================================================
echo.
echo  ============================================================
echo  [8/16] Disabling Animation Effects...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step8="> "
if /i "!step8!"=="skip" (
    echo  [SKIPPED] Animation Effects.
) else (
    echo  [..] Adding registry keys...
    reg add "HKCU\Control Panel\Desktop\WindowMetrics" /v "MinAnimate" /t REG_SZ /d 0 /f
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "TaskbarAnimations" /t REG_DWORD /d 0 /f
    reg add "HKCU\Control Panel\Desktop" /v "UserPreferencesMask" /t REG_BINARY /d 9012038010000000 /f
    echo  [OK] Animation Effects disabled.
)


:: ============================================================
echo.
echo  ============================================================
echo  [9/16] Applying Adjust for Best Performance (visual effects)...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step9="> "
if /i "!step9!"=="skip" (
    echo  [SKIPPED] Visual effects.
) else (
    echo  [..] Setting VisualFXSetting to Custom...
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\VisualEffects" /v "VisualFXSetting" /t REG_DWORD /d 3 /f
    echo  [..] Disabling all visual effects except chosen three...
    reg add "HKCU\Control Panel\Desktop" /v "DragFullWindows" /t REG_SZ /d 1 /f
    reg add "HKCU\Control Panel\Desktop" /v "FontSmoothing" /t REG_SZ /d 2 /f
    reg add "HKCU\Control Panel\Desktop" /v "FontSmoothingType" /t REG_DWORD /d 2 /f
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "IconsOnly" /t REG_DWORD /d 0 /f
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "ListviewAlphaSelect" /t REG_DWORD /d 0 /f
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "ListviewShadow" /t REG_DWORD /d 0 /f
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" /v "TaskbarAnimations" /t REG_DWORD /d 0 /f
    reg add "HKCU\Control Panel\Desktop\WindowMetrics" /v "MinAnimate" /t REG_SZ /d 0 /f
    echo  [..] Enabling: Show thumbnails, Show window contents while dragging, Smooth edges of screen fonts...
    reg add "HKCU\Control Panel\Desktop" /v "UserPreferencesMask" /t REG_BINARY /d 9012038010000000 /f
    echo  [OK] Visual effects set to custom - only 3 essential options enabled.
)


:: ============================================================
echo.
echo  ============================================================
echo  [10/16] Enabling Dark Mode...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step10="> "
if /i "!step10!"=="skip" (
    echo  [SKIPPED] Dark Mode.
) else (
    echo  [..] Adding registry keys...
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" /v "AppsUseLightTheme" /t REG_DWORD /d 0 /f
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize" /v "SystemUsesLightTheme" /t REG_DWORD /d 0 /f
    echo  [OK] Dark Mode enabled.
)


:: ============================================================
echo.
echo  ============================================================
echo  [11/16] Applying Registry Tweaks...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step11="> "
if /i "!step11!"=="skip" (
    echo  [SKIPPED] Registry tweaks.
) else (
    echo  [..] Setting Games Scheduling Category to High...
    reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile\Tasks\Games" /v "Scheduling Category" /t REG_SZ /d "High" /f
    echo  [..] Setting Win32PrioritySeparation...
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\PriorityControl" /v "Win32PrioritySeparation" /t REG_DWORD /d 0x26 /f
    echo  [..] Setting NetworkThrottlingIndex...
    reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile" /v "NetworkThrottlingIndex" /t REG_DWORD /d 0xffffffff /f
    echo  [..] Setting SystemResponsiveness...
    reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Multimedia\SystemProfile" /v "SystemResponsiveness" /t REG_DWORD /d 0x10 /f
    echo  [OK] All registry tweaks applied.
)


:: ============================================================
echo.
echo  ============================================================
echo  [12/16] Setting DNS to Cloudflare (1.1.1.1)...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step12="> "
if /i "!step12!"=="skip" (
    echo  [SKIPPED] DNS.
) else (
    echo  [..] Detecting active network interface...
    for /f "tokens=3*" %%i in ('netsh interface show interface ^| findstr /i "connected"') do (
        echo  [..] Setting IPv4 DNS on: %%j
        netsh interface ipv4 set dnsservers "%%j" static 1.1.1.1 primary
        netsh interface ipv4 add dnsservers "%%j" 1.0.0.1 index=2
        echo  [..] Setting IPv6 DNS on: %%j
        netsh interface ipv6 set dnsservers "%%j" static 2606:4700:4700::1111
        netsh interface ipv6 add dnsservers "%%j" 2606:4700:4700::1001 index=2
    )
    echo  [..] Flushing DNS cache...
    ipconfig /flushdns
    echo  [OK] DNS set to Cloudflare and cache flushed.
)


:: ============================================================
echo.
echo  ============================================================
echo  [13/16] Clearing Temp Files...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step13="> "
if /i "!step13!"=="skip" (
    echo  [SKIPPED] Temp Files.
) else (
    echo  [..] Clearing %%temp%%...
    del /q /f /s "%temp%\*" 2^>nul
    echo  [..] Clearing Windows\Temp...
    del /q /f /s "C:\Windows\Temp\*" 2^>nul
    echo  [..] Clearing Prefetch...
    del /q /f /s "C:\Windows\Prefetch\*" 2^>nul
    echo  [OK] Temp files cleared. (Any "in use" files were automatically skipped)
)


:: ============================================================
echo.
echo  ============================================================
echo  [14/16] Running Disk Cleanup...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step14="> "
if /i "!step14!"=="skip" (
    echo  [SKIPPED] Disk Cleanup.
) else (
    echo  [..] Configuring cleanup categories...
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Active Setup Temp Folders" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\BranchCache" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Downloaded Program Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Internet Cache Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Memory Dump Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Old ChkDsk Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Previous Installations" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Recycle Bin" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Setup Log Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\System error memory dump files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Temporary Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Temporary Setup Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Thumbnail Cache" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Update Cleanup" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Windows Error Reporting Archive Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Windows Error Reporting Queue Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Windows Error Reporting System Archive Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Windows Error Reporting System Queue Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\VolumeCaches\Windows Upgrade Log Files" /v "StateFlags0001" /t REG_DWORD /d 2 /f >nul
    echo  [..] Running Disk Cleanup - a separate window will open, this is normal...
    cleanmgr /sagerun:1
    echo  [OK] Disk Cleanup complete.
)


:: ============================================================
echo.
echo  ============================================================
echo  [15/16] Running SFC corruption scan...
echo  ============================================================
echo  NOTE: This can take 5-15 minutes. Do NOT close this window.
echo  You will see live progress below. This is normal.
echo  Press Enter to run or type SKIP to skip.
set /p step16="> "
if /i "!step16!"=="skip" (
    echo  [SKIPPED] SFC scan.
) else (
    echo  [..] Starting SFC scan - live output below:
    echo  ----------------------------------------
    sfc /scannow
    echo  ----------------------------------------
    echo  [OK] SFC scan complete.
)


:: ============================================================
echo.
echo  ============================================================
echo  [16/16] Disabling Fullscreen Optimizations...
echo  ============================================================
echo  Press Enter to run or type SKIP to skip.
set /p step17="> "
if /i "!step17!"=="skip" (
    echo  [SKIPPED] Fullscreen Optimizations.
) else (
    echo  [..] Adding registry keys...
    reg add "HKCU\System\GameConfigStore" /v "GameDVR_FSEBehaviorMode" /t REG_DWORD /d 2 /f
    reg add "HKCU\System\GameConfigStore" /v "GameDVR_HonorUserFSEBehaviorMode" /t REG_DWORD /d 1 /f
    echo  [OK] Fullscreen Optimizations disabled.
)


:: ============================================================
:: DONE
:: ============================================================
cls
echo.
echo  ███████╗██╗      ██████╗ ██╗    ██╗    ████████╗██╗    ██╗███████╗ █████╗ ██╗  ██╗███████╗
echo  ██╔════╝██║     ██╔═══██╗██║    ██║    ╚══██╔══╝██║    ██║██╔════╝██╔══██╗██║ ██╔╝██╔════╝
echo  █████╗  ██║     ██║   ██║██║ █╗ ██║       ██║   ██║ █╗ ██║█████╗  ███████║█████╔╝ ███████╗
echo  ██╔══╝  ██║     ██║   ██║██║███╗██║       ██║   ██║███╗██║██╔══╝  ██╔══██║██╔═██╗ ╚════██║
echo  ██║     ███████╗╚██████╔╝╚███╔███╔╝       ██║   ╚███╔███╔╝███████╗██║  ██║██║  ██╗███████║
echo  ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝        ╚═╝    ╚══╝╚══╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
echo.
echo                             All automated tweaks complete!
echo                    ----------------------------------------
echo.
echo  ----------------------------------------
echo  [!] A REBOOT IS REQUIRED to apply all changes.
echo  ----------------------------------------
echo.
pause

