import { ipcMain } from 'electron'

import { authTiktok } from './platform/tiktok/auth'
import { publishTiktok } from './platform/tiktok/publish'
import { EnumPlatform } from './platform/types'

function initIpc(): void {
  ipcMain.handle('ping', () => {
    console.log('pong')
    return 'pong'
  })

  ipcMain.handle('platformAuth', async (_, arg?: { platform: string }) => {
    if (!arg || !arg.platform) {
      return {
        success: false,
        message: '平台不能为空'
      }
    }

    const { platform } = arg

    switch (platform) {
      case EnumPlatform.TIKTOK:
        return await authTiktok()
      default:
        return {
          success: false,
          message: '平台不支持'
        }
    }
  })

  ipcMain.handle('platformPublish', async (_, arg?: { platform: string }) => {
    if (!arg || !arg.platform) {
      return {
        success: false,
        message: '平台不能为空'
      }
    }

    const { platform } = arg

    switch (platform) {
      case EnumPlatform.TIKTOK:
        return await publishTiktok()
      default:
        return {
          success: false,
          message: '平台不支持'
        }
    }
  })
}

export { initIpc }
