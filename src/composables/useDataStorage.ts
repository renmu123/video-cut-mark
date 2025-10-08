import { v4 as uuidv4 } from "uuid";

import type { Platform } from "../types";

// 油猴API类型声明
declare function GM_getValue(key: string, defaultValue?: string): string;
declare function GM_setValue(key: string, value: string): void;
declare function GM_deleteValue(key: string): void;

export interface DataItem {
  uuid: string;
  platform: Platform;
  startTimestamp: number;
  endTimestamp?: number;
  liveStartTime: number;
  roomTitle: string;
  username: string;
  text: string;
  roomId: string;
}

export function useDataStorage() {
  // 检查是否在油猴环境中
  const isUserscriptEnvironment = typeof GM_getValue !== "undefined";

  // 从油猴数据库获取数据，回退到localStorage
  function getDatabase(platform: string, roomId: string): DataItem[] {
    const key = `${platform}_${roomId}`;
    try {
      if (isUserscriptEnvironment) {
        const data = GM_getValue(key, "[]");
        return JSON.parse(data);
      } else {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error("Error reading from database:", error);
      return [];
    }
  }

  // 保存数据到油猴数据库，回退到localStorage
  function saveToDatabase(
    platform: string,
    roomId: string,
    inputText: string,
    liveStartTime: number,
    roomTitle: string,
    username: string
  ): void {
    const key = `${platform}_${roomId}`;
    const data = getDatabase(platform, roomId);
    data.push({
      uuid: uuidv4(),
      platform: platform as Platform,
      startTimestamp: Date.now(),
      liveStartTime: liveStartTime,
      roomTitle: roomTitle,
      username: username,
      text: inputText,
      roomId: roomId,
    });
    try {
      if (isUserscriptEnvironment) {
        GM_setValue(key, JSON.stringify(data));
        console.log(`Saved to GM database: ${key}`, data);
      } else {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Saved to localStorage: ${key}`, data);
      }
    } catch (error) {
      console.error("Error saving to database:", error);
    }
  }

  // 从油猴数据库删除数据，回退到localStorage
  function deleteFromDatabase(
    platform: string,
    roomId: string,
    uuid: string
  ): void {
    const key = `${platform}_${roomId}`;
    let data = getDatabase(platform, roomId);
    data = data.filter((item) => item.uuid !== uuid);
    try {
      if (isUserscriptEnvironment) {
        GM_setValue(key, JSON.stringify(data));
        console.log(`Deleted from GM database: ${key}`, data);
      } else {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Deleted from localStorage: ${key}`, data);
      }
    } catch (error) {
      console.error("Error deleting from database:", error);
    }
  }

  // 更新数据项的结束时间
  function updateEndTimestamp(
    platform: string,
    roomId: string,
    uuid: string
  ): void {
    const key = `${platform}_${roomId}`;
    let data = getDatabase(platform, roomId);
    const itemIndex = data.findIndex((item) => item.uuid === uuid);
    if (itemIndex !== -1) {
      data[itemIndex].endTimestamp = Date.now();
      try {
        if (isUserscriptEnvironment) {
          GM_setValue(key, JSON.stringify(data));
          console.log(
            `Updated endTimestamp in GM database: ${key}`,
            data[itemIndex]
          );
        } else {
          localStorage.setItem(key, JSON.stringify(data));
          console.log(
            `Updated endTimestamp in localStorage: ${key}`,
            data[itemIndex]
          );
        }
      } catch (error) {
        console.error("Error updating endTimestamp in database:", error);
      }
    }
  }

  // 获取当前存储方式
  function getStorageInfo(): {
    type: "userscript" | "localStorage";
    available: boolean;
  } {
    return {
      type: isUserscriptEnvironment ? "userscript" : "localStorage",
      available: isUserscriptEnvironment
        ? typeof GM_setValue === "function"
        : typeof localStorage !== "undefined",
    };
  }

  return {
    getDatabase,
    saveToDatabase,
    deleteFromDatabase,
    updateEndTimestamp,
    getStorageInfo,
  };
}
