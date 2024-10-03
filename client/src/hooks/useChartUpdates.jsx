import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import config from '../config';
import useFutureSymbols from './useFutureSymbols';

const useChartUpdates = (selectedSymbol, interval) => {
  const [candle, setCandle] = useState(null);
  const [volume, setVolume] = useState(null);
  const { data: futSymbols = [] } = useFutureSymbols();

  const isCoinExistInFutureSymbols = futSymbols.find(e => e.label === selectedSymbol?.label);
  const binApi =
    isCoinExistInFutureSymbols && interval !== '1s'
      ? config.binanceFutSocket
      : config.binanceSocket;

  const symbSocket = selectedSymbol
    ? selectedSymbol.label.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
    : 'btcusdt';

  const socketUrl = `${binApi}${symbSocket}@kline_${interval}`;

  const { lastMessage } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      const time = message.k.t / 1000;
      const open = Number(message.k.o);
      const high = Number(message.k.h);
      const low = Number(message.k.l);
      const close = Number(message.k.c);
      const volumeValue = Number(message.k.q);

      setCandle({ time, open, high, low, close });
      setVolume({ time, value: volumeValue });
    }
  }, [lastMessage]);

  return { candle, volume };
};

export default useChartUpdates;