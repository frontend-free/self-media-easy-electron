import { omit } from 'lodash-es';
import {
  AutoCheckAndRecordParams,
  GetRecordersResult,
  RecorderInfo,
  RecordManager,
  StopRecordParams,
} from '../recorder/manage';

async function autoCheckAndRecord(_, arg: AutoCheckAndRecordParams): Promise<RecorderInfo> {
  const res = await RecordManager.autoCheckAndRecord(arg);
  return omit(res, ['recorder.stop']);
}

async function stopRecord(_, arg: StopRecordParams): Promise<undefined> {
  await RecordManager.stopRecord(arg);

  return;
}

async function getRecorders(): Promise<GetRecordersResult> {
  const res = await RecordManager.getRecorders();

  const data = {};

  Object.keys(res).forEach((key) => {
    data[key] = omit(res[key], ['recorder.stop']);
  });

  return data;
}

const ipcMainApiOfRecorder = {
  autoCheckAndRecord,
  stopRecord,
  getRecorders,
};

export { ipcMainApiOfRecorder };
