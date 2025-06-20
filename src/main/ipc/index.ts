import { app, dialog, ipcMain } from 'electron';
import fse from 'fs-extra';
import path from 'path';
import { chromium } from 'playwright-core';
import { installBrowsersForNpmInstall } from 'playwright-core/lib/server';
import { ipcMainApiOfRecorder } from './ipc_record';
import { authTiktok } from './platform/tiktok/auth';
import { authCheckTiktok } from './platform/tiktok/auth_check';
import { publishTiktok } from './platform/tiktok/publish';
import {
  EnumPlatform,
  GetDirectoryVideoFilesParams,
  GetDirectoryVideoFilesResult,
  PlatformAuthCheckParams,
  PlatformAuthCheckResult,
  PlatformAuthParams,
  PlatformAuthResult,
  PlatformPublishParams,
  PlatformPublishResult,
  ShowOpenDialogOfOpenDirectoryResult,
  ShowOpenDialogOfOpenFileResult,
} from './platform/types';
import { authWeixinVideo } from './platform/weixin_video/auth';
import { authCheckWeixinVideo } from './platform/weixin_video/auth_check';
import { publishWeixinVideo } from './platform/weixin_video/publish';

const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mkv'];

function handlePing(): string {
  return 'pong';
}

async function handlePlatformAuth(_, arg?: PlatformAuthParams): Promise<PlatformAuthResult> {
  console.log('handlePlatformAuth', arg);

  if (!arg || !arg.platform) {
    return {
      success: false,
      message: '参数错误，请检查',
    };
  }

  const { platform } = arg;

  switch (platform) {
    case EnumPlatform.TIKTOK:
      return await authTiktok(arg);
    case EnumPlatform.WEIXIN_VIDEO:
      return await authWeixinVideo(arg);
    default:
      return {
        success: false,
        message: `平台不支持 ${platform}`,
      };
  }
}

async function handlePlatformAuthCheck(
  _,
  arg?: PlatformAuthCheckParams,
): Promise<PlatformAuthCheckResult> {
  console.log('handlePlatformAuthCheck', arg);

  if (!arg || !arg.platform || !arg.authInfo) {
    return {
      success: false,
      message: '参数错误，请检查',
    };
  }

  const { platform } = arg;

  switch (platform) {
    case EnumPlatform.TIKTOK:
      return await authCheckTiktok(arg);
    case EnumPlatform.WEIXIN_VIDEO:
      return await authCheckWeixinVideo(arg);
    default:
      return {
        success: false,
        message: `平台不支持 ${platform}`,
      };
  }
}

async function handlePlatformPublish(
  _,
  arg?: PlatformPublishParams,
): Promise<PlatformPublishResult> {
  console.log('handlePlatformPublish', arg);

  if (!arg || !arg.platform || !arg.authInfo || !arg.resourceOfVideo) {
    return {
      success: false,
      message: '参数错误，请检查',
    };
  }

  const { platform } = arg;

  switch (platform) {
    case EnumPlatform.TIKTOK:
      return await publishTiktok(arg);
    case EnumPlatform.WEIXIN_VIDEO:
      return await publishWeixinVideo(arg);
    default:
      return {
        success: false,
        message: `平台不支持 ${platform}`,
      };
  }
}

async function handleShowOpenDialogOfOpenFile(): Promise<ShowOpenDialogOfOpenFileResult> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: '视频',
        extensions: VIDEO_EXTENSIONS,
      },
    ],
  });

  return {
    success: true,
    data: {
      filePaths: result.filePaths || [],
    },
  };
}

async function handleShowOpenDialogOfOpenDirectory(): Promise<ShowOpenDialogOfOpenDirectoryResult> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  return {
    success: true,
    data: {
      filePaths: result.filePaths || [],
    },
  };
}

async function handleGetDirectoryVideoFiles(
  _,
  arg?: GetDirectoryVideoFilesParams,
): Promise<GetDirectoryVideoFilesResult> {
  console.log('handleGetDirectoryVideoFiles', arg);

  if (!arg || !arg.directory) {
    return {
      success: false,
      message: '参数错误，请检查',
    };
  }

  const { directory, lastRunAt } = arg;

  const files = await fse.readdir(directory);

  const newFiles = files.filter((file) => {
    const stat = fse.statSync(path.join(directory, file));
    return (
      stat.isFile() &&
      VIDEO_EXTENSIONS.includes(file.split('.').pop() || '') &&
      // 过滤 创建时间 > lastRunAt 的文件
      stat.birthtime.getTime() > (lastRunAt || 0)
    );
  });

  const filePaths = newFiles.map((file) => path.join(directory, file));

  console.log('filePaths', filePaths);

  return {
    success: true,
    data: {
      filePaths,
    },
  };
}

function handleGetVersion(): string {
  return app.getVersion();
}

async function handleCheckPlaywrightBrowser(): Promise<void> {
  const res = chromium.executablePath();

  // 检查 res 路径是否存在
  if (res) {
    if (fse.existsSync(res)) {
      return;
    }
  }

  throw new Error('Playwright Chromium 没有安装');
}

async function handleInstallPlaywrightBrowser(): Promise<void> {
  // 使用 Playwright 的 API 安装浏览器
  await installBrowsersForNpmInstall(['chromium', 'chromium-headless-shell', 'ffmpeg']);

  console.log('Playwright Chromium 安装成功');
}

function initIpc(): void {
  ipcMain.handle('ping', handlePing);

  // 获取版本号
  ipcMain.handle('getVersion', handleGetVersion);

  ipcMain.handle('platformAuth', handlePlatformAuth);
  ipcMain.handle('platformAuthCheck', handlePlatformAuthCheck);
  ipcMain.handle('platformPublish', handlePlatformPublish);

  ipcMain.handle('showOpenDialogOfOpenFile', handleShowOpenDialogOfOpenFile);
  ipcMain.handle('showOpenDialogOfOpenDirectory', handleShowOpenDialogOfOpenDirectory);

  ipcMain.handle('checkPlaywrightBrowser', handleCheckPlaywrightBrowser);
  ipcMain.handle('installPlaywrightBrowser', handleInstallPlaywrightBrowser);

  ipcMain.handle('getDirectoryVideoFiles', handleGetDirectoryVideoFiles);

  const ipcMainApi = {
    // record 相关
    ...ipcMainApiOfRecorder,
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
        };

        console.log(key, 'res', res);

        return res;
      } catch (err) {
        console.error(key, 'err', err);

        return {
          success: false,
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
