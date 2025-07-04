import { BrowserWindow, ipcMain } from 'electron';

function sendH5Auth(data: {
  type: 'QRCODE' | 'MOBILE_CODE';
  data: { h5AuthId: string; qrcode?: string };
}): void {
  console.log('sendH5Auth', data);

  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((window) => {
    window.webContents.send('h5Auth', data);
  });
}

let count = 0;
function sendH5AuthMobileCode(data: { h5AuthId: string }): Promise<{ mobileCode: string }> {
  console.log('sendH5AuthMobileCode', data);

  const resultKey = 'h5AuthMobileCodeResult' + count++;

  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((window) => {
    window.webContents.send('h5AuthMobileCode', {
      h5AuthId: data.h5AuthId,
      resultKey,
    });
  });

  return new Promise((resolve) => {
    // 等待回复
    ipcMain.handle(resultKey, (_, arg) => {
      console.log(resultKey, arg);

      resolve(arg);
    });
  });
}

export { sendH5Auth, sendH5AuthMobileCode };
