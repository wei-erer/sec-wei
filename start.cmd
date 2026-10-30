@echo off
chcp 65001 >nul
setlocal

rem ============================================================
rem  sec(wei) - 本地构建 + 预览
rem  双击运行即可：先构建，再在 http://127.0.0.1:4321 起一个预览服务
rem  如果系统里没装 Node.js，会自动退回到 DSH 自带的 Node
rem ============================================================

cd /d "%~dp0"

set "NODE=node"
where node >nul 2>nul || set "NODE=%USERPROFILE%\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%NODE%" goto :nonode
if not exist "node_modules\astro\astro.js" goto :nodeps

set ASTRO_TELEMETRY_DISABLED=1

echo.
echo [1/2] 构建中...
"%NODE%" node_modules\astro\astro.js build || goto :fail

echo.
echo [2/2] 启动预览：http://127.0.0.1:4321
echo       关闭这个窗口即可停止。
echo.
"%NODE%" node_modules\astro\astro.js preview --host 127.0.0.1 --port 4321
goto :eof

:nodeps
echo.
echo [错误] 还没安装依赖，请先运行： npm install
pause
goto :eof

:nonode
echo.
echo [错误] 找不到 Node.js。请安装 Node.js 20+，或者直接用 DSH 让 AI 帮你运行。
pause
goto :eof

:fail
echo.
echo [错误] 构建失败，请看上面的报错信息。
pause
goto :eof
