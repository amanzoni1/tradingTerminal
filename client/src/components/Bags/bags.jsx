import React, { useEffect, useMemo, useState, useRef } from 'react';
import useSellBags from '../../hooks/useSellBags';
import useBags from '../../hooks/useBags';
import config from '../../config';
import './bags.css';

const Bags = () => {
  const { data: bags, isLoading, error, refetch } = useBags();
  const { sellBags } = useSellBags();
  
  // Set default sort to 'value' in descending order
  const [sortKey, setSortKey] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc');
  const intervalRef = useRef(null);

  // Set up polling interval
  useEffect(() => {
    intervalRef.current = setInterval(() => refetch(), 1000);
    return () => clearInterval(intervalRef.current);
  }, [refetch]);

  // Handle sorting logic for 'coin' and 'value' only
  const handleSort = (key) => {
    if (sortKey === key) {
      // Toggle sort direction if the same column is clicked
      setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      // Set new sort key and default to ascending
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Memoize sorted bags to optimize performance
  const sortedBags = useMemo(() => {
    if (!bags) return [];

    const sorted = [...bags].sort((a, b) => {
      let aValue = a[sortKey];
      let bValue = b[sortKey];

      // Defensive checks
      if (sortKey === 'coin') {
        aValue = typeof aValue === 'string' ? aValue.toLowerCase() : '';
        bValue = typeof bValue === 'string' ? bValue.toLowerCase() : '';

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      // If sorting by value, ensure they are numbers
      aValue = Number(aValue);
      bValue = Number(bValue);

      if (isNaN(aValue)) aValue = 0;
      if (isNaN(bValue)) bValue = 0;

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  }, [bags, sortKey, sortDirection]);

  // Display loading state
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // Display error state
  if (error) {
    return <p>Error: {error.message}</p>;
  }

  // Display no bags message
  if (sortedBags.length === 0) {
    return <p className='p-pos'>No Open Bags</p>;
  }

  return (
    <div className='tableWrapper'>
      <table className='pos-table'>
        <thead className='header'>
          <tr className='bags-legend'>
            <th
              style={{ width: '20%' }}
              onClick={() => handleSort('coin')}
              className='dir-button'
              aria-sort={sortKey === 'coin' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Symbol
              {sortKey === 'coin' && (
                <span className={`sort-icon ${sortDirection}`}>{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>

            <th
              style={{ width: '20%' }}
              className='non-sortable'
            >
              Quantity
            </th>

            <th
              style={{ width: '20%' }}
              onClick={() => handleSort('value')}
              className='dir-button'
              aria-sort={sortKey === 'value' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Value
              {sortKey === 'value' && (
                <span className={`sort-icon ${sortDirection}`}>{sortDirection === 'asc' ? '▲' : '▼'}</span>
              )}
            </th>

            <th style={{ width: '20%' }}>Reduce</th>

            <th style={{ width: '20%' }}>Close</th>
          </tr>
        </thead>
        <tbody>
          {sortedBags.map((bag) => (
            <tr key={bag.id || bag.coin} className='container-bags'>
              <td style={{ width: '20%' }}>{bag.coin}</td>
              <td style={{ width: '20%' }}>{bag.quantity}</td>
              <td style={{ width: '20%' }} className='bags-value'>
                {Number(bag.value).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </td>
              <td style={{ width: '20%' }} className="reduce-container">
                <button
                  className="reduce-button"
                  onClick={() => sellBags(bag.coin, bag.quantity, config.smallReduce)}
                  aria-label={`Reduce by ${config.smallReduce}%`}
                >
                  20%
                </button>
                <button
                  className="reduce-button"
                  onClick={() => sellBags(bag.coin, bag.quantity, config.midReduce)}
                  aria-label={`Reduce by ${config.midReduce}%`}
                >
                  33%
                </button>
                <button
                  className="reduce-button"
                  onClick={() => sellBags(bag.coin, bag.quantity, config.bigReduce)}
                  aria-label={`Reduce by ${config.bigReduce}%`}
                >
                  50%
                </button>
              </td>
              <td style={{ width: '20%' }}>
                <button
                  className="close-button"
                  onClick={() => sellBags(bag.coin, bag.quantity)}
                  aria-label={`Close ${bag.coin} bag`}
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

export default Bags;