import { chromium } from 'playwright'
import { EnumPlatform, type PlatformResult } from '../types'
import { runTask } from '../helper'

const HOME = 'https://creator.douyin.com/creator-micro/home'

async function authTiktok(): Promise<PlatformResult> {
  const data: Partial<PlatformResult['data']> = {
    platform: EnumPlatform.TIKTOK,
    platformName: undefined,
    platformAvatar: undefined,
    platformId: undefined,
    authInfo: undefined
  }

  // 显示浏览器窗口
  const browser = await chromium.launch({
    headless: false
  })

  // 创建一个干净的上下文
  const context = await browser.newContext()
  // 创建页面
  const page = await context.newPage()

  try {
    await runTask({
      name: '打开抖音创作者平台登录页面',
      task: async () => {
        // 未登录会调整到扫码页面 creator.douyin.com
        await page.goto(HOME)
      }
    })

    await runTask({
      name: '等待用户抖音扫码授权',
      task: async () => {
        // 重新进入个人首页，代表已经登录了。
        await page.waitForURL(HOME, {
          // 5分钟超时
          timeout: 5 * 60 * 1000
        })
      }
    })

    await runTask({
      name: '获取授权信息 cookies',
      task: async () => {
        // 获取所有 cookies
        const cookies = await context.cookies()

        // 保存 cookies
        data.authInfo = JSON.stringify(cookies)

        console.log('授权信息 cookies', data.authInfo)
      }
    })

    await runTask({
      name: '获取用户信息',
      task: async () => {
        // 等待页面加载完成
        await page.waitForTimeout(1000)

        // 获取名字
        const nameElement = await page.waitForSelector('[class^="header-"] [class^="name-"]', {
          timeout: 500
        })
        if (nameElement) {
          const name = await nameElement.textContent()
          data.platformName = name ?? undefined
        }

        // 获取平台ID
        const platformIdElement = await page.waitForSelector('[class^="unique_id-"]', {
          timeout: 500
        })
        if (platformIdElement) {
          const platformId = await platformIdElement.textContent()
          data.platformId = platformId ?? undefined
        }

        // TODO 获取头像

        console.log('用户信息', data)
      }
    })

    await runTask({
      name: '关闭浏览器',
      task: async () => {
        await browser.close()
      }
    })

    return {
      success: true,
      data: data as PlatformResult['data'],
      message: '授权成功'
    }
  } catch (error) {
    // 关闭弹窗
    await browser.close()

    console.error('授权过程发生错误:', error)

    return {
      success: false,
      data: undefined,
      message: `授权过程发生错误: ${error}`
    }
  }
}

export { authTiktok }
