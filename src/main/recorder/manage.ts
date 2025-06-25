import { CheckAndRecordResult, Recorder } from './recorder';

enum EnumRecorderStatus {
  // 初始
  INIT = 'INIT',
  // 记录中
  RECORDING = 'RECORDING',
  // 结束了
  END = 'END',
}

interface RecorderInfo {
  status: EnumRecorderStatus;
  recorder?: CheckAndRecordResult;
}

const recorderMap: Record<string, RecorderInfo> = {};

interface AutoCheckAndRecordParams {
  roomId: string;
  outputDir: string;
  fileName?: string;
}
async function autoCheckAndRecord({
  roomId,
  outputDir,
  fileName,
}: AutoCheckAndRecordParams): Promise<RecorderInfo> {
  // 如果有
  if (recorderMap[roomId]) {
    const info = recorderMap[roomId];

    // 这些状态，直接返回数据。
    if (info.status === EnumRecorderStatus.INIT || info.status === EnumRecorderStatus.RECORDING) {
      return info;
    }

    // 如果已经结束，流程继续
    if (info.status === EnumRecorderStatus.END) {
      // nothing
    }
  }

  // 流程继续：拉起一个新的 record

  recorderMap[roomId] = {
    status: EnumRecorderStatus.INIT,
    recorder: undefined,
  };

  let recorder;
  try {
    // 创建
    recorder = await Recorder.checkAndRecord(
      {
        roomId,
        outputDir,
        fileName,
      },
      {
        // 如果结束，清空
        onEnd: () => {
          console.log('onEnd', roomId);
          // 更新为 end
          recorderMap[roomId].status = EnumRecorderStatus.END;
        },
        // 如果出错，清空
        onError: (err) => {
          console.log('onError', roomId, err);
          // 简单处理，也更新为 end
          recorderMap[roomId].status = EnumRecorderStatus.END;
        },
      },
    );
  } catch (err) {
    console.log('Recorder.checkAndRecord error', err);
    // err 当 end 简单处理
    recorderMap[roomId].status = EnumRecorderStatus.END;
    // 返回信息
    return recorderMap[roomId];
  }

  // 有错误，则状态更新为 end
  if (recorder.error) {
    recorderMap[roomId] = {
      status: EnumRecorderStatus.END,
      recorder,
    };

    return recorderMap[roomId];
  }

  // 因为是异步，如果 end，可能被 stopRecord 了。
  if (recorderMap[roomId].status === EnumRecorderStatus.END) {
    // 则停止刚刚新建的
    recorder.stop();

    return recorderMap[roomId];
  }

  // 否则记录下来。
  recorderMap[roomId] = {
    status: EnumRecorderStatus.RECORDING,
    recorder,
  };

  return recorderMap[roomId];
}

interface StopRecordParams {
  roomId: string;
}
function stopRecord({ roomId }: StopRecordParams): void {
  if (!recorderMap[roomId]) {
    return;
  }

  const info = recorderMap[roomId];
  // everyway stop 一下
  info.recorder?.stop();
  // 状态更新为 end
  info.status = EnumRecorderStatus.END;
}

type GetRecordersResult = Record<string, RecorderInfo>;
function getRecorders(): GetRecordersResult {
  return recorderMap;
}

const RecordManager = {
  autoCheckAndRecord,
  stopRecord,
  getRecorders,
};

export { RecordManager };
export type { AutoCheckAndRecordParams, GetRecordersResult, RecorderInfo, StopRecordParams };
