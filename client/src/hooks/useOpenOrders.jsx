import { useGetRequest } from './requests';

const useOpenOrders = () => {
  const { data, error, isLoading, mutate } = useGetRequest('/orders');

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

export default useOpenOrders;
