import { useGetRequest } from './requests';

const useFutureSymbols = () => {
  const { data, error, isLoading } = useGetRequest('/markets/future');

  return {
    data,
    error,
    isLoading,
  };
};

export default useFutureSymbols;
