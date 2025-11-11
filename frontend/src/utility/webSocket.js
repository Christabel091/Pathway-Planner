/** @format */

let socket = null;
// utility/webSocket.js
export function connectWebSocket(user, onMessage) {
  const url =
    import.meta.env.VITE_WS_URL ||
    `ws://${window.location.hostname}:${
      import.meta.env.VITE_BACKEND_PORT || 3000
    }`;
  const ws = new WebSocket(url);
  window.socketInstance = ws;

  ws.onopen = () => {
    console.log("WS open");
    ws.send(
      JSON.stringify({
        type: "SESSION_JOIN",
        userId: Number(user?.id) || user?.id, // prefer Number
        deviceId: (navigator.userAgent || "").slice(0, 64),
      })
    );
  };

  ws.onmessage = (ev) => {
    let data;
    try {
      data = JSON.parse(ev.data);
    } catch {
      return;
    }
    console.log("WS message:", data);
    onMessage && onMessage(data);
  };

  ws.onerror = (e) => console.log("WS error", e);
  ws.onclose = () => console.log("WS closed");
  return ws;
}

export function sendWebSocket(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}
