import { Recorder } from './recorder';

async function test(): Promise<void> {
  console.log('test');
  // const res1 = await getRoomInfo({ roomId: '282773369501' });
  // console.log(res1);

  // const res2 = await getRoomInfo({ roomId: '178397991020' });
  // console.log(res2);

  // await checkAndRecord({ roomId: '282773369501', output: '/Users/liyatang/test.mp4' });

  const recorder = await Recorder.checkAndRecord(
    { roomId: '646454278948', output: '/Users/liyatang/test.mp4' },
    {
      onStart: () => {
        console.log('onStart');
      },
      onEnd: () => {
        console.log('onEnd');
      },
      onError: (err) => {
        console.log('onError', err);
      },
    },
  );
}

export { test };
