const http = require('http');
const app = require('./app');

const { loadFutureMarkets } = require('./models/binanceFuture.models');
const { loadSpotMarkets } = require('./models/binanceSpotTry');

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

async function startServer() {
  await loadSpotMarkets();
  await loadFutureMarkets();

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
  });
}
startServer();