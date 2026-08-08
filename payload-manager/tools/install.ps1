$D="$PWD"; $A="$D\arduino.zip"; $M="$D\micronucleus.zip"

Invoke-WebRequest "https://github.com/arduino/arduino-cli/releases/download/v1.5.2-rc.1/arduino-cli_1.5.2-rc.1_Windows_64bit.zip" -OutFile $A
Invoke-WebRequest "https://github.com/micronucleus/micronucleus/releases/download/v2.6/micronucleus-cli-master-882e7b4a-x86_64-MINGW64_NT-10.0-17763.zip" -OutFile $M

Expand-Archive $A -DestinationPath $D -Force
Expand-Archive $M -DestinationPath "$D\micronucleus_tmp" -Force
Get-ChildItem "$D\micronucleus_tmp" -Recurse -File | Move-Item -Destination $D -Force
Remove-Item "$D\micronucleus_tmp" -Recurse -Force
Remove-Item $A,$M