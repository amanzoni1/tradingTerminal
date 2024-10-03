import { useEffect, useState } from 'react';
import axios from 'axios';

const useFearAndGreedIndex = () => {
  const [data, setData] = useState({ value: '', classification: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    axios.get('https://api.alternative.me/fng/?limit=1')
      .then(response => {
        const latestData = response.data.data[0];
        setData({ value: latestData.value, classification: latestData.value_classification });
        setLoading(false);
        setError(null);

        if (latestData.time_until_update) {
          const timeoutDelay = latestData.time_until_update * 1000;
          setTimeout(fetchData, timeoutDelay);
        }
      })
      .catch(err => {
        setError(err);
        setLoading(false);
        setTimeout(fetchData, 60000);
      });
  };

  useEffect(() => {
    fetchData();
    return () => {
      clearTimeout(fetchData);
    };
  }, []);

  return { data, loading, error };
};

export default useFearAndGreedIndex;
