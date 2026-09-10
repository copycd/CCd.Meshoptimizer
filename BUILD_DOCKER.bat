@echo off
chcp 65001 > nul
setlocal EnableExtensions

:: ============================================================================
:: copycd:: Heliosen gltfpack - 고객 배포용 Docker 이미지 만들기  -  클릭 한 번
::
:: 이 파일을 더블클릭하면
::   1) WSL2 우분투로 들어가서
::   2) docker build 로 이미지를 만들고 (ubuntu 22.04 기반, 2단계 빌드)
::   3) 이미지 안에서 --selftest 와 실제 변환을 1회씩 돌려보고
::   4) docker save 로 dist\docker\heliosen-gltfpack-<날짜>.tar 를 뽑고
::   5) 고객 안내문(INSTALL.txt)과 체크섬(SHA256SUMS)까지 만든다.
::
:: 고객에게 보낼 것은 dist\docker 폴더의 3개 파일이다.
:: Dockerfile 은 사내 레시피이므로 보내지 않는다. (소스가 있어야 빌드된다)
::
:: 실제 작업은 같은 폴더의 ccd-docker-release.sh 가 한다. (WSL 셸에서 직접 실행해도 됨)
::
:: 옵션은 그대로 넘어간다:
::   BUILD_DOCKER.bat --tag 2026.09.10      태그 지정 (기본: 오늘 날짜)
::   BUILD_DOCKER.bat --platform linux/arm64   ARM 서버용
::   BUILD_DOCKER.bat --no-save             이미지만 만들고 tar 는 생략
::   BUILD_DOCKER.bat --no-cache            처음부터 다시 빌드
::   BUILD_DOCKER.bat --help                전체 옵션
::
:: Docker Desktop 이 실행 중이어야 한다.
:: 다른 배포판을 쓰려면 아래 WSL_DISTRO 를 수정.
:: 창이 안 멈추게 하려면 환경변수 CCD_NO_PAUSE 를 설정.
:: ============================================================================

set "WSL_DISTRO=Ubuntu"
set "SCRIPT=ccd-docker-release.sh"

:: %~dp0 는 끝에 백슬래시가 붙는다. 인용부호를 깨뜨리므로 떼어낸다.
set "SRCDIR=%~dp0"
if "%SRCDIR:~-1%"=="\" set "SRCDIR=%SRCDIR:~0,-1%"

where wsl.exe >nul 2>&1
if errorlevel 1 (
    echo [ERROR] wsl.exe 를 찾을 수 없습니다. WSL2 를 먼저 설치하세요.
    echo         관리자 PowerShell 에서:  wsl --install
    set "RC=1"
    goto :done
)

if not exist "%SRCDIR%\%SCRIPT%" (
    echo [ERROR] %SCRIPT% 가 없습니다: %SRCDIR%
    set "RC=1"
    goto :done
)

:: 지정한 배포판을 쓸 수 있는지 확인, 안 되면 기본 배포판으로 진행
set "DISTRO_ARG=-d %WSL_DISTRO%"
wsl.exe -d %WSL_DISTRO% -- true >nul 2>&1
if errorlevel 1 (
    echo [WARN] WSL 배포판 "%WSL_DISTRO%" 을 쓸 수 없습니다. 기본 배포판으로 진행합니다.
    set "DISTRO_ARG="
)

echo ================================================================
echo   Heliosen gltfpack - 배포용 Docker 이미지 만들기
echo     distro : %WSL_DISTRO%
echo     source : %SRCDIR%
echo     args   : %*
echo ================================================================
echo.

wsl.exe %DISTRO_ARG% --cd "%SRCDIR%" -- bash "./%SCRIPT%" %*
set "RC=%ERRORLEVEL%"

echo.
if "%RC%"=="0" (
    echo ================================================================
    echo   성공  ^(exit 0^)
    echo   배포물: %SRCDIR%\dist\docker\
    echo ================================================================
) else (
    echo ================================================================
    echo   실패  ^(exit %RC%^)
    echo   자세한 내용:  %SRCDIR%\ccd-docker-release.log
    echo ================================================================
)

:done
if not defined CCD_NO_PAUSE pause
endlocal & exit /b %RC%
