
ECHO "It is expected that you are in DisOrganized/"

REM build server
CD server/

go mod tidy && go build -o ../client/server.exe

REM build client
CD ../client

npm -i && npm run make && CD .. 

set SCRIPT="%TEMP%\%RANDOM%-%RANDOM%-%RANDOM%-%RANDOM%.vbs"

SET CURRENTDIR=%cd%

echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = "%CURRENTDIR%\DisOrganized.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%CURRENTDIR%\client\out\client-win32-x64\client.exe" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript /nologo %SCRIPT%
del %SCRIPT%