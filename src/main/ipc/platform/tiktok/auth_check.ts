import { chromium } from 'playwright';
import { log, runTask } from '../helper';
import { EnumCode, EnumPlatform, PlatformAuthCheckParams, PlatformAuthCheckResult } from '../types';

async function authCheckTiktok(params: PlatformAuthCheckParams): Promise<PlatformAuthCheckResult> {
  const { authInfo, isDebug } = params;

  const data: Partial<PlatformAuthCheckResult['data']> = {
    platform: EnumPlatform.TIKTOK,
    logs: [],
  };

  // 显示浏览器窗口
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });

  try {
    // 创建一个干净的上下文
    const context = await browser.newContext({
      recordVideo: {
        dir: 'record_video',
      },
    });

    await runTask({
      name: '加载授权信息 cookies',
      logs: data.logs,
      task: async () => {
        const cookies = JSON.parse(authInfo);
        await context.addCookies(cookies);
      },
    });

    // 创建页面
    const page = await context.newPage();

    await runTask({
      name: '打开抖音创作者平台上传页面',
      logs: data.logs,
      task: async () => {
        await page.goto('https://creator.douyin.com/creator-micro/content/upload');
      },
    });

    let success = false;

    await runTask({
      name: '确认授权信息是否有效',
      logs: data.logs,
      task: async () => {
        // 等待
        await page.waitForTimeout(2000);

        // 等待结果
        await Promise.race([
          // 如果还在当前页，则认为登录
          page.waitForURL('https://creator.douyin.com/creator-micro/content/upload').then(() => {
            success = true;
          }),
          // 如果跳转到了登录页，则认为授权信息失效
          page.waitForURL('https://creator.douyin.com/').then(() => {
            success = false;
          }),
        ]);
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
      success,
      data: data as PlatformAuthCheckResult['data'],
      message: '授权检查成功',
    };
  } catch (error) {
    console.error(error);

    if (!isDebug) {
      // 关闭弹窗
      await browser.close();
    }

    let message = `授权检查过程发生错误: ${error}`;

    // 浏览器被关闭
    if (`${error}`.includes('closed')) {
      message = '浏览器被关闭';
      data.code = EnumCode.ERROR_CLOSED;
    }

    log(message, data.logs);

    return {
      success: false,
      data: data as PlatformAuthCheckResult['data'],
      message,
    };
  }
}

export { authCheckTiktok };
