import { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import config from '../config';


const useNewsPhoneix = () => {
  const [messages, setMessages] = useState([]);

  const { sendMessage, lastMessage } = useWebSocket(config.wsPhoenixUrl, {
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
            source: parsedMessage.name,
            title: parsedMessage.body,
            body: undefined,
          };
        }

        if (parsedMessage.source === 'Webs' || parsedMessage.source === 'Crypto' || parsedMessage.source === 'Blogs') {
          let title = parsedMessage.coin ? parsedMessage.coin + ': ' + parsedMessage.title : parsedMessage.sourceName + ': ' + parsedMessage.title;
          parsedMessage = {
            ...parsedMessage,
            source: 'Blogs',
            title: title,
          };
        }
        setMessages(prevMessages => [parsedMessage, ...prevMessages]);

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

export default useNewsPhoneix;

