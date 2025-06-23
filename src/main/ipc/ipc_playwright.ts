import fse from 'fs-extra';
import { chromium } from 'playwright';
import { installBrowsersForNpmInstall } from 'playwright-core/lib/server';

const ipcMainApiOfPlaywright = {
  checkPlaywrightBrowser: async (): Promise<string> => {
    const res = chromium.executablePath();

    // 检查 res 路径是否存在
    if (res) {
      if (fse.existsSync(res)) {
        return res;
      }
    }

    throw new Error('Playwright Chromium 没有安装');
  },
  installPlaywrightBrowser: async (): Promise<void> => {
    // 使用 Playwright 的 API 安装浏览器
    await installBrowsersForNpmInstall(['chromium', 'chromium-headless-shell', 'ffmpeg']);

    console.log('Playwright Chromium 安装成功');
  },
};

export { ipcMainApiOfPlaywright };
