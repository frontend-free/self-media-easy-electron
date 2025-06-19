import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const request = wrapper(
  axios.create({
    timeout: 10e3,
    jar,
    // axios 会自动读取环境变量中的 http_proxy 和 https_proxy 并应用，这会让请求发往代理的 host。
    // 于是 set-cookie 的 domain 与请求的 host 无法匹配上，tough-cookie 在检查时会丢弃它，导致 cookie 丢失。
    // 所以这里需要主动禁用代理功能。
    proxy: false,
  }),
);

enum EnumRoomStatus {
  Living = 0,
  Ended = 2,
}

enum EnumQuality {
  // 标清 960x540
  LD = 'ld',
  // 蓝光 1280x720
  HD = 'hd',
  // 高清 1920x720
  SD = 'sd',
}

interface GetRoomInfoResult {
  roomId: string;
  isLiving: boolean;
  room_status: EnumRoomStatus;
  owner: string;
  title?: string;
  stream?: string;
}

async function getRoomInfo({ roomId }: { roomId: string }): Promise<GetRoomInfoResult> {
  console.log('getRoomInfo', roomId);
  // 抖音的 'webcast/room/web/enter' api 会需要 ttwid 的 cookie，这个 cookie 是由这个请求的响应头设置的，
  // 所以在这里请求一次自动设置。
  await request.get('https://live.douyin.com/');

  const res = await request.get('https://live.douyin.com/webcast/room/web/enter/', {
    params: {
      aid: 6383,
      live_id: 1,
      device_platform: 'web',
      language: 'zh-CN',
      enter_from: 'web_live',
      cookie_enabled: 'true',
      screen_width: 1920,
      screen_height: 1080,
      browser_language: 'zh-CN',
      browser_platform: 'MacIntel',
      browser_name: 'Chrome',
      browser_version: '108.0.0.0',
      web_rid: roomId,
      // enter_source:,
      'Room-Enter-User-Login-Ab': 0,
      is_need_double_stream: 'false',
    },
  });

  // 不成功
  if (res.data.status_code !== 0) {
    throw new Error(
      `API Error. code ${res.data.status_code}, msg ${res.data.data}, roomId ${roomId}`,
    );
  }

  const data = res.data.data;
  const room = data.data[0];

  const stringStreamData = room?.stream_url?.live_core_sdk_data?.pull_data?.stream_data;

  if (!room || !stringStreamData) {
    return {
      roomId,
      isLiving: data.room_status === EnumRoomStatus.Living,
      room_status: data.room_status,
      owner: data.user.nickname,
    };
  }

  const streamData = JSON.parse(stringStreamData);

  const qualities = Object.keys(streamData.data);
  const quality = qualities.includes(EnumQuality.LD) ? EnumQuality.LD : qualities[0];
  const stream = streamData.data[quality].main.flv;

  return {
    roomId,
    isLiving: data.room_status === EnumRoomStatus.Living,
    room_status: data.room_status,
    owner: data.user.nickname,
    title: room.title,
    stream,
  };
}

export { getRoomInfo };
export type { GetRoomInfoResult };
