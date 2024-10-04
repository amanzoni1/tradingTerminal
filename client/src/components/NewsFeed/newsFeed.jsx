import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import useMakeOrders from '../../hooks/useMakeOrders';
import useSymbols from '../../hooks/useSymbols';
import useFutureSymbols from '../../hooks/useFutureSymbols';
import useNewsTerminal from '../../hooks/useNewsTerminal';
import useNewsPhoneix from '../../hooks/useNewsPhoenix';
import useNewsBwe from '../../hooks/useNewsBwe';
import CoinPriceVariation from './CoinPriceVariation/coinPriceVariation';
import HeaderOptions from './headerOptions/headerOptions';
import { defaultImages, sourceSounds, manualAdditions, manualRemovals } from './params';
import './newsFeed.css';
import useSnackbar from '../../hooks/useSnackbar';

const specialSymbols = ['PEPE', 'FLOKI', 'BONK', 'SATS', 'RATS', 'SHIB', 'XEC'];

const MessageWithTimer = ({ message }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showTimer, setShowTimer] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((oldTime) => oldTime + 1);
    }, 1000);

    const timeout = setTimeout(() => {
      setShowTimer(false);
    }, 31000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  if (!showTimer) {
    return null;
  }

  let timerClass = '';
  if (timeElapsed <= 6) {
    timerClass = 'green';
  } else if (timeElapsed <= 15) {
    timerClass = 'yellow';
  } else {
    timerClass = 'red';
  }

  return <div className={`timer ${timerClass}`}>{timeElapsed}</div>;
};

