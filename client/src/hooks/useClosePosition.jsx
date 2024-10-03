import { usePostRequest } from './requests';
import { ORDER_SIDE, ORDER_SIDE_CLOSE } from '../constants';
import useSnackbar from './useSnackbar';

const useClosePosition = () => {
  const { trigger, data, error } = usePostRequest('/position/future');
  const { openSnackbar, openErrorSnackbar } = useSnackbar();

  const closePosition = async (symbol, positionAmt, reduction = 1) => {
    try {
      const type = 'MARKET';
      const side = positionAmt > 0 ? 'LONG' : 'SHORT';
      const contracts = Math.abs(positionAmt);
      const sideClose = side === ORDER_SIDE.LONG ? ORDER_SIDE_CLOSE.SELL : ORDER_SIDE_CLOSE.BUY;

      trigger({
        symbol,
        contracts,
        type,
        sideClose,
        reduction,
      });

      openSnackbar('Order has been closed successfully..');
    } catch (error) {
      openErrorSnackbar(`Error: ${error.message}`);
    }
  };

  return {
    data,
    error,
    trigger,
    closePosition,
  };
};

export default useClosePosition;
