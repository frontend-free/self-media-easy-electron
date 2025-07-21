import { chromium } from 'playwright';
import { log, processVideoStick, runTask } from '../helper';
import { EnumCode, EnumPlatform, PlatformPublishParams, PlatformPublishResult } from '../types';

async function publishTiktok(params: PlatformPublishParams): Promise<PlatformPublishResult> {
  const { title, resourceOfVideo: originalResourceOfVideo, adText, authInfo, isDebug } = params;

  const data: Partial<PlatformPublishResult> = {
    platform: EnumPlatform.TIKTOK,
    logs: [],
  };

  let resourceOfVideo = originalResourceOfVideo;

  if (adText) {
    await runTask({
      name: '处理文案',
      logs: data.logs,
      task: async () => {
        log(`文案: ${adText}`, data.logs);
        resourceOfVideo = await processVideoStick({
          input: resourceOfVideo,
          adText,
        });
      },
    });
  }

  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
  });

  try {
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
          // 如果存在此按钮，则认为登录
          page
            .locator('#douyin-creator-master-side-upload')
            .waitFor({
              state: 'visible',
            })
            .then(() => {
              log('授权信息有效', data.logs);
            }),
          // 如果存在登录框，则认为授权信息失效
          page
            .locator('#douyin-login-new-id')
            .waitFor({
              state: 'visible',
            })
            .then(() => {
              log('授权信息失效', data.logs);
              throw new Error(EnumCode.ERROR_AUTH_INFO_INVALID);
            }),
          // 如果跳转到了登录页，则认为授权信息失效
          page.waitForURL('https://creator.douyin.com/').then(() => {
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
        // 等待上传按钮出现
        uploadButton = page.locator('[class^="container-drag-"] input');
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
        await page.waitForTimeout(2000);
        const video = page.locator('[class^="phone-container-"] video');
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
        const titleInput = page.locator('input[class^="semi-input"]');
        await titleInput.first().fill(title || '');
      },
    });

    await runTask({
      name: '点击发布按钮',
      logs: data.logs,
      task: async () => {
        // 需要等待一下，等表单处理好
        await page.waitForTimeout(2000);

        const publishButton = page.locator('button:text("发布")');
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

    return data as PlatformPublishResult;
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

    log(message, data.logs);

    const err = new Error(message);
    // @ts-ignore 添加 details 属性
    err.details = data;

    throw err;
  }
}

export { publishTiktok };
