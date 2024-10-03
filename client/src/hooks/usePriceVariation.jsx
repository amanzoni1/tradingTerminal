import React, { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';

const usePriceVariation = ({ symbol }) => {
  const [initialPrice, setInitialPrice] = useState(null);
  const [priceVariation, setPriceVariation] = useState(null);
  const streamName = `${symbol.toLowerCase()}@markPrice@1s`;
  const wsUrl = `wss://fstream.binance.com/ws/${streamName}`;

  const { lastMessage } = useWebSocket(wsUrl, {
    shouldReconnect: (closeEvent) => true, // Automatically reconnect
    reconnectAttempts: 100,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      const newPrice = parseFloat(data.p);

      if (initialPrice === null) {
        setInitialPrice(newPrice);
      } else {
        const variation = (((newPrice - initialPrice) / initialPrice) * 100).toFixed(2);
        setPriceVariation(variation);
      }
    }
  }, [lastMessage, initialPrice, symbol]);

  return { priceVariation };
};

export default usePriceVariation;
