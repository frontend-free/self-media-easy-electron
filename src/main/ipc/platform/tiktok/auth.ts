import { chromium } from 'playwright';
import { sendH5Auth, sendH5AuthMobileCode } from '../../send';
import { getRecordVideoDir, log, runTask } from '../helper';
import { EnumCode, EnumPlatform, PlatformAuthParams, type PlatformAuthResult } from '../types';

async function getIsMobileCode({ page, data }): Promise<boolean> {
  let isMobileCode = false;

  await Promise.race([
    (async () => {
      log('等待二次验证弹窗出现', data.logs);
      const btn = page.locator('#uc-second-verify div:text-is("接收短信验证码")');
      await btn.waitFor({
        state: 'visible',
        // 5分钟超时
        timeout: 5 * 60 * 1000,
      });
      log('二次验证弹窗出现', data.logs);
      isMobileCode = true;
    })(),
    (async () => {
      log('等待授权成功出现', data.logs);
      await page.waitForURL('https://creator.douyin.com/creator-micro/home', {
        // 5分钟超时
        timeout: 5 * 60 * 1000,
      });
      log('授权成功出现', data.logs);
      isMobileCode = false;
    })(),
  ]);

  return isMobileCode;
}

async function doMobileCode({ data, page, h5AuthId }): Promise<void> {
  await runTask({
    name: '手机验证码',
    logs: data.logs,
    task: async () => {
      log('点击使用手机验证码', data.logs);
      const btnUseMobileCode = page.locator('#uc-second-verify div:text-is("接收短信验证码")');
      await btnUseMobileCode.waitFor({
        state: 'visible',
      });
      await btnUseMobileCode.click();

      log('设置H5状态为获取手机验证码', data.logs);
      sendH5Auth({
        type: 'MOBILE_CODE',
        data: { h5AuthId },
      });

      log('等待手机验证码', data.logs);
      const { mobileCode } = await sendH5AuthMobileCode({
        h5AuthId,
      });

      log(`输入手机验证码: ${mobileCode}`, data.logs);
      const input = page.locator('#uc-second-verify input[placeholder="请输入验证码"]');
      await input.waitFor({
        state: 'visible',
      });
      await input.fill(mobileCode);

      log('点击验证', data.logs);
      const btnVerify = page.locator('#uc-second-verify div:text-is("验证")');
      await btnVerify.waitFor({
        state: 'visible',
      });
      await btnVerify.click();
    },
  });
}

async function authTiktok(params: PlatformAuthParams): Promise<PlatformAuthResult> {
  const { isDebug, h5AuthId } = params;

  const data: Partial<PlatformAuthResult> = {
    platform: EnumPlatform.TIKTOK,
    platformName: undefined,
    platformAvatar: undefined,
    platformId: undefined,
    authInfo: undefined,
    logs: [],
  };

  log(`参数: ${JSON.stringify(params)}`, data.logs);

  // 显示浏览器窗口
  const browser = await chromium.launch({
    // h5Auth 的时候隐藏浏览器
    headless: h5AuthId ? true : false,
    channel: 'chrome',
  });

  let timerQrcode: NodeJS.Timeout | null = null;

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

    // h5 授权情况下获取二维码
    if (h5AuthId) {
      await runTask({
        name: '获取二维码',
        logs: data.logs,
        task: async () => {
          let lastQrcodeSrc: string | null = null;
          async function getQrcode(): Promise<void> {
            const qrcode = page.locator('[class^="qrcode_img"]');
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
          }, 1000 * 5);
        },
      });
    }

    // h5 授权
    if (h5AuthId) {
      // 如果走到手机验证码，则处理验证码逻辑
      const isMobileCode = await getIsMobileCode({ page, data });
      if (isMobileCode) {
        log('走到手机验证码', data.logs);
        await doMobileCode({ data, page, h5AuthId });
      }
    }

    await runTask({
      name: '等待授权成功',
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
  } finally {
    if (timerQrcode) {
      clearInterval(timerQrcode);
    }
  }
}

export { authTiktok };
