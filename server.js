const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const net = require('net');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const defaultPort = parseInt(process.env.PORT || '3000', 10);

// For production, ensure we're using the built app
if (!dev && !process.env.NEXT_STANDALONE) {
  console.warn('Warning: For production, consider using "next start" or building with standalone output');
}

// Function to check if a port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Function to find an available port starting from the default port
async function findAvailablePort(startPort) {
  let port = startPort;
  let maxAttempts = 10; // Try up to 10 ports (3000-3009)
  
  while (maxAttempts > 0) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    port++;
    maxAttempts--;
  }
  
  throw new Error(`Could not find an available port after trying ${startPort} to ${startPort + 10}`);
}

// Start the server
async function startServer() {
  try {
    const port = await findAvailablePort(defaultPort);
    
    const app = next({ dev, hostname });
    const handle = app.getRequestHandler();

    await app.prepare();

    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
      if (port !== defaultPort) {
        console.log(`> Note: Port ${defaultPort} was in use, using port ${port} instead`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

