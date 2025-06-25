import ffmpeg from 'fluent-ffmpeg';
import fse from 'fs-extra';
import path from 'path';
import { getRoomInfo, GetRoomInfoResult } from './douyin';
import { ffmpegOutputOptions, getFfmpegPath, getNextFileName, inputOptionsArgs } from './helper';

type CheckAndRecordResult = {
  error?: string;
  roomId: string;
  outputDir: string;
  fileName?: string;
  output: string;
  roomInfo?: GetRoomInfoResult;
  stop: () => void;
};

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

  // 确保文件夹存在
  fse.ensureDirSync(outputDir);

  const nextFileName = await getNextFileName({
    outputDir,
    fileName: fileName || `${roomId}.mp4`,
  });
  const output = path.resolve(outputDir, nextFileName);
  console.log('output', output);

  let roomInfo: CheckAndRecordResult['roomInfo'] = undefined;
  const result: CheckAndRecordResult = {
    error: undefined,
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

  const ffmpegPath = getFfmpegPath();
  // 如果 ffmpeg 不存在，则返回
  if (!fse.existsSync(ffmpegPath)) {
    result.error = 'ffmpeg not found';
    return result;
  }

  // 初始化路径
  ffmpeg.setFfmpegPath(ffmpegPath);

  try {
    // 获取房间信息
    roomInfo = await getRoomInfo({ roomId });
    result.roomInfo = roomInfo;
    console.log('roomInfo', roomInfo);
  } catch (err) {
    console.log('getRoomInfo error', err);
  }

  // 失败了
  if (!roomInfo) {
    result.error = 'getRoomInfo error';
    return result;
  }

  // 没有直播，返回数据
  if (!roomInfo.isLiving) {
    result.error = 'room is not living';
    return result;
  }

  const command = ffmpeg(roomInfo.stream)
    .inputOptions(...inputOptionsArgs)
    .outputOptions(ffmpegOutputOptions)
    .output(output);

  command.on('start', function () {
    console.log('ffmpeg start');
    options.onStart?.();
  });

  command.on('progress', function () {
    options.onProcess?.();
  });

  command.on('end', function (stdout, stderr) {
    console.log('ffmpeg end', stdout, stderr);
    options.onEnd?.();
  });

  command.on('error', function (err, stdout, stderr) {
    console.log('ffmpeg error', err, stdout, stderr);

    // 255 是 kill SIGINT ?
    // 先当是，按 end 处理，不走 error
    if (err.message.includes('255')) {
      options.onEnd?.();
      return;
    }

    // 识别更多 error

    // 应该不会导致循环，因为 kill 后就没了，不会再 on error
    console.log('error stop');
    command.kill('SIGINT');
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
