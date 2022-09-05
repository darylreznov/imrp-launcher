process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true
const {
  app,
  BrowserWindow,
  nativeTheme,
  autoUpdater,
  dialog,
  Menu,
  Tray,
  ipcMain,
  desktopCapturer,
} = require('electron')
if (require('electron-squirrel-startup')) {
  app.quit()
}
const path = require('path'),
  fs = require('fs'),
  { Response } = require('electron-fetch'),
  Stream = require('stream'),
  si = require('systeminformation'),
  fetch = require('electron-fetch').default,
  Downloader = require('nodejs-file-downloader'),
  md5File = require('md5-file'),
  extract = require('extract-zip'),
  log = require('electron-log')
const remote = require('@electron/remote/main')
remote.initialize()
let myWindow
const gotTheLock = app.requestSingleInstanceLock()
!gotTheLock && app.quit()
;(function () {
  let _0x244e36
  try {
    const _0x1c2407 = Function(
      'return (function() {}.constructor("return this")( ));'
    )
    _0x244e36 = _0x1c2407()
  } catch (_0x24043a) {
    _0x244e36 = window
  }
  _0x244e36.setInterval(_0x2af6c5, 4000)
})()
const debugMode = process.argv[1] == '--debug' || !app.isPackaged,
  DEBUG_MODE = false,
  API_URL = DEBUG_MODE
    ? 'http://localhost:3000'
    : 'https://launcher-api.sa-mp.im',
  packageJs = require('./package.json'),
  VERSION = packageJs.version
global.tempPath = path.join(app.getPath('temp'), 'imrpupdater-' + VERSION)
if (!fs.existsSync(global.tempPath)) {
  fs.mkdirSync(global.tempPath)
}
process.platform === 'win32' && app.setAppUserModelId('IM:RP Launcher')
nativeTheme.themeSource = 'light'
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  awaitWriteFinish: true,
})
let downloadAttempts = 0,
  lastSentProgress = 0
