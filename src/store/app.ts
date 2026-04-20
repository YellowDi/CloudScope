import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';

export type NoticeType = 'info' | 'error';

export const useAppStore = defineStore('app', () => {
  function setNotice(message: string, type: NoticeType = 'info') {
    if (type === 'error') {
      const normalizedMessage = message.trim();
      toast.error(normalizedMessage || '操作失败');
      return;
    }

    toast('系统提示', {
      description: message,
    });
  }

  function clearNotice() {
    toast.dismiss();
  }

  return {
    setNotice,
    clearNotice,
  };
});
