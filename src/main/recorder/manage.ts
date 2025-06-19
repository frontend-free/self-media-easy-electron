import { CheckAndRecordResult, EnumRecorderStatus, Recorder } from './recorder';

const recorderMap: Record<
  string,
  | {
      loading: boolean;
      recorder?: CheckAndRecordResult;
    }
  | undefined
> = {};

interface AutoCheckAndRecordParams {
  roomId: string;
  outputDir: string;
  fileName?: string;
}

interface StopRecordParams {
  roomId: string;
}

async function autoCheckAndRecord({
  roomId,
  outputDir,
  fileName,
}: AutoCheckAndRecordParams): Promise<void | EnumRecorderStatus> {
  // 如果有
  if (recorderMap[roomId]) {
    const { recorder, loading } = recorderMap[roomId];

    // 如果正在创建中，则忽略
    if (loading || !recorder) {
      return EnumRecorderStatus.INIT;
    }

    const status = recorder.getStatus();

    // 如果初始化，则忽略。
    if (status === EnumRecorderStatus.INIT) {
      return status;
    }

    // 如果正在进行中，则忽略。
    if (status === EnumRecorderStatus.PROCESSING) {
      return status;
    }

    // 如果已经结束或者错误。则移除
    if (status === EnumRecorderStatus.END || status === EnumRecorderStatus.ERROR) {
      recorderMap[roomId] = undefined;
      return status;
    }
  }

  // 进行中
  recorderMap[roomId] = {
    loading: true,
  };

  // 创建
  const recorder = await Recorder.checkAndRecord(
    {
      roomId,
      outputDir,
      fileName,
    },
    {
      // 如果结束，清空
      onEnd: () => {
        recorderMap[roomId] = undefined;
      },
      // 如果出错，清空
      onError: () => {
        recorderMap[roomId] = undefined;
      },
    },
  );

  // 没有开播或者其他原因，则清空
  if (!recorder) {
    recorderMap[roomId] = undefined;
    // void
    return;
  }

  // 因为是异步，如果 undefined。则被 stopRecord 了。
  if (!recorderMap[roomId]) {
    // 停止
    recorder.stop();
    return EnumRecorderStatus.END;
  }

  // 否则记录下来。
  recorderMap[roomId] = {
    loading: false,
    recorder,
  };

  return EnumRecorderStatus.PROCESSING;
}

function stopRecord({ roomId }: StopRecordParams): void {
  if (!recorderMap[roomId]) {
    return;
  }

  const { recorder } = recorderMap[roomId];

  // 但是没有创建
  if (!recorder) {
    // 清空即可
    recorderMap[roomId] = undefined;
    return;
  }

  // 停止
  recorder.stop();
  recorderMap[roomId] = undefined;
}

const RecordManager = {
  autoCheckAndRecord,
  stopRecord,
};

export { RecordManager };
export type { AutoCheckAndRecordParams, StopRecordParams };
