export function createSocket() {
  const socket = new WebSocket('ws://localhost:3000/');
  socket.onerror = (error) => {
    console.log('Socket error:', error);
  };
  return new Promise((resolve: (value: WebSocket) => void) => {
    socket.onopen = () => {
      console.log('Socket open, sending message...');
      socket.send(JSON.stringify({ type: 'ping', data: 'hello' }));
      console.log('Message sent, resolving promise...');
      resolve(socket);
    };
  });
}
