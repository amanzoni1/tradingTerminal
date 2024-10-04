// import { useGetRequest } from './requests';

// const useFutureSymbols = () => {
//   const { data, error, isLoading } = useGetRequest('/markets/future');

//   return {
//     data,
//     error,
//     isLoading,
//   };
// };

// export default useFutureSymbols;


import { useState, useEffect } from 'react';
import axios from 'axios';

const useFutureSymbols = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const getAllFutureSymbols = async () => {
    try {
      // API call to Binance futures exchange info
      const response = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo');
      const symbols = response.data.symbols
        .filter(e => e.status === 'TRADING' && (e.symbol.endsWith('USDT') || e.symbol.endsWith('BUSD')))
        .map(e => e.symbol);

      // Format symbols for use in your application
      const modifiedSymbols = symbols.map(e => {
        if (e.endsWith('USDT')) {
          return e.slice(0, -4) + '/' + 'USDT';
        } else if (e.endsWith('BUSD')) {
          return e.slice(0, -4) + '/' + 'BUSD';
        } else {
          return e;
        }
      });

      // Prepare data to be rendered (label and value)
      const renderSymbols = modifiedSymbols.map(e => ({ label: e, value: e }));

      // Set data in the state
      setData(renderSymbols);
      setIsLoading(false);
    } catch (err) {
      console.error('Error get all future symbols:', err);
      setError(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getAllFutureSymbols();
  }, []); // Fetch future symbols when the component mounts

  return {
    data,
    error,
    isLoading,
  };
};

export default useFutureSymbols;