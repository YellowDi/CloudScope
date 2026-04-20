import { defineStore } from 'pinia';
import { toast } from 'vue-sonner';

export type NoticeType = 'info' | 'error';

export const useAppStore = defineStore('app', () => {
  function setNotice(message: string, type: NoticeType = 'info') {
    if (type === 'error') {
      toast.error('操作失败', {
        description: message,
      });
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
