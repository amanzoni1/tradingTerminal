import { useState } from 'react';
import { SWRConfig } from 'swr';

import config from './config';
import Symbols from './components/Symbols/symbols';
import OrderType from './components/OrderType';
import Amount from './components/Amount';
import Tabs from './components/Tabs/tabs';
import CreateOrder from './components/CreateOrder';
import TradingPair from './components/TradingPair/TradingPair';
import ChartComponent from './components/Chart/chart';
import AccountInfo from './components/AccountInfo/accountInfo';
import NewsFeed from './components/NewsFeed/newsFeed';

import './App.css';

const App = () => {
  const [selectedSymbol, setSelectedSymbol] = useState({ label: 'BTC/USDT', value: 'BTC/USDT' });
  const [orderType, setOrderType] = useState(null);
  const [amount, setAmount] = useState(null);
  const [limitPrice, setLimitPrice] = useState(null);
  const [stopPrice, setStopPrice] = useState(null);

  return (
    <SWRConfig value={config.swr}>
      <div className="App">
        <div className='left-block'>
          <div className='mainview'>
            <div className='optionside'>
              <AccountInfo />
              <div className='options-tab'>
                <div className="contenitore-top">
                  <Symbols onChange={setSelectedSymbol} selectedSymbol={selectedSymbol} onChangeAm={setAmount} onChangeLP={setLimitPrice} onChangeSP={setStopPrice} />
                  <TradingPair selectSymbol={setSelectedSymbol} />
                </div>
                <div className="contenitore">
                  <Amount amount={amount} onChange={setAmount} />
                  <OrderType type={orderType} onChange={setOrderType} />
                </div>
                <CreateOrder selectedSymbol={selectedSymbol} orderType={orderType} amount={amount} limitPrice={limitPrice} stopPrice={stopPrice} />  
              </div>
            </div>
            <div className='graphside'>
              <ChartComponent selectedSymbol={selectedSymbol}></ChartComponent>
            </div>
          </div>
          <div className='second-line-big-view'>
            <Tabs />
          </div>
        </div>
        <div className='newsfeed'>
          <NewsFeed />
        </div>
      </div>
    </SWRConfig>
  );
};

export default App;