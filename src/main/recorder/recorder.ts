import dayjs from 'dayjs';
import ffmpeg from 'fluent-ffmpeg';
import fse from 'fs-extra';
import path from 'path';
import { getRoomInfo, GetRoomInfoResult } from './douyin';
import { ffmpegOutputOptions, inputOptionsArgs } from './helper';

type CheckAndRecordResult = {
  roomId: string;
  outputDir: string;
  fileName?: string;
  output: string;
  roomInfo: GetRoomInfoResult;
  stop: () => void;
};

function initFfmpeg(): void {
  // TODO ffmpeg.setFfmpegPath(ffmpegPathFromModule);
  ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg');
}

async function checkAndRecord(
  params: {
    roomId: string;
    outputDir: string;
    fileName?: string;
  },
  options: {
    onStart?: () => void;
    onProcess?: () => void;
    onEnd?: () => void;
    onError?: (err: Error) => void;
  } = {},
): Promise<CheckAndRecordResult> {
  const { roomId, outputDir, fileName } = params;
  console.log('checkAndRecord', params);

  // 初始化
  initFfmpeg();

  // 获取房间信息
  const roomInfo = await getRoomInfo({ roomId });

  console.log('roomInfo', roomInfo);

  const output = path.resolve(
    outputDir,
    fileName || `${roomInfo.roomId}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.mp4`,
  );
  console.log('output', output);

  const result = {
    roomId,
    outputDir,
    fileName,
    output,
    roomInfo,
    stop: () => {
      console.log('stop');
      // 要传 SIGINT，优雅退出。生成的 video 才能查看。
      command.kill('SIGINT');
    },
  };

  // 没有直播，返回数据
  if (!roomInfo.isLiving) {
    console.log('room is not living');

    return result;
  }

  // 确保文件夹存在
  fse.ensureDir(outputDir);

  const command = ffmpeg(roomInfo.stream)
    .inputOptions(...inputOptionsArgs)
    .outputOptions(ffmpegOutputOptions)
    .output(output);

  command.on('start', function () {
    options.onStart?.();
  });

  command.on('progress', function () {
    options.onProcess?.();
  });

  command.on('end', function () {
    options.onEnd?.();
  });

  command.on('error', function (err) {
    console.log('ffmpeg error', err);

    // 255 是 kill SIGINT ?
    // 先当是，按 end 处理，不走 error
    if (err.message.includes('255')) {
      options.onEnd?.();
      return;
    }

    options.onError?.(err);
  });

  console.log('ffmpeg run');
  command.run();

  return result;
}

const Recorder = {
  checkAndRecord,
};

export { Recorder };
export type { CheckAndRecordResult };
