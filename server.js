const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { Redis } = require('@upstash/redis');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);
  
  io.on('connection', (socket) => {
    console.log('Client connected');
    
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL || '',
      token: process.env.UPSTASH_REDIS_TOKEN || '',
    });
    
    const subscription = redis.subscribe('metrics-jobs', (message) => {
      socket.emit('metrics-update', message);
    });
    
    socket.on('disconnect', () => {
      subscription.unsubscribe();
      console.log('Client disconnected');
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
}); 