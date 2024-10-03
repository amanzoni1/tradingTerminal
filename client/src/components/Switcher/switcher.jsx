import React from 'react';
import './switcher.css';
import useTicker from '../../hooks/useTicker';


function Switcher(props) {
  const { interval, setInterval, selectedSymbol } = props;
  const { price } = useTicker(selectedSymbol);

  return (
    <>
      <div className="switcher">
        <div className="switcher-row">
          {['1s', '1m', '5m', '15m', '30m'].map(time => (
            <div
              key={time}  // Add a key prop here
              className={`switcher-item ${interval === time ? 'active' : ''}`}
              onClick={() => setInterval(time)}
            >
              {time}
            </div>
          ))}
        </div>
        <div className="switcher-row">
          {['1h', '4h', '1d', '1w', '1M'].map(time => (
            <div
              key={time}  // And here
              className={`switcher-item ${interval === time ? 'active' : ''}`}
              onClick={() => setInterval(time)}
            >
              {time}
            </div>
          ))}
        </div>
      </div>
      <div className='legend'>
        {price}
      </div>
    </>
  );
}

export default Switcher;

