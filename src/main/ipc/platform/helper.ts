import { app } from 'electron';
import path from 'path';

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

export { getRecordVideoDir, log, runTask };
