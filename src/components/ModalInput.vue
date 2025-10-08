<template>
  <div v-if="showModal" class="modal" @click.self="closeModal">
    <div class="modal-content">
      <span class="close" @click="closeModal">&times;</span>
      <div class="input-container">
        <input
          ref="inputRef"
          type="text"
          v-model="inputText"
          placeholder="输入文本"
          @keyup.enter="confirmInput"
          class="input-text"
        />
        <button @click="confirmInput" class="confirm-button">确认</button>
      </div>

      <!-- 分组切换控制和导出按钮 -->
      <div class="control-bar">
        <div v-if="groupedData.length > 1" class="group-navigator">
          <button
            @click="previousGroup"
            :disabled="currentGroupIndex === 0"
            class="nav-button"
          >
            ← 上一组
          </button>
          <span class="group-info">
            第 {{ currentGroupIndex + 1 }} 组 / 共 {{ groupedData.length }} 组
            ({{ new Date(currentGroup.liveStartTime).toLocaleString() }})
            <br />
            <small style="color: #6c757d">
              {{ currentGroup.items[0]?.roomTitle || roomTitle }} -
              {{ currentGroup.items[0]?.username || username }}
            </small>
          </span>
          <button
            @click="nextGroup"
            :disabled="currentGroupIndex === groupedData.length - 1"
            class="nav-button"
          >
            下一组 →
          </button>
        </div>

        <!-- 导出按钮 -->
        <div class="export-controls">
          <button
            @click="exportCurrentGroup"
            :disabled="currentGroup.items.length === 0"
            class="export-button"
          >
            导出
          </button>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>文本</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in currentGroup.items" :key="item.uuid">
            <td>{{ item.text }}</td>
            <td>{{ new Date(item.startTimestamp).toLocaleString() }}</td>
            <td>
              {{
                item.endTimestamp
                  ? new Date(item.endTimestamp).toLocaleString()
                  : "未标记"
              }}
            </td>
            <td>
              <button
                v-if="!item.endTimestamp"
                @click="markEndTime(item.uuid)"
                class="mark-button"
              >
                标记结束
              </button>
              <button @click="deleteItem(item.uuid)" class="delete-button">
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, computed } from "vue";
import { useDataStorage, type DataItem } from "../composables/useDataStorage";
import { parseUrl } from "../platform";

const { getDatabase, saveToDatabase, deleteFromDatabase, updateEndTimestamp } =
  useDataStorage();

const showModal = ref(false);
const inputText = ref("");
const inputRef = ref<HTMLInputElement>();
const platform = ref("");
const roomId = ref("");
const liveStartTime = ref(0);
const roomTitle = ref("");
const username = ref("");
const dataList = ref<DataItem[]>([]);
const currentGroupIndex = ref(0);

