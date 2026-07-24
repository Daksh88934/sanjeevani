let alertListener = null;

export const setAlertListener = (listener) => {
  alertListener = listener;
};

export const showAlert = (message, type = 'info') => {
  if (alertListener) {
    alertListener(message, type);
  } else {
    // Fallback if component is not mounted
    alert(message);
  }
};
