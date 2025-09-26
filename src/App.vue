<script setup lang="ts">
import ModalInput from "./components/ModalInput.vue";
import { ref } from "vue";

const modalRef = ref<InstanceType<typeof ModalInput>>();

const openModal = () => {
  modalRef.value?.openModal();
};
</script>

<template>
  <!-- <div style="margin-top: 20px; text-align: center">
    <button @click="openModal" class="demo-button">
      打开模态框 (或按 Ctrl+K)
    </button>
    <p style="margin-top: 10px; color: #666; font-size: 14px">
      功能说明：按 Ctrl+K 打开模态框，输入文本并保存，按 Esc 关闭模态框
    </p>
  </div> -->

  <!-- 模态框组件 -->
  <ModalInput ref="modalRef" />
</template>

<style scoped></style>
