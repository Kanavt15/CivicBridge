param([string]$ApiUrl)
$ErrorActionPreference = 'Stop'
$projectPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $ApiUrl) {
  $connectionPath = Join-Path $projectPath '.data/mobile-connection.json'
  if (-not (Test-Path -LiteralPath $connectionPath)) { throw 'Run npm.cmd run mobile:connect first.' }
  $ApiUrl = (Get-Content -LiteralPath $connectionPath -Raw | ConvertFrom-Json).apiUrl
}
$previewUri = [Uri]$ApiUrl
if ($previewUri.Scheme -ne 'http' -or $previewUri.Port -ne 3000 -or $previewUri.AbsolutePath -ne '/' -or $previewUri.Query -or $previewUri.Fragment -or $previewUri.UserInfo -or $previewUri.Host -notmatch '^(127\.0\.0\.1$|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)') { throw 'This command builds a local preview only. Use EAS production builds for a deployed HTTPS origin.' }
$jdkPaths = @($env:JAVA_HOME, 'C:/Program Files/Android/Android Studio/jbr')
$buildJdk = $jdkPaths | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ 'bin/javac.exe')) } | Select-Object -First 1
if (-not $buildJdk) { throw 'Install JDK 21 or set JAVA_HOME to a supported JDK.' }
$buildSdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
if (-not (Test-Path -LiteralPath $buildSdk)) { throw 'Install the Android SDK or configure ANDROID_HOME.' }
$env:JAVA_HOME = $buildJdk
$env:ANDROID_HOME = $buildSdk
$env:GRADLE_USER_HOME = Join-Path $projectPath '.data/gradle'
$env:EXPO_PUBLIC_API_URL = $ApiUrl
$env:EXPO_PUBLIC_LOCAL_PREVIEW = 'true'
$env:NODE_ENV = 'production'
$env:EAS_BUILD_PROFILE = ''
$ninjaDir = Join-Path $projectPath '.data/tools/ninja'
if (-not (Test-Path -LiteralPath (Join-Path $ninjaDir 'ninja.exe'))) {
  New-Item -ItemType Directory -Path $ninjaDir -Force | Out-Null
  $ninjaZip = Join-Path $ninjaDir 'ninja-win.zip'
  Invoke-WebRequest -Uri 'https://github.com/ninja-build/ninja/releases/download/v1.13.2/ninja-win.zip' -OutFile $ninjaZip -UseBasicParsing
  $ninjaHash = (Get-FileHash -LiteralPath $ninjaZip -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($ninjaHash -ne '07fc8261b42b20e71d1720b39068c2e14ffcee6396b76fb7a795fb460b78dc65') { throw 'Ninja checksum verification failed.' }
  Expand-Archive -LiteralPath $ninjaZip -DestinationPath $ninjaDir -Force
}
Push-Location (Join-Path $projectPath 'mobile')
try {
  & npx.cmd expo prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw 'Android generation failed.' }
  Push-Location android
  try {
    & .\gradlew.bat assembleRelease '-PreactNativeArchitectures=arm64-v8a,x86_64' --max-workers=4 --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Android compilation failed.' }
  } finally { Pop-Location }
} finally { Pop-Location }
$artifactDir = Join-Path $projectPath 'artifacts'
New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null
$artifact = Join-Path $artifactDir 'CivicBridge-preview.apk'
Copy-Item -LiteralPath (Join-Path $projectPath 'mobile/android/app/build/outputs/apk/release/app-release.apk') -Destination $artifact
$hash = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLowerInvariant()
$metadata = @{ apiUrl = $ApiUrl; file = 'CivicBridge-preview.apk'; sha256 = $hash; builtAt = [DateTime]::UtcNow.ToString('o'); package = 'in.civicbridge.community.preview'; signing = 'Android debug certificate for local testing'; architectures = @('arm64-v8a', 'x86_64') }
[IO.File]::WriteAllText((Join-Path $artifactDir 'build-info.json'), ($metadata | ConvertTo-Json) + "`n", [Text.UTF8Encoding]::new($false))
Write-Output "Installable preview APK: $artifact"
Write-Output "Shared website/API: $ApiUrl"
Write-Output "SHA-256: $hash"
