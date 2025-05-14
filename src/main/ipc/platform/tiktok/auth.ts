import { chromium } from 'playwright';
import { runTask } from '../helper';
import { EnumCode, EnumPlatform, PlatformAuthParams, type PlatformAuthResult } from '../types';

async function authTiktok(params: PlatformAuthParams): Promise<PlatformAuthResult> {
  const { isDebug } = params;

  const data: Partial<PlatformAuthResult['data']> = {
    platform: EnumPlatform.TIKTOK,
    platformName: undefined,
    platformAvatar: undefined,
    platformId: undefined,
    authInfo: undefined,
    logs: [],
  };

  // 显示浏览器窗口
  const browser = await chromium.launch({
    headless: false,
  });

  try {
    // 创建一个干净的上下文
    const context = await browser.newContext();
    // 创建页面
    const page = await context.newPage();

    await runTask({
      name: '打开抖音创作者平台登录页面',
      task: async () => {
        // 未登录会调整到扫码页面 creator.douyin.com
        await page.goto('https://creator.douyin.com/creator-micro/home');
      },
      logs: data.logs,
    });

    await runTask({
      name: '等待用户抖音扫码授权',
      logs: data.logs,
      task: async () => {
        // 重新进入个人首页，代表已经登录了。
        await page.waitForURL('https://creator.douyin.com/creator-micro/home', {
          // 5分钟超时
          timeout: 5 * 60 * 1000,
        });
      },
    });

    await runTask({
      name: '获取授权信息 cookies',
      logs: data.logs,
      task: async () => {
        // 获取所有 cookies
        const cookies = await context.cookies();

        // 保存 cookies
        data.authInfo = JSON.stringify(cookies);

        data.logs?.push('授权信息 cookies', data.authInfo);
      },
    });

    await runTask({
      name: '获取用户信息',
      logs: data.logs,
      task: async () => {
        // 等待页面加载完成
        await page.waitForTimeout(2000);

        // 获取名字
        const nameElement = await page.waitForSelector('[class^="header-"] [class^="name-"]', {
          timeout: 5000,
        });

        if (nameElement) {
          data.logs?.push('获取到 nameElement');
          const name = await nameElement.textContent();
          data.platformName = name ?? undefined;
          data.logs?.push(`获取到 name: ${name}`);
        }

        // 获取平台ID
        const platformIdElement = await page.waitForSelector('[class^="unique_id-"]', {
          timeout: 5000,
        });
        if (platformIdElement) {
          data.logs?.push('获取到 platformIdElement');
          const platformId = await platformIdElement.textContent();
          data.platformId = platformId ? platformId.match(/\d+/)?.[0] : undefined;
          data.logs?.push(`获取到 platformId: ${data.platformId}`);
        }

        // TODO 获取头像

        data.logs?.push('用户信息', JSON.stringify(data));
      },
    });

    if (!isDebug) {
      await runTask({
        name: '关闭浏览器',
        logs: data.logs,
        task: async () => {
          await browser.close();
        },
      });
    }

    return {
      success: true,
      data: data as PlatformAuthResult['data'],
      message: '授权成功',
    };
  } catch (error) {
    console.error(error);

    if (!isDebug) {
      // 关闭弹窗
      await browser.close();
    }

    // 浏览器被关闭
    if (`${error}`.includes(EnumCode.ERROR_CLOSED)) {
      data.code = EnumCode.ERROR_CLOSED;
    }

    data.logs?.push(`授权过程发生错误: ${error}`);

    return {
      success: false,
      data: data as PlatformAuthResult['data'],
      message: `授权过程发生错误: ${error}`,
    };
  }
}

export { authTiktok };
