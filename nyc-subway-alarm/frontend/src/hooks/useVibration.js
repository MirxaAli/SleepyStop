export function vibratePhone() {
  if ("vibrate" in navigator) {
    navigator.vibrate([700, 300, 700, 300, 1200]);
  }
}
