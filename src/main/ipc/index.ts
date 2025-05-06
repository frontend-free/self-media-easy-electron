import { ipcMain, dialog, app } from 'electron'

import { authTiktok } from './platform/tiktok/auth'
import { publishTiktok } from './platform/tiktok/publish'
import {
  EnumPlatform,
  PlatformAuthResult,
  PlatformPublishParams,
  PlatformPublishResult,
  ShowOpenDialogOfOpenFileResult
} from './platform/types'

function handlePing(): string {
  return 'pong'
}

async function handlePlatformAuth(_, arg?: { platform: string }): Promise<PlatformAuthResult> {
  console.log('handlePlatformAuth', arg)

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
        message: `平台不支持 ${platform}`
      }
  }
}

async function handlePlatformPublish(
  _,
  arg?: PlatformPublishParams
): Promise<PlatformPublishResult> {
  console.log('handlePlatformPublish', arg)

  if (!arg || !arg.platform || !arg.authInfo || !arg.resourceOfVideo) {
    return {
      success: false,
      message: '参数错误，请检查'
    }
  }

  const { platform } = arg

  switch (platform) {
    case EnumPlatform.TIKTOK:
      return await publishTiktok(arg)
    default:
      return {
        success: false,
        message: `平台不支持 ${platform}`
      }
  }
}

async function handleShowOpenDialogOfOpenFile(): Promise<ShowOpenDialogOfOpenFileResult> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: '视频',
        extensions: ['mp4', 'avi', 'mkv']
      }
    ]
  })

  return {
    success: true,
    data: {
      filePaths: result.filePaths || []
    }
  }
}

function handleGetVersion(): string {
  return app.getVersion()
}

function initIpc(): void {
  // test
  ipcMain.handle('ping', handlePing)

  // 获取版本号
  ipcMain.handle('getVersion', handleGetVersion)

  ipcMain.handle('platformAuth', handlePlatformAuth)

  ipcMain.handle('platformPublish', handlePlatformPublish)

  ipcMain.handle('showOpenDialogOfOpenFile', handleShowOpenDialogOfOpenFile)
}

export { initIpc }
