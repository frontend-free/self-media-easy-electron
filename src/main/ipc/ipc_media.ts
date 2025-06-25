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

async function platformAuth(_, arg: PlatformAuthParams): Promise<PlatformAuthResult> {
  const { platform } = arg;

  switch (platform) {
    case EnumPlatform.TIKTOK:
      return await authTiktok(arg);
    case EnumPlatform.WEIXIN_VIDEO:
      return await authWeixinVideo(arg);
    default:
      throw new Error(`平台不支持 ${platform}`);
  }
}

async function platformAuthCheck(
  _,
  arg: PlatformAuthCheckParams,
): Promise<PlatformAuthCheckResult> {
  const { platform } = arg;

  switch (platform) {
    case EnumPlatform.TIKTOK:
      return await authCheckTiktok(arg);
    case EnumPlatform.WEIXIN_VIDEO:
      return await authCheckWeixinVideo(arg);
    default:
      throw new Error(`平台不支持 ${platform}`);
  }
}

async function platformPublish(_, arg: PlatformPublishParams): Promise<PlatformPublishResult> {
  const { platform } = arg;

  switch (platform) {
    case EnumPlatform.TIKTOK:
      return await publishTiktok(arg);
    case EnumPlatform.WEIXIN_VIDEO:
      return await publishWeixinVideo(arg);
    default:
      throw new Error(`平台不支持 ${platform}`);
  }
}

const ipcMainApiOfMedia = {
  platformAuth,
  platformAuthCheck,
  platformPublish,
};

export { ipcMainApiOfMedia };
