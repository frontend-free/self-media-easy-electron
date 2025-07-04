enum EnumPlatform {
  TIKTOK = 'TIKTOK',
  WEIXIN_VIDEO = 'WEIXIN_VIDEO',
}

enum EnumPublishType {
  // 正式
  OFFICIAL = 'OFFICIAL',
  // 草稿
  DRAFT = 'DRAFT',
}

enum EnumCode {
  /** 浏览器被关闭了 */
  ERROR_CLOSED = 'ERROR_CLOSED',
  /** 授权信息无效 */
  ERROR_AUTH_INFO_INVALID = 'ERROR_AUTH_INFO_INVALID',
}

interface PlatformAuthParams {
  platform: EnumPlatform;
  h5AuthId?: string;
  isDebug?: boolean;
}

interface PlatformAuthResult {
  code: EnumCode;
  platform: EnumPlatform;
  platformName?: string;
  platformAvatar?: string;
  platformId?: string;
  authInfo?: string;
  logs?: string[];
}

interface PlatformAuthCheckParams {
  platform: EnumPlatform;
  authInfo: string;
  isDebug?: boolean;
}
interface PlatformAuthCheckResult {
  code: EnumCode;
  platform: EnumPlatform;
  logs?: string[];
}

interface PlatformPublishParams {
  platform: EnumPlatform;
  authInfo: string;
  resourceOfVideo: string;
  title?: string;
  description?: string;
  publishType?: EnumPublishType;
  isDebug?: boolean;
}

interface PlatformPublishResult {
  code: EnumCode;
  platform: EnumPlatform;
  logs?: string[];
}

export { EnumCode, EnumPlatform };
export type {
  PlatformAuthCheckParams,
  PlatformAuthCheckResult,
  PlatformAuthParams,
  PlatformAuthResult,
  PlatformPublishParams,
  PlatformPublishResult,
};
