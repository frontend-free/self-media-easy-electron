import { app, dialog, ipcMain } from 'electron';
import fse from 'fs-extra';
import { chromium } from 'playwright-core';
import { installBrowsersForNpmInstall } from 'playwright-core/lib/server';
import { authTiktok } from './platform/tiktok/auth';
import { authCheckTiktok } from './platform/tiktok/auth_check';
import { publishTiktok } from './platform/tiktok/publish';
import {
  EnumPlatform,
  PlatformAuthCheckParams,
  PlatformAuthCheckResult,
  PlatformAuthResult,
  PlatformPublishParams,
  PlatformPublishResult,
  ShowOpenDialogOfOpenFileResult,
} from './platform/types';

function handlePing(): string {
  return 'pong';
}

async function handlePlatformAuth(_, arg?: { platform: string }): Promise<PlatformAuthResult> {
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
      return await authTiktok();
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
        extensions: ['mp4', 'avi', 'mkv'],
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
  // test
  ipcMain.handle('ping', handlePing);

  // 获取版本号
  ipcMain.handle('getVersion', handleGetVersion);

  ipcMain.handle('platformAuth', handlePlatformAuth);
  ipcMain.handle('platformAuthCheck', handlePlatformAuthCheck);
  ipcMain.handle('platformPublish', handlePlatformPublish);

  ipcMain.handle('showOpenDialogOfOpenFile', handleShowOpenDialogOfOpenFile);

  ipcMain.handle('checkPlaywrightBrowser', handleCheckPlaywrightBrowser);
  ipcMain.handle('installPlaywrightBrowser', handleInstallPlaywrightBrowser);
}

export { initIpc };
