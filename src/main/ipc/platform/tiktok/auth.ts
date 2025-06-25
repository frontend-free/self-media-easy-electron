import { chromium } from 'playwright';
import { getRecordVideoDir, log, runTask } from '../helper';
import { EnumCode, EnumPlatform, PlatformAuthParams, type PlatformAuthResult } from '../types';

async function authTiktok(params: PlatformAuthParams): Promise<PlatformAuthResult> {
  const { isDebug } = params;

  const data: Partial<PlatformAuthResult> = {
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
    channel: 'chrome',
  });

  try {
    // 创建一个干净的上下文
    const context = await browser.newContext({
      recordVideo: {
        dir: getRecordVideoDir(),
      },
    });
    // 创建页面
    const page = await context.newPage();

    await runTask({
      name: '打开登录页面',
      task: async () => {
        await page.goto('https://creator.douyin.com/');
      },
      logs: data.logs,
    });

    await runTask({
      name: '等待用户扫码授权',
      logs: data.logs,
      task: async () => {
        // 登录进入首页
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

        log('授权信息 cookies', data.logs);
      },
    });

    await runTask({
      name: '获取用户信息',
      logs: data.logs,
      task: async () => {
        // 获取名字
        const name = page.locator('[class^="header-"] [class^="name-"]');
        await name.waitFor({
          state: 'visible',
        });
        const nameText = await name.textContent();
        data.platformName = nameText ?? undefined;
        log(`获取到 name: ${nameText}`, data.logs);

        // 获取平台ID
        const platformId = page.locator('[class^="unique_id-"]');
        await platformId.waitFor({
          state: 'visible',
        });
        const platformIdText = await platformId.textContent();
        data.platformId = platformIdText ? platformIdText.match(/\d+/)?.[0] : undefined;
        log(`获取到 platformId: ${data.platformId}`, data.logs);

        log(`用户信息: ${JSON.stringify(data)}`, data.logs);
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

    return data as PlatformAuthResult;
  } catch (error) {
    console.error(error);

    if (!isDebug) {
      // 关闭弹窗
      await browser.close();
    }

    let message = `授权过程发生错误: ${error}`;

    // 浏览器被关闭
    if (`${error}`.includes('closed')) {
      message = '浏览器被关闭';
      data.code = EnumCode.ERROR_CLOSED;
    }

    log(message, data.logs);

    const err = new Error(message);
    // @ts-ignore 添加 details 属性
    err.details = data;

    throw err;
  }
}

export { authTiktok };
