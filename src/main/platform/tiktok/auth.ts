import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

/**
 * 抖音授权
 * 1. 使用 playwright打开抖音创作者页面
 * 2. 用户扫码
 * 3. 授权成功后获得 cookie，并保存。
 * 4. 关闭页面
 */
async function authTiktok(): Promise<boolean> {
  const browser = await chromium.launch({
    headless: false // 显示浏览器窗口
  })

  try {
    const context = await browser.newContext()
    const page = await context.newPage()

    // 打开抖音创作者平台登录页面
    await page.goto('https://creator.douyin.com/creator-micro/home')

    // 等待用户扫码登录
    console.log('请使用抖音APP扫码登录...')

    // 等待登录成功，通过检查页面URL或特定元素来判断
    await page.waitForURL('https://creator.douyin.com/creator-micro/home', {
      timeout: 300000 // 5分钟超时
    })

    // 获取所有cookies
    const cookies = await context.cookies()

    // 保存cookies到文件
    const cookiePath = path.join(__dirname, '../../data/cookies.json')
    fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2))

    console.log('授权成功，cookies已保存')

    // 关闭浏览器
    await browser.close()

    return true
  } catch (error) {
    console.error('授权过程中发生错误:', error)
    await browser.close()
    return false
  }
}

export { authTiktok }
