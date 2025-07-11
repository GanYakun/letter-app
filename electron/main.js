import { app, BrowserWindow, Menu, shell, globalShortcut } from 'electron'
import { ipcMain } from 'electron';
import sqlite3 from 'sqlite3'
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


// 配置文件路径
const defaultConfigPath = path.join(__dirname, '../config.json');
const userConfigPath = path.join(app.getPath('userData'), 'config.json');

// 首次启动时自动复制 config.json 到 userData 目录
function ensureUserConfig() {
  if (!fs.existsSync(userConfigPath)) {
    if (fs.existsSync(defaultConfigPath)) {
      fs.copyFileSync(defaultConfigPath, userConfigPath);
      console.log('已复制默认配置到', userConfigPath);
    } else {
      // 如果没有默认配置，可以写入一个空对象或默认内容
      fs.writeFileSync(userConfigPath, JSON.stringify({}), 'utf-8');
      console.log('未找到默认配置，已创建空配置文件', userConfigPath);
    }
  }
}

// 读取 config.json 配置
function getUserConfig() {
  try {
    const data = fs.readFileSync(userConfigPath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.warn('读取配置文件失败:', e.message);
    return {};
  }
}

let win
// 监听配置请求
ipcMain.handle('get-config', () => {
  console.log('已复制默认配置到', userConfigPath);
  return getUserConfig();
});

// 获取记忆数据
ipcMain.handle('get-memories', () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM memories', (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});

// 获取记忆数据
ipcMain.handle('get-memory-by-password', (event, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM memories WHERE password = ?';
        db.get(sql, [password], (err, row) => {
            if (err) {
                console.error('Database error:', err);
                reject(err);
            } else {
                resolve(row); // 返回一条记录
            }
        });
    });
});

// 添加新记忆
ipcMain.handle('add-memory', (event, title, content, password, unlockTime) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO memories (title, content, password, unlockTime, created_at) VALUES (?, ?, ?, ?, ?)');
        stmt.run(title, content, password, unlockTime, new Date().toISOString(), function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
        stmt.finalize();
    });
});

ipcMain.handle('login-success', (event, username) => {
    if (!win.isDestroyed()) {
        win.close();
        win = new BrowserWindow({
            width: 830,
            height: 640,
            minHeight: 640,
            minWidth: 830,
            titleBarStyle: 'hidden',
            titleBarOverlay: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        })
        win.loadFile(path.join(__dirname, '../mini-app/chatapp/main/index.html'), { 
            search: `?username=${encodeURIComponent(username)}`
});
    }
});

ipcMain.on('minimize-window', () => {
    if (!win.isDestroyed()) win.minimize();
});

ipcMain.on('toggle-maximize', () => {
    if (!win.isDestroyed()) {
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    }
});

ipcMain.on('close-window', () => {
    if (!win.isDestroyed()) win.close();
});

ipcMain.on('start-drag', () => {
    if (!win.isDestroyed()) win.webContents.sendInputEvent({ type: 'mouseDown', x: 0, y: 0 });
});

ipcMain.on('toggle-fullscreen', (event) => {
  if (!win.isDestroyed()) {
    if (win.isFullScreen()) {
      win.setFullScreen(false); // 退出全屏
    } else {
      win.setFullScreen(true); // 进入全屏
    }
  }
});

// 接收图片并保存
ipcMain.on('save-captured-image', (event, imageData) => {
  const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

  // 获取当前时间并格式化为 YYYYMMDDHHMMSS
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const data = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8'));
  console.log("获取配置", data);
  const saveDir = data.photoSavePath;
  const fileName = `photo_${timestamp}.png`;
  const filePath = path.join(saveDir, fileName);

  // 确保目录存在
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  fs.writeFile(filePath, base64Data, 'base64', (err) => {
    if (err) {
      console.error('保存图片失败:', err);
      event.reply('save-captured-image-reply', { success: false, error: err });
    } else {
      console.log(`图片已保存至: ${filePath}`);
      event.reply('save-captured-image-reply', { success: true, path: filePath });
    }
  });
});

