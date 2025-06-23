import { app, ipcMain } from 'electron';
import { ipcMainApiOfFfmpeg } from './ipc_ffmpeg';
import { ipcMainApiOfFile } from './ipc_file';
import { ipcMainApiOfPlaywright } from './ipc_playwright';
import { ipcMainApiOfRecorder } from './ipc_record';
import { authTiktok } from './platform/tiktok/auth';
import { authCheckTiktok } from './platform/tiktok/auth_check';
import { publishTiktok } from './platform/tiktok/publish';
import {
  EnumPlatform,
  PlatformAuthCheckParams,
  PlatformAuthCheckResult,
  PlatformAuthParams,
  PlatformAuthResult,
  PlatformPublishParams,
  PlatformPublishResult,
} from './platform/types';
import { authWeixinVideo } from './platform/weixin_video/auth';
import { authCheckWeixinVideo } from './platform/weixin_video/auth_check';
import { publishWeixinVideo } from './platform/weixin_video/publish';

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

function initIpc(): void {
  ipcMain.handle('ping', () => {
    return 'pong';
  });

  // 获取版本号
  ipcMain.handle('getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('platformAuth', handlePlatformAuth);
  ipcMain.handle('platformAuthCheck', handlePlatformAuthCheck);
  ipcMain.handle('platformPublish', handlePlatformPublish);

  const ipcMainApi = {
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
