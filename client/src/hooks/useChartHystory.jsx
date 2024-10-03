import { useEffect, useState } from 'react';
import useFutureSymbols from './useFutureSymbols';

const useChartHistory = (selectedSymbol, interval) => {
  const [chartData, setChartData] = useState(null);
  const { data: futSymbols = [] } = useFutureSymbols();

  useEffect(() => {
    if (!selectedSymbol || !interval) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const isCoinExistInFutureSymbols = futSymbols.find(e => e.label === selectedSymbol.label);
    const binApi = isCoinExistInFutureSymbols ? 'future' : 'spot';

    const fetchChartHistory = async () => {
      try {
        const symbolLabel = selectedSymbol.label.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        let apiUrl = '';

        if (binApi === 'future' && interval !== '1s') {
          apiUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbolLabel}&interval=${interval}`;
        } else {
          apiUrl = `https://api.binance.com/api/v3/klines?symbol=${symbolLabel}&interval=${interval}`;
        }

        const response = await fetch(apiUrl, { signal });
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching chart history:', error);
        } 
      }
    };

    fetchChartHistory();

    return () => {
      controller.abort();
    };
  }, [selectedSymbol, interval, futSymbols]);

  return { chartData };
};

export default useChartHistory;