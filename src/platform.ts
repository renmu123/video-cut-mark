import type { Platform } from "./types";

interface ParseResult {
  platform: Platform;
  roomId: string;
  liveStartTime: number;
  roomTitle: string;
  username: string;
}

function BilibiliParseUrl(): ParseResult | null {
  const url = window.location.href;
  if (url.includes("live.bilibili.com")) {
    // @ts-ignore
    const data = window.__NEPTUNE_IS_MY_WAIFU__;
    const roomTitle = data?.roomInfoRes?.data?.room_info?.title ?? "";
    const name = data?.roomInfoRes?.data?.anchor_info?.base_info?.uname ?? "";
    const liveStatus = data?.roomInitRes?.data?.live_status;
    if (liveStatus !== 1) {
      alert("当前直播间未开播");
      return null;
    }
    const roomId = data?.roomInitRes?.data?.room_id;
    const liveStartTime = data?.roomInitRes?.data?.live_time;
    if (!roomId) {
      return null;
    }
    return {
      platform: "Bilibili",
      roomId: roomId,
      liveStartTime: liveStartTime * 1000,
      roomTitle: roomTitle,
      username: name,
    };
  }
  return null;
}

function DouyuParseUrl(): ParseResult | null {
  return {
    platform: "DouYu",
    roomId: "2112",
    liveStartTime: 2121,
    roomTitle: "",
    username: "",
  };
}

// 解析URL并返回平台和roomId
export function parseUrl(): ParseResult | null {
  let data = BilibiliParseUrl();
  if (!data) {
    data = DouyuParseUrl();
  }

  if (!data) {
    alert("当前页面不支持或无法解析URL");
  }
  return data;
}
