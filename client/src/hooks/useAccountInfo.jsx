import { useState, useEffect } from 'react';
import { useGetRequest } from './requests';

const useAccountInfo = () => {
  const [accountInfo, setAccountInfo] = useState({
    spotBalance: 0,
    marginBalance: 0,
    pnl: 0,
    initialMargin: 0,
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: spotData, error: spotError, isLoading: spotIsLoading, mutate: mutateSpot } = useGetRequest('/account/spot');
  const { data: futureData, error: futureError, isLoading: futureIsLoading, mutate: mutateFuture } = useGetRequest('/account/future');

  useEffect(() => {
    if (spotData !== null) {
      setAccountInfo(prev => ({
        ...prev,
        spotBalance: Number(spotData),
      }));
    }
    if (futureData) {
      const { marginBalance, pnl, totalInitialMargin } = futureData;
      setAccountInfo(prev => ({
        ...prev,
        marginBalance: Number(marginBalance),
        pnl: Number(pnl),
        initialMargin: Number(totalInitialMargin),
      }));
    }
    setIsLoading(spotIsLoading || futureIsLoading);
  }, [spotData, futureData, spotIsLoading, futureIsLoading]);

  useEffect(() => {
    if (spotError || futureError) {
      setError(spotError || futureError);
      setIsLoading(false);
    }
  }, [spotError, futureError]);

  return {
    ...accountInfo,
    error,
    isLoading,
    refetchSpot: mutateSpot,
    refetchFuture: mutateFuture,
  };
};

export default useAccountInfo;