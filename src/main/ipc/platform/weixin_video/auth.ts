import { chromium } from 'playwright';
import { sendH5Auth } from '../../send';
import { log, runTask } from '../helper';
import { EnumCode, EnumPlatform, PlatformAuthParams, type PlatformAuthResult } from '../types';

async function authWeixinVideo(params: PlatformAuthParams): Promise<PlatformAuthResult> {
  const { isDebug, h5AuthId } = params;

  const data: Partial<PlatformAuthResult> = {
    platform: EnumPlatform.WEIXIN_VIDEO,
    platformName: undefined,
    platformAvatar: undefined,
    platformId: undefined,
    authInfo: undefined,
    logs: [],
  };

  log(`参数: ${JSON.stringify(params)}`, data.logs);

  // 显示浏览器窗口
  const browser = await chromium.launch({
    // 视频号需要 false，否则很多功能正常工作。
    headless: false,
    channel: 'chrome',
  });

  let timerQrcode: NodeJS.Timeout | null = null;

  try {
    // 创建一个干净的上下文
    const context = await browser.newContext({
      // recordVideo: {
      //   dir: getRecordVideoDir(),
      // },
    });
    // 创建页面
    const page = await context.newPage();

    await runTask({
      name: '打开登录页面',
      task: async () => {
        await page.goto('https://channels.weixin.qq.com/login.html');
      },
      logs: data.logs,
    });

    if (h5AuthId) {
      await runTask({
        name: '获取二维码',
        logs: data.logs,
        task: async () => {
          // 等待页面加载
          await page.waitForTimeout(2000);

          let lastQrcodeSrc: string | null = null;
          async function getQrcode(): Promise<void> {
            const qrcode = page.frameLocator('iframe').locator('[class^="qrcode-wrap"] img.qrcode');
            await qrcode.waitFor({
              state: 'visible',
            });
            const qrcodeSrc = await qrcode.getAttribute('src');

            // 有变化才发送，避免重复发送
            if (qrcodeSrc !== lastQrcodeSrc) {
              log(`获取到二维码: ${qrcodeSrc}`, data.logs);

              lastQrcodeSrc = qrcodeSrc;

              sendH5Auth({
                type: 'QRCODE',
                data: { h5AuthId: h5AuthId!, qrcode: qrcodeSrc ?? '' },
              });
            }
          }

          await getQrcode();

          // 并且定时获取，二维码可能超时失效，需要重新获取
          timerQrcode = setInterval(() => {
            getQrcode();
          }, 1000 * 2);
        },
      });
    }

    await runTask({
      name: '等待授权成功',
      logs: data.logs,
      task: async () => {
        // 登录进入首页
        await page.waitForURL('https://channels.weixin.qq.com/platform/', {
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
        const name = page.locator('.finder-nickname');
        await name.waitFor({
          state: 'visible',
        });
        const nameText = await name.textContent();
        data.platformName = nameText ?? undefined;
        log(`获取到 name: ${nameText}`, data.logs);

        // 获取平台ID
        const platformId = page.locator('.finder-uniq-id');
        await platformId.waitFor({
          state: 'visible',
        });
        const platformIdText = await platformId.textContent();
        data.platformId = platformIdText ?? undefined;
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
  } finally {
    if (timerQrcode) {
      clearInterval(timerQrcode);
    }
  }
}

export { authWeixinVideo };
