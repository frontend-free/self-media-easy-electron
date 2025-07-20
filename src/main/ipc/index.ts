import { app, BrowserWindow, ipcMain } from 'electron';
import { ipcMainApiOfFfmpeg } from './ipc_ffmpeg';
import { ipcMainApiOfFile } from './ipc_file';
import { ipcMainApiOfMedia } from './ipc_media';
import { ipcMainApiOfPlaywright } from './ipc_playwright';
import { ipcMainApiOfRecorder } from './ipc_record';

function initIpc({ mainWindow }: { mainWindow: BrowserWindow }): void {
  const ipcMainApi = {
    ping: () => {
      return 'pone';
    },
    // 获取版本号
    getVersion: () => {
      return app.getVersion();
    },
    openAtLogin: (_, arg?: { open?: boolean }): void | { open: boolean } => {
      // set
      if (arg?.open !== undefined) {
        app.setLoginItemSettings({
          openAtLogin: arg.open,
        });
        return;
      }

      return {
        open: app.getLoginItemSettings().openAtLogin,
      };
    },
    minimizeWindow: () => {
      mainWindow.minimize();
    },
    closeWindow: () => {
      mainWindow.close();
    },
    // 视频发布
    ...ipcMainApiOfMedia,
    // 文件相关
    ...ipcMainApiOfFile,
    // record 相关
    ...ipcMainApiOfRecorder,
    // playwright 相关
    ...ipcMainApiOfPlaywright,
    // ffmpeg 相关
    ...ipcMainApiOfFfmpeg,
  };

  Object.keys(ipcMainApi).forEach((key) => {
    const func = ipcMainApi[key];
    ipcMainApi[key] = async (_, arg) => {
      console.log(key, 'params', arg);

      try {
        const data = await func(_, arg);
        const res = {
          success: true,
          data,
          message: '',
        };

        console.log(key, 'res', res);

        return res;
      } catch (err) {
        console.error(key, 'err', err);

        return {
          success: false,
          // @ts-ignore 添加 details 属性
          data: err.details,
          message: err instanceof Error ? err.message : '未知错误',
        };
      }
    };
  });

  Object.keys(ipcMainApi).forEach((key) => {
    ipcMain.handle(key, ipcMainApi[key]);
  });
}

export { initIpc };
