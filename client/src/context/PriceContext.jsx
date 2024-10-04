import React, { createContext, useState, useEffect, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';

export const PriceContext = createContext();

export const PriceProvider = ({ children }) => {
  const [prices, setPrices] = useState({});
  const wsUrl = 'wss://fstream.binance.com/stream';

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(wsUrl, {
    shouldReconnect: () => true,
    onOpen: () => {
      console.log('WebSocket connection established');
    },
  });

  // List of symbols to subscribe to
  const [symbols, setSymbols] = useState([]);

  // Memoize the addSymbols function
  const addSymbols = useCallback((newSymbols) => {
    setSymbols((prevSymbols) => {
      const updatedSymbols = Array.from(new Set([...prevSymbols, ...newSymbols]));
      return updatedSymbols;
    });
  }, []);

  // Subscribe to symbols
  useEffect(() => {
    if (symbols.length > 0) {
      const params = symbols.map(
        (symbol) => `${symbol.toLowerCase()}@markPrice@1s`
      );

      const subscribePayload = {
        method: 'SUBSCRIBE',
        params: params,
        id: 1,
      };

      sendJsonMessage(subscribePayload);
    }

    // Cleanup function to unsubscribe on unmount or symbol change
    return () => {
      if (symbols.length > 0) {
        const unsubscribePayload = {
          method: 'UNSUBSCRIBE',
          params: symbols.map(
            (symbol) => `${symbol.toLowerCase()}@markPrice@1s`
          ),
          id: 1,
        };
        sendJsonMessage(unsubscribePayload);
      }
    };
  }, [symbols, sendJsonMessage]);

  // Handle incoming messages
  useEffect(() => {
    if (lastJsonMessage) {
      if (lastJsonMessage.data && lastJsonMessage.data.e === 'markPriceUpdate') {
        const symbol = lastJsonMessage.data.s;
        const price = parseFloat(lastJsonMessage.data.p);

        setPrices((prevPrices) => ({
          ...prevPrices,
          [symbol]: price,
        }));
      }
    }
  }, [lastJsonMessage]);

  return (
    <PriceContext.Provider value={{ prices, addSymbols }}>
      {children}
    </PriceContext.Provider>
  );
};