const NewsFeed = () => {
  const { createLongOrder, createShortOrder } = useMakeOrders();
  const { data: symbols } = useSymbols();
  const { data: futSymbols } = useFutureSymbols();
  const { messages: terminalMessages } = useNewsTerminal();
  const { messages: bweMessages } = useNewsBwe();
  const { messages: phoenixMessages } = useNewsPhoneix();
  const [mergedMessages, setMergedMessages] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [symbolSet, setSymbolSet] = useState(new Set());
  const notificationSound = useRef(new Audio(sourceSounds.default));
  const { openSnackbar, openErrorSnackbar } = useSnackbar();

  useEffect(() => {
    notificationSound.current = new Audio(sourceSounds.default);
  }, []);

  // Audio button
  const toggleAudio = () => {
    if (audioEnabled) {
      setAudioEnabled(false);
      notificationSound.current.pause();
      notificationSound.current.currentTime = 0;
    } else {
      notificationSound.current.play().then(() => {
        setAudioEnabled(true);
      }).catch((err) => {
        console.error('Audio play failed:', err);
      });
    }
  };

  // Filtered messages based on search keyword
  const filteredMessages = useMemo(() => {
    return mergedMessages.filter(
      (message) =>
        message.title && message.title.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [mergedMessages, searchKeyword]);

  // Orders
  // const handleLongClick = useCallback(
  //   (coin) => {
  //     const isSpecialSymbol = specialSymbols.includes(coin);
  //     const symbolLabel = isSpecialSymbol ? `1000${coin}/USDT` : `${coin}/USDT`;

  //     const symbolExists = futSymbols.some((symbol) => symbol.label === symbolLabel);
  //     if (symbolExists) {
  //       const symbolObject = { label: symbolLabel };
  //       createLongOrder(symbolObject, 'LIMITUP', 80000, null, null);
  //     }
  //   },
  //   [createLongOrder, futSymbols]
  // );

  // const handleShortClick = useCallback(
  //   (coin) => {
  //     const isSpecialSymbol = specialSymbols.includes(coin);
  //     const symbolLabel = isSpecialSymbol ? `1000${coin}/USDT` : `${coin}/USDT`;

  //     const symbolExists = futSymbols.some((symbol) => symbol.label === symbolLabel);
  //     if (symbolExists) {
  //       const symbolObject = { label: symbolLabel };
  //       createShortOrder(symbolObject, 'LIMITUP', 80000, null, null);
  //     }
  //   },
  //   [createShortOrder, futSymbols]
  // );

  // Event handles in show mode
  const handleLongClick = () => {
    openErrorSnackbar("Long order is not available without inserting an API key");
  };

  const handleShortClick = () => {
    openErrorSnackbar("Short order is not available without inserting an API key");
  };

  // Handle duplicates in feed
  useEffect(() => {
    const allMessages = [...terminalMessages, ...bweMessages, ...phoenixMessages];
    const uniqueMessages = filterDuplicates(allMessages);
  
    uniqueMessages.sort((a, b) => new Date(b.time) - new Date(a.time));
  
    // Limit the messages to the latest 100
    const limitedMessages = uniqueMessages.slice(0, 100);
  
    // Check if mergedMessages actually changed before updating state
    setMergedMessages((prevMergedMessages) => {
      const prevIds = new Set(prevMergedMessages.map((msg) => msg._id));
      const newIds = new Set(limitedMessages.map((msg) => msg._id));
  
      // If the message IDs are the same, no need to update state
      if (prevIds.size === newIds.size && [...prevIds].every((id) => newIds.has(id))) {
        return prevMergedMessages;
      }
  
      // Process new messages for sound notifications
      const newMessages = limitedMessages.filter((msg) => !prevIds.has(msg._id));
  
      newMessages.forEach((message) => {
        if (message.source) {
          const sourceSound =
            normalizedSourceSounds[message.source.toLowerCase()] || sourceSounds.default;
          if (audioEnabled) {
            notificationSound.current.play().catch((err) => console.error('Audio play failed:', err));
          }
        }
      });
  
      return limitedMessages;
    });
  }, [terminalMessages, bweMessages, phoenixMessages]);

  const normalizedSourceSounds = useMemo(() => {
    return Object.keys(sourceSounds).reduce((acc, key) => {
      acc[key.toLowerCase()] = sourceSounds[key];
      return acc;
    }, {});
  }, []);

  // Function to filter out duplicate messages based on a clean source and title
  const filterDuplicates = useCallback((messages) => {
    const seen = new Set();
    return messages.filter((message) => {
      const cleanSourceName = cleanSource(message.source);
      const cleanTitleText = cleanTitle(message.title);
      const identifier = `${cleanSourceName}:${cleanTitleText}`;
      if (!seen.has(identifier)) {
        seen.add(identifier);
        return true;
      }
      return false;
    });
  }, []);

  // Function to clean the source from extra characters like Twitter handles
  const cleanSource = (source) => {
    return source?.replace(/\s*\(@.*?\)$/, '');
  };

  // Function to clean the title
  const cleanTitle = (title) => {
    const urlRegex = /(https:\/\/t\.co\/|https:\/\/twitter\.com\/\S+\/status\/)[^\s\\]*(\\n)?/gi;
    const specificUrlRegex = /https:\/\/twitter\.com\/\S+\.\.\./gi;

    let cleanedTitle = title?.replace(urlRegex, '');
    cleanedTitle = cleanedTitle?.replace(specificUrlRegex, '');

    const quoteRegex = /\n?Quote \[/;
    const quoteRegex2 = /\n?&gt;&gt;QUOTE/;
    cleanedTitle = cleanedTitle?.split(new RegExp(quoteRegex, 's'))[0];
    cleanedTitle = cleanedTitle?.split(new RegExp(quoteRegex2, 's'))[0];

    cleanedTitle = cleanedTitle?.replace(/&amp;/g, '&');
    cleanedTitle = cleanedTitle?.replace(/[\s]+/g, ' ').trim();

    return cleanedTitle;
  };

  // Extract coins from messages
  const getCoinsFromMessage = (message) => {
    const coinsSet = new Set();

    if (message.coin) {
      coinsSet.add(message.coin);
    }

    if (message.suggestions) {
      message.suggestions.forEach((suggestion) => {
        if (suggestion.coin) {
          coinsSet.add(suggestion.coin);
        }
      });
    }
    return Array.from(coinsSet);
  };

  // Format messages body
  const parseBody = (body) => {
    const urlRegex = /(https:\/\/t\.co\/|https:\/\/twitter\.com\/\S+\/status\/)[^\s\\]*(\.\.\.)?(\s|$)/gi;

    let updatedBody = body?.replace(urlRegex, (match) => {
      return match.endsWith('\\n') ? '\n' : '';
    });
    updatedBody = updatedBody?.replace(/\\n/g, '\n');

    const quoteSplitRegex = /\n?(Quote \[|&gt;&gt;QUOTE)/;
    let parts = updatedBody?.split(new RegExp(quoteSplitRegex));

    let mainPart = parts.length > 0 ? parts[0] : updatedBody;
    let quotePart = parts.length > 2 ? parts[2] : null;

    mainPart = mainPart
      ?.split('\n')
      .map((line, index) => (
        <p key={`main-${index}`}>
          {line.trim() === '' ? '\u00A0' : highlightKeywords(line)}
        </p>
      ));

    if (quotePart) {
      quotePart = quotePart.replace(urlRegex, '');
      quotePart = quotePart.replace(/\([^)]*\)/, '');
      quotePart = quotePart?.replace(/&amp;/g, '&');

      const authorRegex = /@([a-zA-Z0-9_]+)(\]?)/;
      const authorMatch = quotePart.match(authorRegex);
      const author = authorMatch ? '@' + authorMatch[1] : '';
      quotePart = authorMatch ? quotePart.substring(authorMatch.index + authorMatch[0].length) : quotePart;

      const quoteLines = quotePart.split('\n').map((line, index) => (
        <p key={`quote-${index}`}>
          {line.replace(/^>\s?/, '').trim() === '' ? '\u00A0' : highlightKeywords(line.replace(/^>\s?/, '').trim())}
        </p>
      ));

      quotePart = (
        <div className="quote-section">
          <p className="quote-author">{author}</p>
          {quoteLines}
        </div>
      );
    }

    return { mainPart, quotePart };
  };

  // Format messages title
  const formatTitle = (title) => {
    const match = title?.match(/^(.*?)\s*(\(|@)/);
    return match ? match[1] : title;
  };

  const getImageUrl = (message) => {
    if (message.icon) {
      return message.icon;
    } else {
      const sourceKey = (message.source || 'generic').toLowerCase();
      return defaultImages[sourceKey] || defaultImages['generic'];
    }
  };

  // Get link of the messages
  const getLinkUrl = (message) => {
    return message.link || message.url;
  };

  useEffect(() => {
    const updatedSymbolSet = new Set(manualAdditions.map((symbol) => symbol.toUpperCase()));

    if (symbols && symbols.length > 0) {
      symbols.forEach((symbol) => {
        const baseSymbol = symbol.label.split('/USDT')[0].toUpperCase();
        if (!manualRemovals.includes(baseSymbol)) {
          updatedSymbolSet.add(baseSymbol);
        }
      });
    }

    setSymbolSet(updatedSymbolSet);
  }, [symbols]);

  const highlightKeywords = useCallback(
    (text) => {
      const words = text.split(/(\s+)/).filter((part) => part.length > 0);

      const highlightedText = words.map((part, index) => {
        if (part.trim().length === 0) {
          return part;
        }

        const cleanWord = part.replace(/[.,-/#!$%^&*;:{}=_`~()]/g, '').toUpperCase();
        if (symbolSet.has(cleanWord)) {
          return (
            <span className="highlight-blue" key={index}>
              {part}
            </span>
          );
        }
        return part;
      });

      return <>{highlightedText}</>;
    },
    [symbolSet]
  );

  return (
    <div className="news-feed">
      <HeaderOptions toggleAudio={toggleAudio} audioEnabled={audioEnabled} setSearchKeyword={setSearchKeyword} />
      {filteredMessages.map((message, messageIndex) => {
        if (!message.title) {
          return null;
        }

        const parsedBody = parseBody(message.title);

        // Generate a unique key for the message
        const messageKey = message._id || `${message.source}-${message.time}-${messageIndex}`;

        return (
          <div key={messageKey} className="message-container">
            <div className="icon-container">
              <img src={getImageUrl(message)} alt="Icon" className="message-icon" />
            </div>
            <div className="message-content">
              <a href={getLinkUrl(message)} target="_blank" rel="noopener noreferrer" className="message-body-link">
                <div className="message-body">{parsedBody.mainPart}</div>
              </a>
              {message.image && (
                <div className="message-image-container">
                  <img src={message.image} alt="Message Content" className="message-image" />
                </div>
              )}
              {parsedBody.quotePart && <div className="quoted-message">{parsedBody.quotePart}</div>}
              <div className="message-coins">
                {getCoinsFromMessage(message).map((coin) => {
                  // Use coin as key since it's unique within the coins set
                  return (
                    <div key={coin} className="coin-container">
                      <div className="coin">
                        {coin} <CoinPriceVariation coin={coin} />
                      </div>
                      <button className="coin-button green-button" onClick={() => handleLongClick(coin)}>
                        80k
                      </button>
                      <button className="coin-button red-button" onClick={() => handleShortClick(coin)}>
                        80k
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="message-footer">
                <div className="message-source-date">
                  <div className="message-source">{formatTitle(message.source)}</div>
                  <div className="message-date">- {new Date(message.time).toLocaleString()}</div>
                </div>
                <MessageWithTimer message={message} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NewsFeed;