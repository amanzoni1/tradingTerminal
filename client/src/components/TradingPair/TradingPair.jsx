import { useState, useEffect } from 'react';
import useNewsTerminal from '../../hooks/useNewsTerminal';
import useNewsPhoenix from '../../hooks/useNewsPhoenix';
import useNewsBwe from '../../hooks/useNewsBwe';
import useSymbols from '../../hooks/useSymbols';
import useSnackbar from '../../hooks/useSnackbar';
// Removed the CSS import as it's not needed
// import './TradingPair.css'; 

// Helper Functions Moved Outside the Component
const filterDuplicates = (messages) => {
  const seen = new Set();
  return messages.filter((message) => {
    const identifier = `${cleanSource(message.source)}:${cleanTitle(message.title)}`;
    if (!seen.has(identifier)) {
      seen.add(identifier);
      return true;
    }
    return false;
  });
};

const cleanSource = (source) => {
  return source ? source.replace(/\s*\(@.*?\)$/, "") : "";
};

const cleanTitle = (title) => {
  if (!title) return "";
  const urlRegex = /https?:\/\/\S+\b/gi;
  return title
    .replace(urlRegex, '')
    .replace(/&amp;/g, '&')
    .replace(/[\s]+/g, ' ')
    .trim();
};

const getCoinsFromMessage = (message) => {
  const coinsSet = new Set();
  if (message.coin) {
    coinsSet.add(`${message.coin}/USDT`);
  }
  if (message.suggestions) {
    message.suggestions.forEach((suggestion) => {
      if (suggestion.coin) {
        coinsSet.add(`${suggestion.coin}/USDT`);
      }
    });
  }
  return Array.from(coinsSet);
};

const TradingPair = ({ selectSymbol }) => {
  const { data: symbols } = useSymbols();
  const { messages: terminalMessages } = useNewsTerminal();
  const { messages: bweMessages } = useNewsBwe();
  const { messages: phoenixMessages } = useNewsPhoenix();
  const { openErrorSnackbar } = useSnackbar();

  const [coins, setCoins] = useState(['', '', '', '', '']);
  const [mergedMessages, setMergedMessages] = useState([]);

  // First useEffect: Merge and filter messages
  useEffect(() => {
    const allMessages = [...terminalMessages, ...bweMessages, ...phoenixMessages];
    const uniqueMessages = filterDuplicates(allMessages);
    uniqueMessages.sort((a, b) => new Date(b.time) - new Date(a.time));
    setMergedMessages(uniqueMessages);
  }, [terminalMessages, bweMessages, phoenixMessages]);

  // Second useEffect: Extract top 5 coins
  useEffect(() => {
    const coinSet = new Set(mergedMessages.flatMap((message) => getCoinsFromMessage(message)));
    const newCoins = Array.from(coinSet).slice(0, 5);
    setCoins((prev) => {
      const updatedCoins = [...newCoins, ...prev.slice(newCoins.length)].slice(0, 5);
      return updatedCoins;
    });
  }, [mergedMessages]);

  // Check if coin exists in symbols
  const isCoinExistInSymbols = (coin) => symbols?.some((symbol) => symbol.label === coin);

  return (
    <div className="blocco-trading">
      {coins.map((coin, index) => (
        <button
          className="selection1"
          id={`symbol-${index}`}
          key={coin || index} // Use coin as key if available, else fallback to index
          onClick={() => {
            if (isCoinExistInSymbols(coin)) {
              selectSymbol({ label: coin, value: coin });
            } else {
              openErrorSnackbar('This coin does not exist in your symbol selection');
            }
          }}
        >
          {coin ? coin.replace('/USDT', '') : ''}
        </button>
      ))}
    </div>
  );
};

export default TradingPair;