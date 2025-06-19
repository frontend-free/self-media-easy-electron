import { CheckAndRecordResult, Recorder } from './recorder';

enum EnumRecorderStatus {
  // 初始
  INIT = 'init',
  // 创建中
  CREATING = 'creating',
  // 记录中
  RECORDING = 'recording',
  // 结束了
  END = 'end',
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
    if (
      info.status === EnumRecorderStatus.INIT ||
      info.status === EnumRecorderStatus.CREATING ||
      info.status === EnumRecorderStatus.RECORDING
    ) {
      return info;
    }

    // 如果已经结束，流程继续
    if (info.status === EnumRecorderStatus.END) {
      // nothing
    }
  }

  // 流程继续：拉起一个新的 record

  recorderMap[roomId] = {
    status: EnumRecorderStatus.CREATING,
    recorder: undefined,
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

  // 没有开播，则状态更新为 end
  if (!recorder.roomInfo.isLiving) {
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
