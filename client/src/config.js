const config = {
  swr: { revalidateOnFocus: false },
  apiEndpoint: 'http://localhost:8000',
  wsUri: 'wss://news.treeofalpha.com/ws',
  wsBweUri: 'wss://public.bwe-ws.com:8001',
  wsPhoenixUrl: 'wss://wss.phoenixnews.io',
  binFutureLinkPRD: 'https://binance.com/en/futures/',
  binSpotLinkPRD: 'https://www.binance.com/en/trade/',
  binLinkTest: 'https://testnet.binancefuture.com/en/futures/',
  binanceApi: 'https://api.binance.com/api/',
  binanceFutApi: 'https://fapi.binance.com/fapi/',
  binanceSocket: 'wss://stream.binance.com:9443/ws/',
  binanceFutSocket: 'wss://fstream.binance.com/ws/',
  smallReduce: 0.2,
  midReduce: 0.33,
  bigReduce: 0.5,
};

export default config;