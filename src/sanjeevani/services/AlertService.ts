/**
 * AlertService — ports src/services/AlertService.js (logic unchanged).
 */

type AlertListener = (message: string, type: string) => void;

let alertListener: AlertListener | null = null;

export const setAlertListener = (listener: AlertListener | null) => {
  alertListener = listener;
};

export const showAlert = (message: string, type = "info") => {
  if (alertListener) {
    alertListener(message, type);
  } else {
    // Fallback if component is not mounted
    alert(message);
  }
};
