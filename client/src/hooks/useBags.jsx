import { useGetRequest } from './requests';

const useBags = () => {
  const { data, error, isLoading, mutate } = useGetRequest('/position/spot');

  return {
    data,
    error,
    isLoading,
    mutate,
    refetch() {
      return mutate();
    },
  };
};

export default useBags;
