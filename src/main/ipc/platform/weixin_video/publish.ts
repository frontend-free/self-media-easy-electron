import { chromium } from 'playwright';
import { log, runTask } from '../helper';
import { EnumCode, EnumPlatform, PlatformPublishParams, PlatformPublishResult } from '../types';

async function publishWeixinVideo(params: PlatformPublishParams): Promise<PlatformPublishResult> {
  const { title, resourceOfVideo: originalResourceOfVideo, authInfo, isDebug } = params;

  const data: Partial<PlatformPublishResult> = {
    platform: EnumPlatform.WEIXIN_VIDEO,
    logs: [],
  };

  const resourceOfVideo = originalResourceOfVideo;

  let browser;

  try {
    browser = await chromium.launch({
      // 特殊处理，true 就跑不通。
      headless: false,
      // 视频号需要使用 chrome，否则无法识别视频。 更多见 https://sap-doc.nasdaddy.com/docs/tutorial-basics/platform-channels/
      channel: 'chrome',
    });

    // 创建一个干净的上下文
    const context = await browser.newContext({
      // recordVideo: {
      //   dir: getRecordVideoDir(),
      // },
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
      name: '打开视频号助手上传页面',
      logs: data.logs,
      task: async () => {
        await page.goto('https://channels.weixin.qq.com/platform/post/create');
      },
    });

    await runTask({
      name: '确认授权信息是否有效',
      logs: data.logs,
      task: async () => {
        // 等待页面
        await page.waitForTimeout(2000);

        // 等待结果
        await Promise.race([
          // 如果还在当前页，则认为登录
          page.waitForURL('https://channels.weixin.qq.com/platform/post/create').then(() => {
            log('授权信息有效', data.logs);
          }),
          // 如果跳转到了登录页，则认为授权信息失效
          page.waitForURL('https://channels.weixin.qq.com/login.html').then(() => {
            log('授权信息失效', data.logs);
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
        uploadButton = page.locator('input[type="file"]');
        await uploadButton.waitFor({
          state: 'hidden',
        });
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
        const video = page.locator('#fullScreenVideo');
        await video.waitFor({
          state: 'visible',
          timeout: 10 * 60 * 1000,
        });
      },
    });

    await runTask({
      name: '填写标题',
      logs: data.logs,
      task: async () => {
        const titleInput = page.locator('.short-title-wrap input');
        await titleInput.fill(title || '');
      },
    });

    await runTask({
      name: '点击发布按钮',
      logs: data.logs,
      task: async () => {
        // 需要等待一下，等表单处理好
        await page.waitForTimeout(2000);

        const publishButton = page.locator('button.weui-desktop-btn_primary:text-is("发表")');
        await publishButton.waitFor({
          state: 'visible',
        });
        await publishButton.click();
      },
    });

    await runTask({
      name: '等待发布完成',
      logs: data.logs,
      task: async () => {
        await page.waitForURL('https://channels.weixin.qq.com/platform/post/list');
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

    return data as PlatformPublishResult;
  } catch (error) {
    console.error(error);

    if (!isDebug) {
      // 关闭弹窗
      await browser?.close();
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

    log(message, data.logs);

    const err = new Error(message);
    // @ts-ignore 添加 details 属性
    err.details = data;

    throw err;
  }
}

export { publishWeixinVideo };
