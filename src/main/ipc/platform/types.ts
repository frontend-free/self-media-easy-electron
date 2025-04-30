enum EnumPlatform {
  TIKTOK = 'TIKTOK'
}

interface PlatformAuthResult {
  success: boolean
  data?: {
    platform: EnumPlatform
    platformName?: string
    platformAvatar?: string
    platformId?: string
    authInfo?: string
    logs?: string[]
  }
  message?: string
}

interface PlatformPublishParams {
  platform: EnumPlatform
  authInfo: string
  resourceOfVideo: string
}

enum EnumPlatformPublishCode {
  ERROR_AUTH_INFO_INVALID = 'ERROR_AUTH_INFO_INVALID'
}

interface PlatformPublishResult {
  success: boolean
  data?: {
    platform: EnumPlatform
    code: EnumPlatformPublishCode
    logs?: string[]
  }
  message?: string
}

interface ShowOpenDialogOfOpenFileResult {
  success: boolean
  data?: {
    filePaths: string[]
  }
  message?: string
}

export type {
  PlatformAuthResult,
  ShowOpenDialogOfOpenFileResult,
  PlatformPublishParams,
  PlatformPublishResult
}
export { EnumPlatform, EnumPlatformPublishCode }
