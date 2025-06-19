import { omit } from 'lodash-es';
import {
  AutoCheckAndRecordParams,
  GetRecordersResult,
  RecorderInfo,
  RecordManager,
  StopRecordParams,
} from '../recorder/manage';

async function handleAutoCheckAndRecord(
  _,
  arg?: AutoCheckAndRecordParams,
): Promise<{
  success: boolean;
  message?: string;
  data?: RecorderInfo;
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
    data: omit(res, ['recorder.stop']),
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

async function handleGetRecorders(): Promise<{
  success: boolean;
  data?: GetRecordersResult;
  message?: string;
}> {
  console.log('handleGetRecorders');

  const res = await RecordManager.getRecorders();

  const data = {};

  Object.keys(res).forEach((key) => {
    data[key] = omit(res[key], ['recorder.stop']);
  });

  return {
    success: true,
    data,
  };
}

export { handleAutoCheckAndRecord, handleGetRecorders, handleStopRecord };