// 按liveStartTime分组的计算属性
const groupedData = computed(() => {
  const groups: { [key: number]: DataItem[] } = {};

  dataList.value.forEach((item) => {
    const key = item.liveStartTime;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  console.error("分组数据:", groups);

  // 转换为数组并按liveStartTime排序
  return Object.keys(groups)
    .map((key) => ({
      liveStartTime: Number(key),
      items: groups[Number(key)].sort(
        (a, b) => a.startTimestamp - b.startTimestamp
      ),
    }))
    .sort((a, b) => b.liveStartTime - a.liveStartTime);
});

// 当前显示的组
const currentGroup = computed(() => {
  return (
    groupedData.value[currentGroupIndex.value] || {
      liveStartTime: 0,
      items: [],
    }
  );
});

const closeModal = () => {
  showModal.value = false;
  inputText.value = ""; // 清除输入框数据
  currentGroupIndex.value = 0; // 重置到第一组
};

const confirmInput = () => {
  if (inputText.value.trim() !== "") {
    saveToDatabase(
      platform.value,
      roomId.value,
      inputText.value,
      liveStartTime.value,
      roomTitle.value,
      username.value
    );
    dataList.value = getDatabase(platform.value, roomId.value); // 更新数据列表
    // 如果当前没有对应的分组，重置到第一组
    if (currentGroupIndex.value >= groupedData.value.length) {
      currentGroupIndex.value = 0;
    }
  }
  closeModal();
};

const deleteItem = (uuid: string) => {
  deleteFromDatabase(platform.value, roomId.value, uuid);
  dataList.value = getDatabase(platform.value, roomId.value); // 更新数据列表
  // 如果当前组没有数据了，调整到有效的组
  if (currentGroup.value.items.length === 0 && groupedData.value.length > 0) {
    currentGroupIndex.value = Math.min(
      currentGroupIndex.value,
      groupedData.value.length - 1
    );
  }
};

const markEndTime = (uuid: string) => {
  updateEndTimestamp(platform.value, roomId.value, uuid);
  dataList.value = getDatabase(platform.value, roomId.value); // 更新数据列表
};

// 切换到上一组
const previousGroup = () => {
  if (currentGroupIndex.value > 0) {
    currentGroupIndex.value--;
  }
};

// 切换到下一组
const nextGroup = () => {
  if (currentGroupIndex.value < groupedData.value.length - 1) {
    currentGroupIndex.value++;
  }
};

// 导出当前组数据
const exportCurrentGroup = () => {
  if (currentGroup.value.items.length === 0) {
    alert("当前组没有数据可导出");
    return;
  }

  const exportData = {
    exportTime: new Date().toISOString(),
    platform: platform.value,
    roomId: roomId.value,
    roomTitle: currentGroup.value.items[0]?.roomTitle || roomTitle.value,
    username: currentGroup.value.items[0]?.username || username.value,
    liveStartTime: currentGroup.value.liveStartTime,
    liveStartTimeFormatted: new Date(
      currentGroup.value.liveStartTime
    ).toLocaleString(),
    groupIndex: currentGroupIndex.value + 1,
    totalGroups: groupedData.value.length,
    itemCount: currentGroup.value.items.length,
    items: currentGroup.value.items.map((item) => ({
      ...item,
    })),
  };

  // 文件名为 第一个item的roomTitle-username-时间格式化.json
  const firstItem = currentGroup.value.items[0];
  const safeRoomTitle = `${firstItem?.username}-${
    firstItem?.roomTitle
  }-${new Date(firstItem?.liveStartTime).toLocaleString()}`.replace(
    /[\/\\?%*:|"<>]/g,
    "-"
  );
  downloadJSON(exportData, `${safeRoomTitle}.json`);
};

// 下载JSON文件的通用函数
const downloadJSON = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const openModal = () => {
  const urlInfo = parseUrl();
  if (urlInfo && urlInfo.platform) {
    platform.value = urlInfo.platform;
    roomId.value = urlInfo.roomId;
    liveStartTime.value = urlInfo.liveStartTime;
    roomTitle.value = urlInfo.roomTitle;
    username.value = urlInfo.username;
    dataList.value = getDatabase(platform.value, roomId.value); // 获取数据列表
    currentGroupIndex.value = 0; // 重置到第一组
    showModal.value = true;

    // 聚焦到输入框
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
};

// 监听键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === "k") {
    event.preventDefault();
    openModal();
  } else if (event.key === "Escape") {
    if (showModal.value) {
      closeModal();
    }
  } else if (showModal.value) {
    // 在模态框打开时，支持左右箭头切换分组
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousGroup();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nextGroup();
    }
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});

// 暴露给父组件的方法
defineExpose({
  openModal,
});
</script>

<style scoped>
.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  text-align: center;
  max-height: 80%;
  overflow-y: auto;
  width: 800px;
}

.close {
  position: absolute;
  top: 0px;
  right: 5px;
  cursor: pointer;
  font-size: 24px;
}

.input-container {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.input-text {
  flex: 1;
  padding: 10px;
  box-sizing: border-box;
}

.confirm-button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-left: 10px;
}

.confirm-button:hover {
  background-color: #0056b3;
}

.control-bar {
  margin: 20px 0;
}

.group-navigator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 5px;
  border: 1px solid #e9ecef;
}

.export-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 10px;
  background-color: #fff;
  border-radius: 5px;
  border: 1px solid #dee2e6;
}

.export-button {
  padding: 8px 16px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.export-button:hover:not(:disabled) {
  background-color: #138496;
}

.export-button:disabled {
  background-color: #c6c8ca;
  cursor: not-allowed;
}

.export-button.export-all {
  background-color: #28a745;
}

.export-button.export-all:hover:not(:disabled) {
  background-color: #218838;
}

.nav-button {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.nav-button:hover:not(:disabled) {
  background-color: #5a6268;
}

.nav-button:disabled {
  background-color: #c6c8ca;
  cursor: not-allowed;
}

.group-info {
  font-weight: 500;
  color: #495057;
  font-size: 14px;
  text-align: center;
  flex: 1;
  margin: 0 15px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 16px;
}

.data-table th,
.data-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.data-table th {
  background-color: #f2f2f2;
}

.data-table button {
  padding: 5px 10px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 5px;
}

.delete-button {
  background-color: #dc3545;
}

.delete-button:hover {
  background-color: #c82333;
}

.mark-button {
  background-color: #28a745;
}

.mark-button:hover {
  background-color: #218838;
}
</style>
