import React from 'react';
import usePriceVariation from '../../../hooks/usePriceVariation';
import './coinPriceVariation.css';

const CoinPriceVariation = ({ coin }) => {
  const specialSymbols = ["PEPE", "FLOKI", "BONK", "SATS", "RATS", "SHIB", "XEC"];
  const isSpecialSymbol = specialSymbols.includes(coin);
  const symbolFormat = isSpecialSymbol ? `1000${coin}USDT` : `${coin}USDT`;

  const { priceVariation } = usePriceVariation({ symbol: symbolFormat });

  const variationClass = priceVariation > 3 ? 'variation-positive' : priceVariation < -3 ? 'variation-negative' : 'variation-neutral';

  return (
    <span className={variationClass}>
      {priceVariation !== null ? `${priceVariation}%` : ''}
    </span>
  );
};

export default CoinPriceVariation;