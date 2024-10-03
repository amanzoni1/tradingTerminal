import { useGetRequest } from './requests';

const useSymbols = () => {
  const { data, error, isLoading } = useGetRequest('/markets/spot');

  return {
    data,
    error,
    isLoading,
  };
};

export default useSymbols;
