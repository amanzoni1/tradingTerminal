import React, { useState, useEffect, useMemo, useRef } from 'react';
import useClosePosition from '../../hooks/useClosePosition';
import usePositions from '../../hooks/usePositions';
import config from '../../config';
import './positions.css';

function dynamicToFixed(value) {
  if (value === 0) {
    return '-';
  }
  const absValue = Math.abs(value);
  let decimals;

  if (absValue >= 100) {
    decimals = 2;
  } else if (absValue >= 10) {
    decimals = 3;
  } else if (absValue >= 1) {
    decimals = 4;
  } else if (absValue >= 0.1) {
    decimals = 5;
  } else {
    decimals = 6;
  }

  return parseFloat(value.toFixed(decimals)).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const Positions = () => {
  const { data: positions, isLoading, error, refetch } = usePositions();
  const { closePosition } = useClosePosition();
  const [sortDirection, setSortDirection] = useState('desc'); 
  const [sortBy, setSortBy] = useState('positionValue'); 
  const intervalRef = useRef(null); 

  // Set up polling interval
  useEffect(() => {
    intervalRef.current = setInterval(() => refetch(), 1000); 
    return () => clearInterval(intervalRef.current);
  }, [refetch]);

  // Handle sorting logic
  const handleSort = (sortingKey) => {
    if (sortBy === sortingKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(sortingKey);
      setSortDirection('asc');
    }
  };

  // Memoize sorted positions for performance
  const sortedPositions = useMemo(() => {
    if (!positions) return [];

    return [...positions].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'positionValue':
          aValue = Math.abs(a.positionAmt * a.markPrice);
          bValue = Math.abs(b.positionAmt * b.markPrice);
          break;
        case 'unRealizedProfit':
          aValue = a.unRealizedProfit;
          bValue = b.unRealizedProfit;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [positions, sortBy, sortDirection]);

  // Display loading state
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // Display error state
  if (error) {
    return <p>Error: {error.message}</p>;
  }

  // Display no positions message
  if (sortedPositions.length === 0) {
    return <p className='p-pos'>No Open Positions</p>;
  }

  return (
    <div className='tableWrapper'>
      <table className='pos-table'>
        <thead className='header'>
          <tr className='ordini'>
            <th style={{ width: '17%' }}>
              Symbol
            </th>

            <th
              style={{ width: '16%' }}
              onClick={() => handleSort('positionValue')}
              className='dir-button'
              aria-sort={sortBy === 'positionValue' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Size
              {sortBy === 'positionValue' && (
                <span className={`sort-icon ${sortDirection}`}>
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>

            <th style={{ width: '13%' }}>EntryPrice</th>

            <th style={{ width: '13%' }}>MarkPrice</th>

            <th style={{ width: '13%' }}>LiqPrice</th>

            <th
              style={{ width: '20%' }}
              onClick={() => handleSort('unRealizedProfit')}
              className='dir-button'
              aria-sort={sortBy === 'unRealizedProfit' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              PNL
              {sortBy === 'unRealizedProfit' && (
                <span className={`sort-icon ${sortDirection}`}>
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>

            <th style={{ width: '11%' }}>Reduce</th>

            <th style={{ width: '7%' }}>Close</th>
          </tr>
        </thead>
        <tbody>
          {sortedPositions.map((position) => (
            <tr key={position.id || position.symbol} className='container'>
              <td style={{ width: '17%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {position.positionAmt > 0 ? <div className="green-circle" /> : <div className="red-circle" />}
                  <span style={{ marginRight: '4px' }}>{position.symbol}</span>
                  <span className='leverage'>{position.leverage}x</span>
                </div>
              </td>

              <td
                className={position.positionAmt * position.markPrice > 0 ? 'green-text' : 'red-text'}
                style={{ width: '16%' }}
              >
                {(position.positionAmt * position.markPrice).toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}
              </td>

              <td style={{ width: '13%', fontSize: '12px' }}>
                {dynamicToFixed(parseFloat(position.entryPrice))}
              </td>

              <td style={{ width: '13%', fontSize: '12px' }}>
                {dynamicToFixed(parseFloat(position.markPrice))}
              </td>

              <td className='liqui' style={{ width: '13%' }}>
                {dynamicToFixed(parseFloat(position.liquidationPrice))}
              </td>

              <td style={{ width: '20%' }}>
                {position.unRealizedProfit > 0 ? (
                  <p className="pnl-green">
                    {parseFloat(position.unRealizedProfit).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                    ({parseFloat(
                      (
                        (position.unRealizedProfit /
                          Math.abs(position.positionAmt * position.entryPrice)) *
                        100
                      ).toFixed(2)
                    )}%)
                  </p>
                ) : (
                  <p className="pnl-red">
                    {parseFloat(position.unRealizedProfit).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                    ({parseFloat(
                      (
                        (position.unRealizedProfit /
                          Math.abs(position.positionAmt * position.entryPrice)) *
                        100
                      ).toFixed(2)
                    )}%)
                  </p>
                )}
              </td>

              <td style={{ width: '11%' }} className="reduce-container">
                <button
                  className="reduce-button"
                  onClick={() => closePosition(position.symbol, position.positionAmt, config.smallReduce)}
                  aria-label={`Reduce by ${config.smallReduce}%`}
                >
                  20%
                </button>
                <button
                  className="reduce-button"
                  onClick={() => closePosition(position.symbol, position.positionAmt, config.midReduce)}
                  aria-label={`Reduce by ${config.midReduce}%`}
                >
                  33%
                </button>
                <button
                  className="reduce-button"
                  onClick={() => closePosition(position.symbol, position.positionAmt, config.bigReduce)}
                  aria-label={`Reduce by ${config.bigReduce}%`}
                >
                  50%
                </button>
              </td>

              <td style={{ width: '7%' }}>
                <button
                  className="close-button"
                  onClick={() => closePosition(position.symbol, position.positionAmt)}
                  aria-label={`Close ${position.symbol} position`}
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Positions;