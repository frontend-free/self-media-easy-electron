import { dialog } from 'electron';
import fse from 'fs-extra';
import path from 'path';

const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mkv'];

async function handleShowOpenDialogOfOpenFile(): Promise<{
  filePaths: string[];
}> {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      {
        name: '视频',
        extensions: VIDEO_EXTENSIONS,
      },
    ],
  });

  return {
    filePaths: result.filePaths || [],
  };
}

async function handleShowOpenDialogOfOpenDirectory(): Promise<{
  filePaths: string[];
}> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  return {
    filePaths: result.filePaths || [],
  };
}

async function handleGetDirectoryVideoFiles(
  _,
  arg: {
    directory: string;
    lastRunAt?: number;
  },
): Promise<{
  filePaths: string[];
}> {
  const { directory, lastRunAt } = arg;

  const files = await fse.readdir(directory);

  const newFiles = files.filter((file) => {
    const stat = fse.statSync(path.join(directory, file));
    return (
      stat.isFile() &&
      VIDEO_EXTENSIONS.includes(file.split('.').pop() || '') &&
      // 过滤 创建时间 > lastRunAt 的文件
      stat.birthtime.getTime() > (lastRunAt || 0)
    );
  });

  const filePaths = newFiles.map((file) => path.join(directory, file));

  return {
    filePaths,
  };
}

const ipcMainApiOfFile = {
  showOpenDialogOfOpenFile: handleShowOpenDialogOfOpenFile,
  showOpenDialogOfOpenDirectory: handleShowOpenDialogOfOpenDirectory,
  getDirectoryVideoFiles: handleGetDirectoryVideoFiles,
};

export { ipcMainApiOfFile };
