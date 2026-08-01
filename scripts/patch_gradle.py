import os

path = 'mobile-app/android/app/build.gradle'
gradle = open(path).read()

if 'signingConfigs' not in gradle:
    home = 'System.getProperty("user.home")'
    signing_block = (
        '\nsigningConfigs {\n'
        '    debug {\n'
        '        storeFile file(' + home + ' + "/.android/debug.keystore")\n'
        '        storePassword "android"\n'
        '        keyAlias "androiddebugkey"\n'
        '        keyPassword "android"\n'
        '    }\n'
        '}\n'
    )
    gradle = gradle.replace('android {', 'android {' + signing_block, 1)
    gradle = gradle.replace('debug {', 'debug {\n            signingConfig signingConfigs.debug', 1)
    open(path, 'w').write(gradle)
    print('Gradle patched')
else:
    print('Gradle already patched')
