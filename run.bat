@echo off
REM Change this path to your MongoDB bin folder where mongod.exe is
set MONGO_BIN="C:\Program Files\MongoDB\Server\6.0\bin"

REM Change this path to your MongoDB data directory
set MONGO_DB_PATH="C:\data\db"

REM Path to your backend (Node.js) project folder
set BACKEND_DIR="C:\Users\atbar\Desktop\reactapp"

REM Start MongoDB server
echo Starting MongoDB server...
start cmd /k "%MONGO_BIN%\mongod.exe --dbpath %MONGO_DB_PATH%"

REM Wait a few seconds for MongoDB to start up before starting backend
timeout /t 5

REM Start backend server
echo Starting backend server...
start cmd /k "cd /d %BACKEND_DIR% && node server.js"

REM Wait a few seconds before starting frontend
timeout /t 5

REM Start frontend React app (assumes you use npm start)
echo Starting React frontend...
start cmd /k "cd /d %BACKEND_DIR% && npm start"

echo All services started.
pause
