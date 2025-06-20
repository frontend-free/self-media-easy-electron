import { omit } from 'lodash-es';
import {
  AutoCheckAndRecordParams,
  GetRecordersResult,
  RecorderInfo,
  RecordManager,
  StopRecordParams,
} from '../recorder/manage';

async function handleAutoCheckAndRecord(_, arg: AutoCheckAndRecordParams): Promise<RecorderInfo> {
  const res = await RecordManager.autoCheckAndRecord(arg);
  return omit(res, ['recorder.stop']);
}

async function handleStopRecord(_, arg: StopRecordParams): Promise<undefined> {
  await RecordManager.stopRecord(arg);

  return;
}

async function handleGetRecorders(): Promise<GetRecordersResult> {
  const res = await RecordManager.getRecorders();

  const data = {};

  Object.keys(res).forEach((key) => {
    data[key] = omit(res[key], ['recorder.stop']);
  });

  return data;
}

const ipcMainApiOfRecorder = {
  autoCheckAndRecord: handleAutoCheckAndRecord,
  stopRecord: handleStopRecord,
  getRecorders: handleGetRecorders,
};

export { ipcMainApiOfRecorder };
