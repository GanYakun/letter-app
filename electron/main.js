import { app, BrowserWindow, Menu, shell, globalShortcut } from 'electron'
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'
import { dirname } from 'path'

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

// 创建人像注册文件
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

//保存注册头像的图片
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

//下载Excel文件
ipcMain.handle('download-excel-file', async (event, filePath) => {
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

app.whenReady().then(() => {
    ensureUserConfig();
    //创建窗口
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
    //移除窗口菜单
    win.removeMenu();
    //加载执行文件
    win.loadFile(path.join(__dirname, '../mini-app/camera-capture.html'));
})

