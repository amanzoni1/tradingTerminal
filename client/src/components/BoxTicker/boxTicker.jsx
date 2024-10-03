import React from 'react';
import useBoxTicker from '../../hooks/useBoxTicker';
import useFutureSymbols from '../../hooks/useFutureSymbols';
import './boxTicker.css';

const Ticker = ({ selectedSymbol }) => {
  const { tickerData, fundingRate, openInterest, topTLSRatio, longShortRatio } = useBoxTicker(selectedSymbol);
  const { data: futSymbols } = useFutureSymbols();

  const isCoinExistInFutureSymbols = selectedSymbol ? futSymbols.find(e => e.label === selectedSymbol.label) : '';
  const binApi = !selectedSymbol ? 'future' : isCoinExistInFutureSymbols ? 'future' : 'spot';

  if (binApi === 'future') {
    if (!tickerData || !fundingRate || !openInterest|| !topTLSRatio|| !longShortRatio) {
      return <p>Loading ticker data...</p>;
    }
    return (
      <div className='box-ticker'>
        <div className='bt-title'>
          <p className='bt-coin'>{selectedSymbol?.label}</p> <p className='bt-mark'>Future</p>
        </div>
        <div className='bt-info'>
          <div className='bt-info-title'>
            <p className='p-bt'>Open interest:</p>
            <p className='p-bt'>Funding rate:</p>
            <p className='p-bt'>24h change:</p>
            <p className='p-bt'>24h volume(USDT):</p>
            <p className='p-bt'>Long/Short ratio:</p>
            <p className='p-bt'>TopTrader l/s ratio:</p>
          </div>
          <div className='bt-info-value'>
            <p className='p-bt'>{openInterest}</p>
            <p className='bt-fr'>{(fundingRate*100).toFixed(4)}%</p>
            <div>
              {tickerData.priceChange > 0 ? (
                <p className='bt-pc-green'>{tickerData.priceChange}/{tickerData.priceChangePercent}%</p>
              ) : (
                <p className='bt-pc-red'>{tickerData.priceChange}/{tickerData.priceChangePercent}%</p>
              )}
            </div>
            <p className='p-bt'>{tickerData.quoteVolume}</p>
            <p className='p-bt'>{longShortRatio}</p>
            <p className='p-bt'>{topTLSRatio}</p>      
          </div>
        </div>
      </div>
    );
  } else {
    if (!tickerData) {
    return <p>Loading ticker data...</p>;
    }
    return (
      <div className='box-ticker'>
        <div className='bt-title'>
          <p className='bt-coin'>{selectedSymbol?.label}</p> <p className='bt-mark'>Spot</p>
        </div>
        <div className='bt-info'>
          <div className='bt-info-title-spot'>
            <p className='p-bt'>24h change:</p>
            <p className='p-bt'>24h High:</p>
            <p className='p-bt'>24h Low:</p>
            <p className='p-bt'>24h volume(USDT):</p>
          </div>
          <div className='bt-info-value-spot'>
            <div>
              {tickerData.priceChange > 0 ? (
                <p className='bt-pc-green'>{tickerData.priceChange}/{tickerData.priceChangePercent}%</p>
              ) : (
                <p className='bt-pc-red'>{tickerData.priceChange}/{tickerData.priceChangePercent}%</p>
              )}
            </div>
            <p className='p-bt'>{tickerData.highPrice}</p>
            <p className='p-bt'>{tickerData.lowPrice}</p>
            <p className='p-bt'>{tickerData.quoteVolume}</p>      
          </div>
        </div>
      </div>
    );
  }
};

export default Ticker;