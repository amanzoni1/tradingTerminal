// import { useGetRequest } from './requests';

// const useSymbols = () => {
//   const { data, error, isLoading } = useGetRequest('/markets/spot');

//   return {
//     data,
//     error,
//     isLoading,
//   };
// };

// export default useSymbols;

import { useState, useEffect } from 'react';
import axios from 'axios';

const useSymbols = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const getAllSymbols = async () => {
    try {
      // First API call for spot symbols
      const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
      const symbols = response.data.symbols
        .filter(e => e.status === 'TRADING' && e.permissions.includes('SPOT') && (e.symbol.endsWith('USDT') || e.symbol.endsWith('BUSD')))
        .map(e => e.symbol);

      // Second API call for futures symbols
      const responseF = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo');
      const futSymbols = responseF.data.symbols
        .filter(e => e.status === 'TRADING' && (e.symbol.endsWith('USDT') || e.symbol.endsWith('BUSD')))
        .map(e => e.symbol);

      // Combine spot and futures symbols
      const complete = symbols.reduce((acc, item) => {
        return acc.includes(item) ? acc : [...acc, item];
      }, [...futSymbols]);

      // Format the symbols
      const modifiedSymbols = complete.map(e => {
        if (e.endsWith('USDT')) {
          return e.slice(0, -4) + '/' + 'USDT';
        } else if (e.endsWith('BUSD')) {
          return e.slice(0, -4) + '/' + 'BUSD';
        } else {
          return e;
        }
      });

      // Create render-friendly symbols
      const renderSymbols = modifiedSymbols.map(e => ({ label: e, value: e }));
      setData(renderSymbols); 
      setIsLoading(false);
    } catch (err) {
      console.error('getAllSymbols: ' + err);
      setError(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllSymbols();
  }, []); 

  return {
    data,
    error,
    isLoading,
  };
};

export default useSymbols;