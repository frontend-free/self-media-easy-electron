import dayjs from 'dayjs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { getRoomInfo, GetRoomInfoResult } from './douyin';
import { ffmpegOutputOptions, inputOptionsArgs } from './helper';

type CheckAndRecordResult = {
  roomId: string;
  output: string;
  roomInfo: GetRoomInfoResult;
  stop: () => void;
  getStatus: () => EnumRecorderStatus;
};

enum EnumRecorderStatus {
  INIT = 'init',
  PROCESSING = 'processing',
  END = 'end',
  ERROR = 'error',
}

function initFfmpeg(): void {
  // ffmpeg.setFfmpegPath(ffmpegPathFromModule);
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
    onEnd?: () => void;
    onError?: (err: Error) => void;
  } = {},
): Promise<void | CheckAndRecordResult> {
  const { roomId, outputDir, fileName } = params;
  console.log('checkAndRecord', params);

  initFfmpeg();

  let recorderStatus = EnumRecorderStatus.INIT;

  const roomInfo = await getRoomInfo({ roomId });

  console.log('roomInfo', roomInfo);

  if (!roomInfo.isLiving) {
    console.log('room is not living');

    return;
  }

  const output = path.resolve(
    outputDir,
    fileName || `${roomInfo.title}-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.mp4`,
  );

  console.log('output', output);

  const command = ffmpeg(roomInfo.stream)
    .inputOptions(...inputOptionsArgs)
    .outputOptions(ffmpegOutputOptions)
    .output(output);

  command.on('start', function (commandLine) {
    console.log('ffmpeg start', commandLine);
    options.onStart?.();
  });

  command.on('progress', function (progress) {
    console.log('ffmpeg progress', progress);
    recorderStatus = EnumRecorderStatus.PROCESSING;
  });

  command.on('end', function (stdout, stderr) {
    console.log('ffmpeg end', stdout, stderr);
    recorderStatus = EnumRecorderStatus.END;
    options.onEnd?.();
  });

  command.on('error', function (err, stdout, stderr) {
    console.log('ffmpeg error', err, stdout, stderr);
    // 255 是 kill SIGINT ?
    // 先当是，按 end 处理，不走 error
    if (err.message.includes('255')) {
      recorderStatus = EnumRecorderStatus.END;
      options.onEnd?.();
      return;
    }

    recorderStatus = EnumRecorderStatus.ERROR;
    options.onError?.(err);
  });

  console.log('ffmpeg run');
  command.run();

  const result = {
    roomId,
    output,
    roomInfo,
    stop: () => {
      console.log('stop');
      // 要传 SIGINT，优雅退出。生成的 video 才能查看。
      command.kill('SIGINT');
    },
    getStatus: () => recorderStatus,
  };

  setTimeout(() => {
    // 如果 10s 后，还在 init，则认为有问题，stop
    if (recorderStatus === EnumRecorderStatus.INIT) {
      result.stop();
    }
  }, 10000);

  return result;
}

const Recorder = {
  checkAndRecord,
};

export { EnumRecorderStatus, Recorder };
export type { CheckAndRecordResult };
