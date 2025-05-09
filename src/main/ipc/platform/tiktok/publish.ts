import { chromium } from 'playwright';
import { runTask } from '../helper';
import {
  EnumPlatform,
  EnumPlatformPublishCode,
  PlatformPublishParams,
  PlatformPublishResult,
} from '../types';

async function publishTiktok(params: PlatformPublishParams): Promise<PlatformPublishResult> {
  const { resourceOfVideo, authInfo } = params;

  const data: Partial<PlatformPublishResult['data']> = {
    platform: EnumPlatform.TIKTOK,
    logs: [],
  };

  const browser = await chromium.launch({
    headless: process.env.NODE_ENV === 'production' ? true : false, // 显示浏览器窗口
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
        await page.waitForTimeout(1000);

        // 等待结果
        await Promise.race([
          // 如果还在当前页，则认为登录
          page.waitForURL('https://creator.douyin.com/creator-micro/content/upload'),
          // 如果跳转到了登录页，则认为授权信息失效
          page.waitForURL('https://creator.douyin.com/').then(() => {
            throw new Error(EnumPlatformPublishCode.ERROR_AUTH_INFO_INVALID);
          }),
        ]);
      },
    });

    // console.log('等待页面加载完成')
    // await page.waitForLoadState('load')
    // console.log('页面加载完成')

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
        await page.fill('input[class^="semi-input"]', params.title || '');
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

    await runTask({
      name: '关闭浏览器',
      logs: data.logs,
      task: async () => {
        await browser.close();
      },
    });

    return {
      success: true,
      data: data as PlatformPublishResult['data'],
      message: '发布成功',
    };
  } catch (error) {
    await browser.close();

    const message = `发布视频过程中发生错误: ${error}`;
    data.logs?.push(message);

    // 暂时这么处理
    if (`${error}`.includes(EnumPlatformPublishCode.ERROR_AUTH_INFO_INVALID)) {
      data.code = EnumPlatformPublishCode.ERROR_AUTH_INFO_INVALID;
    }

    return {
      success: false,
      data: data as PlatformPublishResult['data'],
      message,
    };
  }
}

export { publishTiktok };
