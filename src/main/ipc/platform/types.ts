enum EnumPlatform {
  TIKTOK = 'TIKTOK',
}

enum EnumPublishType {
  // 正式
  OFFICIAL = 'OFFICIAL',
  // 草稿
  DRAFT = 'DRAFT',
}

interface PlatformAuthParams {
  platform: EnumPlatform;
  isDebug?: boolean;
}

interface PlatformAuthResult {
  success: boolean;
  data?: {
    platform: EnumPlatform;
    platformName?: string;
    platformAvatar?: string;
    platformId?: string;
    authInfo?: string;
    logs?: string[];
  };
  message?: string;
}

interface PlatformAuthCheckParams {
  platform: EnumPlatform;
  authInfo: string;
  isDebug?: boolean;
}
interface PlatformAuthCheckResult {
  success: boolean;
  data?: {
    platform: EnumPlatform;
    logs?: string[];
  };
  message?: string;
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

enum EnumPlatformPublishCode {
  ERROR_AUTH_INFO_INVALID = 'ERROR_AUTH_INFO_INVALID',
}

interface PlatformPublishResult {
  success: boolean;
  data?: {
    platform: EnumPlatform;
    code: EnumPlatformPublishCode;
    logs?: string[];
  };
  message?: string;
}

interface ShowOpenDialogOfOpenFileResult {
  success: boolean;
  data?: {
    filePaths: string[];
  };
  message?: string;
}

export { EnumPlatform, EnumPlatformPublishCode };
export type {
  PlatformAuthCheckParams,
  PlatformAuthCheckResult,
  PlatformAuthParams,
  PlatformAuthResult,
  PlatformPublishParams,
  PlatformPublishResult,
  ShowOpenDialogOfOpenFileResult,
};
