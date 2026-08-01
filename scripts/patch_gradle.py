path = 'mobile-app/android/app/build.gradle'
content = open(path).read()

if 'signingConfigs' in content:
    print('Gradle already patched')
    exit(0)

home = 'System.getProperty("user.home")'
signing_configs = (
    '    signingConfigs {\n'
    '        debug {\n'
    '            storeFile file(' + home + ' + "/.android/debug.keystore")\n'
    '            storePassword "android"\n'
    '            keyAlias "androiddebugkey"\n'
    '            keyPassword "android"\n'
    '        }\n'
    '    }\n'
)

# Insert signingConfigs block before buildTypes
if '    buildTypes {' in content:
    content = content.replace('    buildTypes {', signing_configs + '    buildTypes {', 1)
else:
    # fallback: different indentation
    content = content.replace('buildTypes {', signing_configs + 'buildTypes {', 1)

# Insert signingConfig signingConfigs.debug as first line inside buildTypes > debug
# Find "debug {" that comes AFTER "buildTypes {"
bt_index = content.find('buildTypes {')
debug_index = content.find('debug {', bt_index)
if debug_index != -1:
    insert_at = content.index('\n', debug_index) + 1
    content = content[:insert_at] + '            signingConfig signingConfigs.debug\n' + content[insert_at:]

open(path, 'w').write(content)
print('Gradle patched successfully')
print('--- Patched buildTypes section ---')
bt = content[content.find('buildTypes {'):content.find('buildTypes {')+300]
print(bt)
