import { ipcMain } from 'electron'

import { authTiktok } from './platform/tiktok/auth'
import { publishTiktok } from './platform/tiktok/publish'

function initIpc(): void {
  ipcMain.on('tiktok:auth', async () => {
    return authTiktok()
  })

  ipcMain.on('tiktok:publish', async () => {
    return publishTiktok()
  })
}

export { initIpc }