ipcMain.handle('create-person-folder', async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-person-image', async (event, { folderPath, fileName, imageData }) => {
  try {
    // 只保留base64部分
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const filePath = path.join(folderPath, fileName);

    // 确保文件夹存在
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFileSync(filePath, base64Data, 'base64');
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('download-excel-file', async (event, filePath) => {
    // const filePath = 'F:\\work doc\\别人的项目\\人脸识别\\20250630识别结果.xlsx';

    if (!fs.existsSync(filePath)) {
        return { success: false, error: '文件不存在' };
    }

    try {
        const data = fs.readFileSync(filePath);
        const base64 = data.toString('base64');
        return { success: true, data: base64, filename: path.basename(filePath) };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

const db = new sqlite3.Database('memory.db', (err) => {
    if (err) {
        console.error('Failed to open database:', err);
    } else {
        console.log('Database opened');
    }
});

db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        password TEXT,
        unlockTime TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // 插入数据示例
    // const stmt = db.prepare('INSERT INTO memories (title, content, created_at) VALUES (?, ?, ?)');
    // stmt.run('First Memory', 'This is my first memory.', new Date().toISOString());
    // stmt.finalize();

    // 删除数据示例
    // const stmt = db.prepare('DELETE FROM memories');
    // stmt.run();
    // stmt.finalize();

    //删除表
    // const stmt = db.prepare('DROP TABLE memories');
    // stmt.run();
    // stmt.finalize();

    // 查询数据示例
    db.all('SELECT * FROM memories', (err, rows) => {
        if (err) {
            console.error('Error querying database:', err);
        } else {
            console.log('Memories:', rows);
        }
    });
});

app.whenReady().then(() => {
    ensureUserConfig();
    if (process.env.npm_lifecycle_event === 'mini_app_chat_dev') {
        win = new BrowserWindow({
            width: 830,
            height: 640,
            minHeight: 640,
            minWidth: 830,
            titleBarStyle: 'hidden',
            titleBarOverlay: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        })
    } 
    else if (process.env.npm_lifecycle_event === 'login') { 
        win = new BrowserWindow({
            width: 415,
            height: 340,
            minHeight: 340,
            minWidth: 415,
            titleBarStyle: 'hidden',
            titleBarOverlay: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: false,
                nodeIntegration: true,
                webSecurity: false,        // 禁用 CORS 限制
                allowRunningInsecureContent: true // 允许不安全内容
            }
        })
    } else if (process.env.npm_lifecycle_event === 'mini_app_camera_dev') {
         win = new BrowserWindow({
            width: 1100,
            height: 680,
            fullscreen: true,
            icon: path.join(__dirname, '../renderer/assets/exam_icon.png'), // ✅ 图标路径
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: false,
            }
        })
    }
    else {
        win = new BrowserWindow({
            width: 1100,
            height: 680,
            fullscreen: true,
            icon: path.join(__dirname, '../renderer/assets/exam_icon.png'), // ✅ 图标路径
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: false,
                webSecurity: false, // 允许本地资源和摄像头
                devTools: true // 可选
            }
        })
        // win = new BrowserWindow({
        //     width: 870,
        //     height: 640,
        //     icon: path.join(__dirname, '../renderer/assets/exam_icon.png'), // ✅ 图标路径
        //     webPreferences: {
        //         preload: path.join(__dirname, 'preload.js'),
        //         contextIsolation: true,
        //         nodeIntegration: false,
        //     }
        // })
    }

    win.removeMenu();

    // ✅ 自定义菜单栏模板
    // const menuTemplate = [
    //     {
    //         label: '文件',
    //         submenu: [
    //             {
    //                 label: '打开',
    //                 click: () => {
    //                     console.log('点击了打开');
    //                 }
    //             },
    //             {
    //                 label: '退出',
    //                 role: 'quit' // 使用 Electron 内置行为
    //             }
    //         ]
    //     }
    // ];

    // ✅ 应用菜单栏
    // const menu = Menu.buildFromTemplate(menuTemplate);
    // Menu.setApplicationMenu(menu);

    if (process.env.npm_lifecycle_event === 'dev') {
        win.loadURL('http://localhost:3000');
    } else if (process.env.npm_lifecycle_event === 'mini_app_exam_dev') {
        win.loadFile(path.join(__dirname, '../mini-app/opration_examination.html'))
    } else if (process.env.npm_lifecycle_event === 'mini_app_chat_dev') {
        win.loadFile(path.join(__dirname, '../mini-app/chatapp/main/index.html'))

        // 注册 Ctrl+R 快捷键
        const registerShortcuts = () => {
            globalShortcut.register('CommandOrControl+R', () => {
                if (!win.isDestroyed() && win.webContents) {
                    win.webContents.reload();
                }
            });

            globalShortcut.register('CommandOrControl+Q', () => {
                win.webContents.openDevTools();
            });
        };

        registerShortcuts();

        // 应用退出时取消注册
        app.on('will-quit', () => {
            globalShortcut.unregisterAll();
        });
    } else if (process.env.npm_lifecycle_event === 'login') {
        win.loadFile(path.join(__dirname, '../mini-app/chatapp/login/index.html'));

        // 注册 Ctrl+R 快捷键
        const registerShortcuts = () => {
            globalShortcut.register('CommandOrControl+R', () => {
                if (!win.isDestroyed() && win.webContents) {
                    win.webContents.reload();
                }
            });

            globalShortcut.register('CommandOrControl+Q', () => {
                win.webContents.openDevTools();
            });
        };

        registerShortcuts();
    } else if (process.env.npm_lifecycle_event === 'mini_app_camera_dev') {
        win.loadFile(path.join(__dirname, '../mini-app/camera-capture.html'));
    }  
    else {
        // win.loadFile(path.join(__dirname, '../renderer/index.html'));
        win.loadFile(path.join(__dirname, '../mini-app/camera-capture.html'));
    }

    
    win.webContents.openDevTools();

})

