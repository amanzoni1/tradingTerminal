import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import config from '../config';

const useNewsBwe = () => {
  const [messages, setMessages] = useState([]);

  const { sendMessage, lastMessage } = useWebSocket(config.wsBweUri, {
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 100,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    const heartbeat = setInterval(() => {
      sendMessage('ping');
    }, 60 * 1000);

    return () => clearInterval(heartbeat);
  }, [sendMessage]);


  useEffect(() => {
    if (lastMessage) {
      try {
        let parsedMessage = JSON.parse(lastMessage?.data);

        parsedMessage = {
          ...parsedMessage,
          source: "Price Monitor",
        };

        setMessages(prevMessages => {
          const newMessages = [parsedMessage, ...prevMessages];
          return newMessages;
        });
      } catch (e) {
        if (lastMessage?.data === 'pong') {
          //console.log('Pong received');
        } else {
          console.error('Received non-JSON message:', lastMessage?.data);
        }
      }
    }
  }, [lastMessage]);

  return { messages };
};

export default useNewsBwe;