// lib/utils/errorActions.ts
export const retryWithReload = (clearError: () => void) => {
  clearError();
  window.location.reload();
};
