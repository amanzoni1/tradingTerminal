import React, { useState, useEffect, useMemo, useRef } from 'react';
import useOpenOrders from '../../hooks/useOpenOrders';
import useDeleteOrder from '../../hooks/useDeleteOrder';
import './orders.css';

function dynamicToFixed(value) {
  if (value === 0) { return '-'; }
  let decimals;
  const absValue = Math.abs(value);

  if (absValue >= 100) { decimals = 2; }
  else if (absValue >= 10) { decimals = 3; }
  else if (absValue >= 1) { decimals = 4; }
  else if (absValue >= 0.1) { decimals = 5; }
  else { decimals = 6; }

  return parseFloat(value.toFixed(decimals)).toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

function formatText(text) {
  if (text === 'STOP') {
    return 'Stop Limit';
  }

  return text
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
}

const Orders = () => {
  const { data: orders, isLoading, error, refetch } = useOpenOrders();
  const { deleteOrder } = useDeleteOrder();
  const [sortKey, setSortKey] = useState('symbol');
  const [sortDirection, setSortDirection] = useState('asc'); 
  const intervalRef = useRef(null);

  // Set up polling interval
  useEffect(() => {
    intervalRef.current = setInterval(() => refetch(), 1000); 
    return () => clearInterval(intervalRef.current);
  }, [refetch]);

  // Handle sorting logic for 'symbol', 'amount', 'side', 'type'
  const handleSort = (key) => {
    if (sortKey === key) {
      // Toggle sort direction
      setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      // Set new sort key and default to ascending
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Memoize sorted orders to optimize performance
  const sortedOrders = useMemo(() => {
    if (!orders) return [];

    return [...orders].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      // Handle different sort keys
      if (sortKey === 'symbol' || sortKey === 'type' || sortKey === 'side') {
        // String comparison
        aValue = aValue ? aValue.toLowerCase() : '';
        bValue = bValue ? bValue.toLowerCase() : '';

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      if (sortKey === 'amount') {
        // Numeric comparison
        aValue = Number(aValue);
        bValue = Number(bValue);

        if (isNaN(aValue)) aValue = 0;
        if (isNaN(bValue)) bValue = 0;

        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0; // Default case
    });
  }, [orders, sortKey, sortDirection]);

  // Display loading state
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // Display error state
  if (error) {
    return <p>Error: {error.message}</p>;
  }

  // Display no orders message
  if (sortedOrders.length === 0) {
    return <p className='p-pos'>No Open Orders</p>;
  }

  return (
    <div className='tableWrapper'>
      <table className='pos-table'>
        <thead className='header'>
          <tr className='ordini'>
            <th
              style={{ width: '14%' }}
              onClick={() => handleSort('symbol')}
              className='dir-button'
              aria-sort={sortKey === 'symbol' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Symbol
              {sortKey === 'symbol' && (
                <span className={`sort-icon ${sortDirection}`}>{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>

            <th
              style={{ width: '15%' }}
              onClick={() => handleSort('type')}
              className='dir-button'
              aria-sort={sortKey === 'type' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Type
              {sortKey === 'type' && (
                <span className={`sort-icon ${sortDirection}`}>{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>

            <th
              style={{ width: '12%' }}
              onClick={() => handleSort('side')}
              className='dir-button'
              aria-sort={sortKey === 'side' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Side
              {sortKey === 'side' && (
                <span className={`sort-icon ${sortDirection}`}>{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>

            <th style={{ width: '14%' }}>Price</th>

            <th
              style={{ width: '14%' }}
              onClick={() => handleSort('amount')}
              className='dir-button'
              aria-sort={sortKey === 'amount' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Amount
              {sortKey === 'amount' && (
                <span className={`sort-icon ${sortDirection}`}>{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>

            <th style={{ width: '14%' }}>Filled</th>

            <th style={{ width: '18%' }}>TriggerCond</th>

            <th style={{ width: '8%' }}>Cancel</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order) => (
            <tr key={order.orderId} className='container'>
              <td style={{ width: '14%' }}>{order.symbol}</td>
              <td style={{ width: '15%', fontSize: '12px' }}>{formatText(order.type)}</td>
              <td style={{ width: '12%' }}>
                {order.side === 'BUY' ? <div className="green-str">Buy</div> : <div className="red-str">Sell</div>}
              </td>
              <td style={{ width: '14%', fontSize: '12px' }}>{dynamicToFixed(parseFloat(order.price))}</td>
              <td style={{ width: '14%', fontSize: '12px' }}>
                {dynamicToFixed(
                  parseFloat(
                    order.type === 'STOP_MARKET'
                      ? order.stopPrice * order.origQty
                      : order.price * order.origQty
                  )
                )}
              </td>
              <td style={{ width: '14%', fontSize: '12px' }}>
                {dynamicToFixed(
                  parseFloat(
                    order.type === 'STOP_MARKET'
                      ? order.stopPrice * order.executedQty
                      : order.price * order.executedQty
                  )
                )}
              </td>
              <td style={{ width: '18%', fontSize: '12px' }}>
                {order.origType === 'STOP' || order.origType === 'STOP_MARKET'
                  ? ((order.origType === 'STOP' ? 'Last Price' : 'Mark Price') +
                    (order.side === 'SELL' ? ' <= ' : ' >= ') +
                    dynamicToFixed(parseFloat(order.stopPrice)))
                  : dynamicToFixed(parseFloat(order.stopPrice))}
              </td>
              <td style={{ width: '8%' }}>
                <button
                  className="close-button"
                  onClick={() => deleteOrder(order.symbol, order.orderId)}
                  aria-label={`Cancel order ${order.orderId}`}
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
}

export default Orders;