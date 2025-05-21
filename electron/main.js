import { app, BrowserWindow, Menu, globalShortcut } from 'electron'
import { ipcMain } from 'electron';
import sqlite3 from 'sqlite3'
import path from 'path';
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let win

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
                nodeIntegration: false
            }
        })
    } 
    else {
        win = new BrowserWindow({
            width: 870,
            height: 640,
            icon: path.join(__dirname, '../renderer/assets/exam_icon.png'), // ✅ 图标路径
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                nodeIntegration: false
            }
        })
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
    } else {
        win.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    win.webContents.openDevTools();

})