const startAutoUpdater = async () => {
    try {
      const _0x2198bb = VERSION
      log
        .scope('updater')
        .info('starting auto updater, local version is ' + _0x2198bb)
      const _0x5106ea = {
        directory: global.tempPath,
        cloneFiles: false,
        maxAttempts: 3,
        fileName: 'RELEASES',
        url:
          'http://cdn.launcher.sa-mp.im/download/RELEASES?localVersion=' +
          VERSION,
        onProgress: (_0x48090b) => {},
      }
      let _0x58f12e = _0x5106ea
      const _0x1941e3 = new Downloader(_0x58f12e)
      await _0x1941e3.download()
      const _0x3d7e4e = fs.readFileSync(
        path.join(global.tempPath, 'RELEASES'),
        'utf-8'
      )
      let [_0x1e399d, _0x127338, _0x1bb7f8] = _0x3d7e4e
        .trim()
        .split('\n')
        .pop()
        .split(' ')
      _0x127338 = path.basename(_0x127338)
      const _0x2f6eb1 = _0x127338.match(/([0-9+]).([0-9+]).([0-9+])/)[0]
      log.scope('updater').info('last version foundin RELEASES is ' + _0x2f6eb1)
      autoUpdater
        .on('error', function () {
          log.scope('updater').error('an error occuring during autoUpdater'),
            log.scope('updater').error(arguments),
            createMainWindow()
        })
        .on('checking-for-update', function () {
          log.scope('updater').info('checking-for-update')
        })
        .on('update-available', function () {
          log.scope('updater').info('update-available!')
        })
        .on('update-not-available', async function () {
          log.scope('updater').info('there is no update available.')
          createMainWindow()
        })
        .on('update-downloaded', function () {
          log
            .scope('updater')
            .info('update has been downloaded, quitting and installing..'),
            autoUpdater.quitAndInstall()
        })
      if (!debugMode && _0x2198bb != _0x2f6eb1) {
        await onUpdateAvailable()
        _0x58f12e = {
          url: 'http://cdn.launcher.sa-mp.im/download/' + _0x127338,
          directory: global.tempPath,
          cloneFiles: false,
          maxAttempts: 3,
          onProgress: (_0x49706e) => {
            if (_0x49706e - lastSentProgress < 0.1) {
              return
            }
            myWindow &&
              myWindow.webContents.send('updateDownloadProgress', _0x49706e)
            lastSentProgress = _0x49706e
          },
        }
        log.scope('updater').info('downloading from ' + _0x58f12e.url)
        const _0x2361b6 = new Downloader(_0x58f12e)
        await _0x2361b6.download()
        log.scope('updater').info('pkg download complete!')
        const _0x59c9d3 = { url: global.tempPath }
        autoUpdater.setFeedURL(_0x59c9d3)
        log.scope('updater').info('setting feed url to ' + global.tempPath)
        if (!debugMode) {
          autoUpdater.checkForUpdates()
        } else {
          createMainWindow()
        }
      } else {
        log
          .scope('updater')
          .info('local version matches remote version, no need to update'),
          createMainWindow()
      }
    } catch (_0xb04dfd) {
      downloadAttempts++
      log.scope('updater').error('error while downloading the latest update')
      log.scope('updater').error(_0xb04dfd)
      if (downloadAttempts >= 3) {
        createMainWindow()
      } else {
        startAutoUpdater()
      }
    }
  },
  onUpdateAvailable = async () => {
    log.scope('updater').info('creating update window..')
    const _0x458a17 = {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
    }
    const _0x1c3e18 = {
      width: 780,
      height: 200,
      resizable: debugMode,
      darkTheme: false,
      title: 'IM:RP Launcher is updating..',
      fullscreenable: false,
      icon: __dirname + '/app-icon.ico',
      titleBarStyle: 'default',
      webPreferences: _0x458a17,
    }
    myWindow = new BrowserWindow(_0x1c3e18)
    remote.enable(myWindow.webContents)
    myWindow.webContents.userAgent = 'imrpupdater/' + VERSION
    myWindow.loadFile(path.join(__dirname, 'public/index.html'))
    if (debugMode === false) {
      myWindow.setMenu(null)
    } else {
      myWindow.webContents.openDevTools()
      log.scope('updater').info('opening dev tools..')
    }
  },
  checkAssetsVersion = async () => {
    try {
      let _0x5847d7 = false,
        _0x29b0cc
      const _0x1b0b92 = path.join(__dirname, 'assets.zip')
      if (!fs.existsSync(_0x1b0b92)) {
        _0x5847d7 = true
      }
      if (!_0x5847d7) {
        _0x29b0cc = md5File.sync(_0x1b0b92)
      }
      const _0x499f4f = {}
      _0x499f4f['user-agent'] = 'imrplauncher/assets/' + VERSION
      const _0x893a45 = await fetch(API_URL + '/api/v1/version/assets', {
          method: 'get',
          headers: _0x499f4f,
        }),
        _0x482a62 = await _0x893a45.json(),
        { version: _0x494af5 } = _0x482a62
      if (_0x29b0cc != _0x494af5) {
        log
          .scope('updater')
          .info(
            'assets are not updated! localAssetsHash: ' +
              _0x29b0cc +
              ' remoteVersion ' +
              _0x494af5
          )
        _0x5847d7 = true
      }
      if (_0x5847d7 && !debugMode) {
        const _0x3a01dd = {
          directory: __dirname,
          cloneFiles: false,
          maxAttempts: 3,
          fileName: 'assets.zip',
          url: 'http://cdn.launcher.sa-mp.im/download/assets.zip',
          onProgress: (_0x430b90) => {},
        }
        let _0x534e03 = _0x3a01dd
        const _0x1db7ea = new Downloader(_0x534e03)
        await _0x1db7ea.download()
        const _0x49ede7 = md5File.sync(path.join(__dirname, 'assets.zip'))
        if (_0x49ede7 == _0x494af5) {
          log.scope('updater').info('extracting assets now..')
          await extract(path.join(__dirname, 'assets.zip'), {
            dir: path.join(__dirname),
          })
          log.scope('updater').info('extracted!')
        }
      } else {
        log.scope('updater').info('assets are still up to date')
      }
    } catch (_0x4d7c66) {
      log
        .scope('updater')
        .error('an error happened trying to check assets version')
      log.scope('updater').error(_0x4d7c66)
    }
  },
  createMainWindow = async () => {
    await checkAssetsVersion()
    const _0x29e760 = {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
    }
    const _0x12e051 = {
      show: false,
      width: 960,
      height: 540,
      resizable: debugMode,
      darkTheme: false,
      title: 'IM:RP Launcher (' + VERSION + ')',
      fullscreenable: false,
      icon: __dirname + '/app-icon.ico',
      titleBarStyle: 'default',
      webPreferences: _0x29e760,
    }
    myWindow = new BrowserWindow(_0x12e051)
    remote.enable(myWindow.webContents)
    myWindow.webContents.userAgent = 'imrplauncher/' + VERSION
    myWindow.loadFile(path.join(__dirname, 'public/index.html'))
    debugMode === false
      ? myWindow.setMenu(null)
      : myWindow.webContents.openDevTools()
    myWindow.once('ready-to-show', () => {
      if (myWindow) {
        myWindow.show()
      }
    })
    let _0x2f7383 = null
    myWindow.on('minimize', () => {
      if (_0x2f7383) {
        return myWindow.hide()
      }
      _0x2f7383 = new Tray(__dirname + '/app-icon.ico')
      const _0x163ffb = [
          {
            label: 'Show Launcher',
            click: function () {
              myWindow.show()
            },
          },
          { type: 'separator' },
          {
            label: 'Quit',
            click: function () {
              myWindow.close()
            },
          },
        ],
        _0x28c535 = Menu.buildFromTemplate(_0x163ffb)
      _0x2f7383.setContextMenu(_0x28c535)
      _0x2f7383.setToolTip('IM:RP Launcher')
      _0x2f7383.on('click', () => {
        myWindow.show()
      })
      myWindow.hide()
    })
  }
app.on('ready', async () => {
  createMainWindow()
})
app.on('window-all-closed', async () => {
  let { list: _0x2cf1fa } = await si.processes()
  const _0x34a330 = _0x2cf1fa.find(
    (_0xd53a83) => _0xd53a83.name === 'gta_sa.exe'
  )
  if (_0x34a330) {
    log
      .scope('app')
      .info('closing launcher, killing gta process id ' + _0x34a330.pid)
    process.kill(_0x34a330.pid)
  }
  app.quit()
})
ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', (_0x395230, _0x3ad905) =>
  desktopCapturer.getSources(_0x3ad905)
)
process.on('uncaughtException', function (_0x3c40d5) {
  log.scope('app').error(_0x3c40d5)
})
function _0x2af6c5(_0x189272) {
  function _0x244cfa(_0x5f24c) {
    if (typeof _0x5f24c === 'string') {
      return function (_0x2af21c) {}
        .constructor('while (true) {}')
        .apply('counter')
    } else {
      ;('' + _0x5f24c / _0x5f24c).length !== 1 || _0x5f24c % 20 === 0
        ? function () {
            return true
          }
            .constructor('debugger')
            .call('action')
        : function () {
            return false
          }
            .constructor('debugger')
            .apply('stateObject')
    }
    _0x244cfa(++_0x5f24c)
  }
  try {
    if (_0x189272) {
      return _0x244cfa
    } else {
      _0x244cfa(0)
    }
  } catch (_0x2a44e1) {}
}
