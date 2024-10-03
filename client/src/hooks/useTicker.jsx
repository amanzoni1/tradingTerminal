import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

const useTicker = (selectedSymbol) => {
  const [price, setPrice] = useState('');
  const symbSocket = selectedSymbol ? selectedSymbol.label.replace(/[^a-z]/gi, '').toLowerCase() : 'btcusdt';
  const { lastMessage } = useWebSocket(`wss://fstream.binance.com/ws/${symbSocket}@ticker`, {
    shouldReconnect: (closeEvent) => false,
    reconnectAttempts: 0,
    reconnectInterval: 30,
    onReconnectStop: 2,
  });

  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage?.data);
      const price = Number(message.c);

      setPrice(price);
    }
  }, [lastMessage]);

  return { price };
};

export default useTicker;
