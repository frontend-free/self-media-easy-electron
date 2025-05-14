import { chromium } from 'playwright';
import { runTask } from '../helper';
import { EnumCode, EnumPlatform, PlatformPublishParams, PlatformPublishResult } from '../types';

async function publishTiktok(params: PlatformPublishParams): Promise<PlatformPublishResult> {
  const { title, resourceOfVideo, authInfo, isDebug } = params;

  const data: Partial<PlatformPublishResult['data']> = {
    platform: EnumPlatform.TIKTOK,
    logs: [],
  };

  const browser = await chromium.launch({
    headless: false,
  });

  try {
    // 创建一个干净的上下文
    const context = await browser.newContext();

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
            data.logs?.push('授权信息有效');
          }),
          // 如果跳转到了登录页，则认为授权信息失效
          page.waitForURL('https://creator.douyin.com/').then(() => {
            data.logs?.push('授权信息失效');
            throw new Error(EnumCode.ERROR_AUTH_INFO_INVALID);
          }),
        ]);
      },
    });

    let uploadButton;

    await runTask({
      name: '等待上传按钮出现',
      logs: data.logs,
      task: async () => {
        // 等待上传按钮出现
        const uploadContainer = await page.waitForSelector('[class^="container-drag-"]');
        // 获取隐藏的input元素
        uploadButton = await uploadContainer.$('input');
      },
    });

    await runTask({
      name: '上传视频文件',
      logs: data.logs,
      task: async () => {
        await uploadButton!.setInputFiles(resourceOfVideo);
      },
    });

    await runTask({
      name: '等待视频上传完成',
      logs: data.logs,
      task: async () => {
        await page.waitForTimeout(1000);
        await page.waitForSelector('[class^="player-video-"]', {
          // 涉及上传，可能需要较长时间
          timeout: 10 * 60 * 1000,
        });
      },
    });

    await runTask({
      name: '填写标题',
      logs: data.logs,
      task: async () => {
        await page.fill('input[class^="semi-input"]', title || '');
      },
    });

    await runTask({
      name: '点击发布按钮',
      logs: data.logs,
      task: async () => {
        await page.waitForTimeout(500);
        await page.click('button:text("发布")');
      },
    });

    await runTask({
      name: '等待发布完成',
      logs: data.logs,
      task: async () => {
        await page.waitForURL(
          'https://creator.douyin.com/creator-micro/content/manage?enter_from=publish',
        );
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
      data: data as PlatformPublishResult['data'],
      message: '发布成功',
    };
  } catch (error) {
    console.error(error);

    if (!isDebug) {
      // 关闭弹窗
      await browser.close();
    }

    let message = `发布视频过程中发生错误: ${error}`;

    // 授权失效
    if (`${error}`.includes(EnumCode.ERROR_AUTH_INFO_INVALID)) {
      message = '授权信息无效';
      data.code = EnumCode.ERROR_AUTH_INFO_INVALID;
    }

    // 浏览器被关闭
    if (`${error}`.includes('closed')) {
      message = '浏览器被关闭';
      data.code = EnumCode.ERROR_CLOSED;
    }

    data.logs?.push(message);

    return {
      success: false,
      data: data as PlatformPublishResult['data'],
      message,
    };
  }
}

export { publishTiktok };
