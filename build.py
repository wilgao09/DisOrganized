
import os

DEBUG = 1


def debug(s):
    if (DEBUG):
        print(s)


def cmd(s):
    os.system(s)


WINDOWS_CREATE_SHORTCUT = '''set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%.vbs"
SET CURRENTDIR=%cd%
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = "%CURRENTDIR%\DisOrganized.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%CURRENTDIR%\build\out\client-win32-x64\client.exe" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%'''

DELETE_ALL_TS = "del /S *.ts && del /S *.tsx"


def build():
    print("You should be in the top level directory of DisOrganized")

    debug("clean build")
    cmd("rmdir /s /q build")

    debug("build server")
    cmd("cd server && go mod tidy && go build -o ../client/rsrc/server.exe && cd ..")

    debug("build svelte")
    cmd("cd svelte && npm run build && xcopy /q /E /y /i build ..\client\\rsrc\\svelte && cd ..")

    debug("compile ts to js")
    # windows specific
    # cmd("cd client && xcopy src dist /E /y && tsc && cd dist && {} && cd ../..".format(DELETE_ALL_TS))
    cmd("xcopy /q /E /y /i client build ")
    cmd("cd build && tsc && cd src && rm -r *.ts && rm -r *.tsx && cd../..")

    debug("build client")
    cmd("cd build  &&  npm run make && cd .. ")

    # windows only


build()
