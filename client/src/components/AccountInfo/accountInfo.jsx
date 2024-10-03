import React, { useEffect } from 'react';
import useAccountInfo from '../../hooks/useAccountInfo';
import './accountInfo.css';

const AccountInfo = () => {
  const { marginBalance, spotBalance, pnl, refetchSpot, refetchFuture } = useAccountInfo();
  const total = Number(marginBalance) + Number(pnl) + Number(spotBalance);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchSpot();
      refetchFuture();
    }, 1000); 

    return () => clearInterval(intervalId);
  }, [refetchSpot, refetchFuture]); 

  return (
    <div className="box-info">
      <div className='acc-info'>
        <div className='acc-info-title'>
          <p className='p-acc'>Spot Balance:</p>
          <p className='p-acc'>Futures Margin Balance:</p>
          <p className='p-acc'>Futures PNL:</p>
          <p className='p-accT'>Total:</p>
        </div>
        <div className='acc-info-value'>
          <p className='p-acc'>
            {Number(spotBalance).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
          <p className='p-acc'>
            {Number(marginBalance).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
          <div>
            {pnl > 0 ? (
              <p className='acc-pc-green'>
                {Number(pnl).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            ) : (
              <p className='acc-pc-red'>
                {Number(pnl).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            )}
          </div>
          <p className='p-accT'>
            {total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;