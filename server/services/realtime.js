// Real-time Event Broadcaster (SSE - Server-Sent Events)
// Enables real-time reactive updates for all user and admin dashboards

const clients = new Set();

/**
 * Register a new SSE client connection
 */
function registerClient(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const client = {
    id: Date.now() + Math.random().toString(36).substr(2, 9),
    res,
    userId: req.user?._id?.toString() || null,
    role: req.user?.role || null,
    email: req.user?.email?.toLowerCase() || null
  };

  clients.add(client);

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date() })}\n\n`);

  // Heartbeat every 25 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

/**
 * Broadcast an event to all connected dashboard clients
 * @param {string} event - Event name (e.g. 'CASE_CREATED', 'CASE_UPDATED', 'DECISION_ISSUED', 'CASE_SOLVED')
 * @param {object} payload - Relevant case or update data
 */
function broadcast(event, payload = {}) {
  const data = JSON.stringify({
    event,
    data: payload,
    timestamp: new Date().toISOString()
  });

  for (const client of clients) {
    try {
      client.res.write(`event: ${event}\ndata: ${data}\n\n`);
    } catch (err) {
      clients.delete(client);
    }
  }
}

module.exports = {
  registerClient,
  broadcast
};
