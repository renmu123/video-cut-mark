export interface DataItem {
  timestamp: number;
  text: string;
  roomId: string;
}

export function useDataStorage() {
  // 解析URL并返回平台和roomId
  function parseUrl(): { platform: string; roomId: string } {
    const url = window.location.href;
    if (url.startsWith("https://live.bilibili.com")) {
      return {
        platform: "Bilibili",
        roomId: window.location.pathname.substring(1),
      };
    }
    return { platform: "unknown", roomId: "default" };
  }

  // 从localStorage获取数据
  function getDatabase(platform: string, roomId: string): DataItem[] {
    const key = `${platform}_${roomId}`;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return [];
    }
  }

  // 保存数据到localStorage
  function saveToDatabase(
    platform: string,
    roomId: string,
    inputText: string
  ): void {
    const key = `${platform}_${roomId}`;
    const data = getDatabase(platform, roomId);
    data.push({
      timestamp: Date.now(),
      text: inputText,
      roomId: roomId,
    });
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Saved to localStorage: ${key}`, data);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  // 删除数据从localStorage
  function deleteFromDatabase(
    platform: string,
    roomId: string,
    timestamp: number
  ): void {
    const key = `${platform}_${roomId}`;
    let data = getDatabase(platform, roomId);
    data = data.filter((item) => item.timestamp !== timestamp);
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Deleted from localStorage: ${key}`, data);
    } catch (error) {
      console.error("Error deleting from localStorage:", error);
    }
  }

  return {
    parseUrl,
    getDatabase,
    saveToDatabase,
    deleteFromDatabase,
  };
}
