enum EnumPlatform {
  TIKTOK = 'tiktok'
}

interface PlatformResult {
  success: boolean
  data: {
    platform: EnumPlatform
    platformName?: string
    platformAvatar?: string
    platformId?: string
    authInfo?: string
    logs?: string[]
  }
  message?: string
}

export type { PlatformResult }
export { EnumPlatform }
