import { useGetRequest } from './requests';
import { useMemo } from 'react';

const usePositions = () => {
  const { data, error, isLoading, mutate } = useGetRequest('/position/future');

  const memoizedData = useMemo(() => data || [], [data]);

  return {
    data: memoizedData,
    error,
    isLoading,
    mutate,
    refetch() {
      return mutate();
    },
  };
};

export default usePositions;