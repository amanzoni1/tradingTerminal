import SymbolsDropdown from './SymbolsDropdown';
import useFutureSymbols from '../../hooks/useFutureSymbols';
import config from '../../config';
import './symbols.css';

const Symbols = ({ onChange, selectedSymbol, onChangeAm, onChangeLP, onChangeSP }) => {
  const { data: futSymbols = [] } = useFutureSymbols();

  const isCoinExistInFutureSymbols = selectedSymbol ? futSymbols.find(e => e.label === selectedSymbol.label) : '';
  const getLinkToBinanceFut = selectedSymbol ? config.binFutureLinkPRD + selectedSymbol.label.replace(/[^a-z0-9]/gi, '') : '';
  const getLinkToBinanceSpot = selectedSymbol ? config.binSpotLinkPRD + selectedSymbol.label.replace(/[/]/gi, '_') + '?theme=dark&type=spot' : '';
  const binLink = isCoinExistInFutureSymbols ? getLinkToBinanceFut : getLinkToBinanceSpot;

  const handleBtcClick = () => {
    const btcSymbol = { label: 'BTC/USDT', value: 'BTC/USDT' };
    onChange(btcSymbol);
  };

  return (
    <div className="blocco-symbols">
      <div className="selection-wrapper">
        <div className="selectionSy" id="symbol" name="symbol">
          {selectedSymbol ? selectedSymbol.label : 'BTC/USDT'}
        </div>
        <div className="buttons-container">
          <a
            role="button"
            style={!selectedSymbol ? { pointerEvents: 'none' } : null}
            href={binLink}
            target="_blank"
            className={`bin-link ${!selectedSymbol ? 'is-disable' : ''}`}
            rel="noreferrer"
          >
            <img 
              className='bin-logo'
              width={24} 
              height={24} 
              src="https://cdn.pixabay.com/photo/2021/04/30/16/47/binance-logo-6219389_1280.png" 
              alt="" 
            />
          </a>
          <button
            type="button"
            className="btc-link"
            onClick={handleBtcClick}
          >
            <img 
              className='bin-logo'
              width={24} 
              height={24} 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/225px-Bitcoin.svg.png" 
              alt="" 
            />
          </button>
        </div>
      </div>
      <div className="basic">
        <SymbolsDropdown onChange={onChange} selected={selectedSymbol} />
      </div>
      <div className='input-row'>
        <label className="label-sy">Size:</label>
        <input className="input-amount" type="number" onChange={(event) => onChangeAm(event?.target?.value * 1000)} />
      </div>
      <div className='input-row'>
        <label className="label-sy">Stop:</label>
        <input className="input-amount" type="number" onChange={(event) => onChangeSP(event?.target?.value)} />
        <label className="label-sy">Price:</label>
        <input className="input-amount" type="number" onChange={(event) => onChangeLP(event?.target?.value)} />
      </div>
    </div>
  );
};

export default Symbols;



