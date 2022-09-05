
# IMRP Launcher

The source code of new shittier IMRP launcher created using Electron with no obfuscation.
They only obfuscated the index.js file forgot the main bundle.js file even if they did obfuscate it, it's easier to deobfuscate javascript.
Node.js is ofcourse a poor choice for making anti-cheat launcher. 

Anyone without any coding knowledge can easily bypass the new launcher by editing:

```bash
 C:\Users\YourPC\AppData\Local\imrp\app-1.3.8\resources\app\public\build\bundle.js 
 ```


## Installation
Remove "scripts" section from package.json file and then run these commands.

```bash
  cd to the folder
  npm install
```

After that add the "scripts" section back to package.json and do this:
```bash
 npm run start
```
    
