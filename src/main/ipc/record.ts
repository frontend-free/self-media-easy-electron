import { AutoCheckAndRecordParams, RecordManager, StopRecordParams } from '../recorder/manage';
import { EnumRecorderStatus } from '../recorder/recorder';

async function handleAutoCheckAndRecord(
  _,
  arg?: AutoCheckAndRecordParams,
): Promise<{
  success: boolean;
  message?: string;
  data?: EnumRecorderStatus;
}> {
  console.log('handleAutoCheckAndRecord', arg);

  if (!arg || !arg.roomId || !arg.outputDir) {
    return {
      success: false,
      message: '参数错误，请检查',
    };
  }

  const res = await RecordManager.autoCheckAndRecord(arg);

  return {
    success: true,
    data: res!,
  };
}

async function handleStopRecord(
  _,
  arg?: StopRecordParams,
): Promise<{
  success: boolean;
  message?: string;
}> {
  console.log('handleStopRecord', arg);
  if (!arg || !arg.roomId) {
    return {
      success: false,
      message: '参数错误，请检查',
    };
  }

  await RecordManager.stopRecord(arg);

  return {
    success: true,
  };
}

export { handleAutoCheckAndRecord, handleStopRecord };
