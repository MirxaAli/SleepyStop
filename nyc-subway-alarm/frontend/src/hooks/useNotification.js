export function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return Promise.resolve("not-supported");
  }

  return Notification.requestPermission();
}

export function sendNotification(title, body) {
  if (!("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      body
    });
  }
}
