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
      <table class="data-table">
        <thead>
          <tr>
            <th>文本</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in dataList" :key="item.timestamp">
            <td>{{ item.text }}</td>
            <td>{{ new Date(item.timestamp).toLocaleString() }}</td>
            <td><button @click="deleteItem(item.timestamp)">删除</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from "vue";
import { useDataStorage, type DataItem } from "../composables/useDataStorage";

const { parseUrl, getDatabase, saveToDatabase, deleteFromDatabase } =
  useDataStorage();

const showModal = ref(false);
const inputText = ref("");
const inputRef = ref<HTMLInputElement>();
const platform = ref("");
const roomId = ref("");
const dataList = ref<DataItem[]>([]);

const closeModal = () => {
  showModal.value = false;
  inputText.value = ""; // 清除输入框数据
};

const confirmInput = () => {
  if (inputText.value.trim() !== "") {
    saveToDatabase(platform.value, roomId.value, inputText.value);
    dataList.value = getDatabase(platform.value, roomId.value); // 更新数据列表
  }
  closeModal();
};

const deleteItem = (timestamp: number) => {
  deleteFromDatabase(platform.value, roomId.value, timestamp);
  dataList.value = getDatabase(platform.value, roomId.value); // 更新数据列表
};

const openModal = () => {
  const urlInfo = parseUrl();
  if (urlInfo.platform) {
    platform.value = urlInfo.platform;
    roomId.value = urlInfo.roomId;
    dataList.value = getDatabase(platform.value, roomId.value); // 获取数据列表
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
  width: 600px;
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
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.data-table button:hover {
  background-color: #c82333;
}
</style>
