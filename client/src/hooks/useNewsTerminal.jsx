import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import config from '../config';

const useNewsTerminal = () => {
  const [messages, setMessages] = useState([]);

  const { sendMessage, lastMessage } = useWebSocket(config.wsUri, {
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 100,
    reconnectInterval: 3000,
  });

  useEffect(() => {
    const heartbeat = setInterval(() => {
      sendMessage('ping');
    }, 10 * 1000);

    return () => clearInterval(heartbeat);
  }, [sendMessage]);

  useEffect(() => {
    if (lastMessage) {
      try {
        let parsedMessage = JSON.parse(lastMessage?.data);

        if (parsedMessage.body) {
          parsedMessage = {
            ...parsedMessage,
            source: parsedMessage.title,
            title: parsedMessage.body,
            body: undefined,
          };
        }
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

export default useNewsTerminal;





