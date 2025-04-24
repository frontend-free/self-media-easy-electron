import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

/**
 * 发布视频
 * 1 使用 playwright 打开抖音创作者页面
 * 2 点击发布视频
 * 3 选择视频
 * 4 填写视频描述
 * 5 发布视频
 */
async function publishTiktok(): Promise<boolean> {
  const videoPath = path.join(__dirname, '../../test/test.mp4')

  const browser = await chromium.launch({
    headless: false // 显示浏览器窗口
  })

  try {
    const context = await browser.newContext()

    // 加载已保存的cookies
    const cookiePath = path.join(__dirname, '../../data/cookies.json')
    if (fs.existsSync(cookiePath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'))
      await context.addCookies(cookies)
    } else {
      throw new Error('未找到cookies文件，请先进行授权登录')
    }

    const page = await context.newPage()

    console.log('打开抖音创作者平台上传页面')
    await page.goto('https://creator.douyin.com/creator-micro/content/upload')
    await page.waitForURL('https://creator.douyin.com/creator-micro/content/upload')
    console.log('打开抖音创作者平台上传页面成功')

    console.log('等待页面加载完成')
    await page.waitForLoadState('load')
    console.log('页面加载完成')

    // console.log("点击发布视频按钮");
    // await page.click("text=发布视频");

    console.log('等待上传按钮出现')
    // const uploadButton = await page.waitForSelector('input[type="file"]');
    // 由于input可能是display:none，直接定位到父元素
    const uploadContainer = await page.waitForSelector('.container-drag-AOMYqU')
    // 获取隐藏的input元素
    const uploadButton = await uploadContainer.$('input')
    console.log('上传按钮出现')

    console.log('上传视频文件')
    await uploadButton!.setInputFiles(videoPath)
    console.log('上传视频文件成功')

    await page.waitForTimeout(1000)

    console.log('等待视频上传完成')
    await page.waitForSelector('.player-video-IUf4CW')
    console.log('视频上传完成')

    await page.waitForTimeout(1000)

    console.log('点击发布按钮')
    await page.click('button:text("发布")')
    console.log('点击发布按钮成功')

    await page.waitForTimeout(1000)

    console.log('等待发布完成')
    await page.waitForURL(
      'https://creator.douyin.com/creator-micro/content/manage?enter_from=publish'
    )
    console.log('发布完成')

    // 关闭浏览器;
    await browser.close()

    return true
  } catch (error) {
    console.error('发布视频过程中发生错误:', error)
    await browser.close()
    return false
  }
}

export { publishTiktok }
