// WebSocket Durable Object for real-time dashboard communication
// Manages WebSocket connections and broadcasts events to connected clients

export class DashboardWebSocket {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.heartbeatInterval = null;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // WebSocket upgrade request
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.handleSession(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  handleSession(webSocket, request) {
    const sessionId = crypto.randomUUID();
    webSocket.accept();

    this.sessions.set(sessionId, {
      socket: webSocket,
      connectedAt: Date.now(),
    });

    // Send welcome message
    webSocket.send(JSON.stringify({
      event: 'connected',
      data: { sessionId, timestamp: new Date().toISOString() }
    }));

    // Handle incoming messages
    webSocket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleClientMessage(sessionId, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    webSocket.addEventListener('close', () => {
      this.sessions.delete(sessionId);
      console.log(`Session ${sessionId} disconnected`);
    });

    // Handle errors
    webSocket.addEventListener('error', (error) => {
      console.error(`WebSocket error for session ${sessionId}:`, error);
      this.sessions.delete(sessionId);
    });

    // Start heartbeat
    this.startHeartbeat();
  }

  handleClientMessage(sessionId, message) {
    // Handle commands from dashboard
    switch (message.type) {
      case 'ping':
        this.sendToSession(sessionId, { event: 'pong', data: { timestamp: new Date().toISOString() } });
        break;
      case 'subscribe':
        // Subscribe to specific event types
        break;
      case 'command':
        // Execute command and broadcast result
        this.executeCommand(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  async executeCommand(commandData) {
    // Execute command via orchestrator
    // This would integrate with the existing MFM system
    console.log('Executing command:', commandData);

    // Broadcast command execution event
    this.broadcast({
      event: 'command_executed',
      data: {
        command: commandData,
        timestamp: new Date().toISOString()
      }
    });
  }

  sendToSession(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (session && session.socket.readyState === WebSocket.OPEN) {
      session.socket.send(JSON.stringify(data));
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.socket.readyState === WebSocket.OPEN) {
        try {
          session.socket.send(message);
        } catch (error) {
          console.error(`Error sending to session ${sessionId}:`, error);
          this.sessions.delete(sessionId);
        }
      }
    }
  }

  startHeartbeat() {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.connectedAt > 300000) { // 5 minutes timeout
          session.socket.close();
          this.sessions.delete(sessionId);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Public methods for external calls
  async broadcastAgentStatus(agent, status, currentTask) {
    this.broadcast({
      event: 'agent_status',
      data: { agent, status, current_task: currentTask, timestamp: new Date().toISOString() }
    });
  }

  async broadcastTaskUpdate(taskId, status, score) {
    this.broadcast({
      event: 'task_update',
      data: { task_id: taskId, status, score, timestamp: new Date().toISOString() }
    });
  }

  async broadcastMetricsUpdate(agent, metrics) {
    this.broadcast({
      event: 'metrics_update',
      data: { agent, ...metrics, timestamp: new Date().toISOString() }
    });
  }
}
