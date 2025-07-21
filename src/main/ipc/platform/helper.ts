import dayjs from 'dayjs';
import { app } from 'electron';
import fse from 'fs-extra';
import path from 'path';
import { videoStick } from '../../ad';

function log(message: string, logs?: string[]): void {
  const msg = `[${new Date().toISOString()}] ${message}`;
  logs?.push(msg);
  console.log(msg);
}

async function runTask({
  name,
  task,
  logs,
}: {
  name: string;
  task: () => Promise<void>;
  logs?: string[];
}): Promise<void> {
  log(`[开始] ${name}`, logs);
  try {
    await task();
    log(`[成功☑️] ${name}`, logs);
  } catch (error) {
    log(`[失败❌] ${name}`, logs);
    // 抛到外面
    throw error;
  }
}

function getRecordVideoDir(): string {
  const dataPath = app.getPath('userData');
  return path.resolve(dataPath, 'record_video');
}

async function processVideoStick({
  input,
  adText,
}: {
  input: string;
  adText: string;
}): Promise<string> {
  const dataPath = app.getPath('userData');

  fse.ensureDirSync(path.resolve(dataPath, 'ad_video'));
  const output = path.resolve(
    dataPath,
    'ad_video',
    dayjs().format('YYYYMMDDHHmmSSS') + path.extname(input),
  );

  await videoStick({
    input,
    output,
    texts: adText.split('\n'),
  });

  return output;
}

export { getRecordVideoDir, log, processVideoStick, runTask };
