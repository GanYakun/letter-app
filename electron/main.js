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

const db = new sqlite3.Database('memory.db', (err) => {
    if (err) {
        console.error('Failed to open database:', err);
    } else {
        console.log('Database opened');
    }
});

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
                contextIsolation: true,
                nodeIntegration: true,
                webSecurity: false,        // 禁用 CORS 限制
                allowRunningInsecureContent: true // 允许不安全内容
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
    }

    win.removeMenu();

    if (process.env.npm_lifecycle_event === 'mini_app_chat_dev') {
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
        registerShortcuts();
    } else {
        win.loadFile(path.join(__dirname, '../mini-app/chatapp/login/index.html'));
    }

})

