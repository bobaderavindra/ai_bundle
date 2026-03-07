cd C:\Ravindra\Development\SOFTWARE\kafka-4.2.0-src\kafka-4.2.0-src\
start cmd /k bin\windows\zookeeper-server-start.bat config\zookeeper.properties
timeout /t 10
start cmd /k bin\windows\kafka-server-start.bat config\server.properties