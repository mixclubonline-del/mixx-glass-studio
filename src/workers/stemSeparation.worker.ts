self.onmessage = async (event) => {
  const message = event.data;
  if (!message || typeof message !== 'object') return;
  switch (message.type) {
    case 'PROCESS_CHUNK': {
      self.postMessage({
        type: 'CHUNK_ERROR',
        requestId: message.requestId,
        error: 'Demucs worker not yet implemented',
      });
      break;
    }
    case 'CANCEL_REQUEST':
    default:
      break;
  }
};
