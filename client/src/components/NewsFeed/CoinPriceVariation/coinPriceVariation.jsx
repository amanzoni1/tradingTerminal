import React, { useContext, useEffect, useState } from 'react';
import { PriceContext } from '../../../context/PriceContext';
import './coinPriceVariation.css';

const CoinPriceVariation = ({ coin }) => {
  const specialSymbols = ['PEPE', 'FLOKI', 'BONK', 'SATS', 'RATS', 'SHIB', 'XEC'];
  const isSpecialSymbol = specialSymbols.includes(coin);
  const symbol = isSpecialSymbol ? `1000${coin}USDT` : `${coin}USDT`;

  const { prices, addSymbols } = useContext(PriceContext);

  const [initialPrice, setInitialPrice] = useState(null);
  const [priceVariation, setPriceVariation] = useState(null);

  useEffect(() => {
    // Add the symbol to the subscription list
    addSymbols([symbol]);
  }, [symbol, addSymbols]);

  useEffect(() => {
    const currentPrice = prices[symbol];

    if (currentPrice !== undefined) {
      if (initialPrice === null) {
        setInitialPrice(currentPrice);
      } else {
        const variation = (((currentPrice - initialPrice) / initialPrice) * 100).toFixed(2);
        setPriceVariation(variation);
      }
    }
  }, [prices, symbol, initialPrice]);

  const variationClass =
    priceVariation > 3
      ? 'variation-positive'
      : priceVariation < -3
      ? 'variation-negative'
      : 'variation-neutral';

  return (
    <span className={variationClass}>
      {priceVariation !== null ? `${priceVariation}%` : ''}
    </span>
  );
};

export default CoinPriceVariation;