import { usePostRequest } from './requests';
import useSnackbar from './useSnackbar';
import useBags from './useBags';

const useSellBags = () => {
  const { trigger, data, error } = usePostRequest('/position/spot');
  const { openSnackbar, openErrorSnackbar } = useSnackbar();
  const { refetch: refetchBags } = useBags();

  const sellBags = async (coin, contracts, reduction = 1) => {
    try {
      const type = 'market';
      const side = 'sell';
      const symbol = coin + '/USDT';

      trigger({
        symbol,
        type,
        side,
        contracts,
        reduction,
      });

      openSnackbar('Order has been closed successfully..');
      await refetchBags();
    } catch (error) {
      openErrorSnackbar(`Error: ${error.message}`);
    }
  };

  return {
    data,
    error,
    trigger,
    sellBags,
  };
};

export default useSellBags;