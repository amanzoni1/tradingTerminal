import { usePostRequest } from './requests';
import { ORDER_SIDE_CLOSE } from '../constants';
import useSnackbar from './useSnackbar';

function filterFalsyProperties(obj) {
  return Object.entries(obj)
    .filter(([key, value]) => !!value)
    .reduce((newObj, [key, value]) => ({ ...newObj, [key]: value }), {});
}

function useMakeOrders() {
  const { data, error, trigger, reset, isMutating } = usePostRequest('/orders');
  const { openSnackbar, openErrorSnackbar } = useSnackbar();

  const createLongOrder = async (symbol, type, amount, limitPrice, stopPrice) => {
    try {
      const order = await trigger(filterFalsyProperties({
        type: type.toUpperCase(),
        amount,
        //symbol: symbol.label,
        symbol: symbol.label.replace(/\//g, ''),
        side: ORDER_SIDE_CLOSE.BUY,
        price: limitPrice,
        stopPrice
      }));

      openSnackbar(`Order created successfully. Status: ${order.status}`);
    } catch (error) {
      openErrorSnackbar(`Error: ${error.message}`);
    }
  };

  const createShortOrder = async (symbol, type, amount, limitPrice, stopPrice) => {
    try {
      const order = await trigger(filterFalsyProperties({
        type: type.toUpperCase(),
        amount,
        //symbol: symbol.label,
        symbol: symbol.label.replace(/\//g, ''),
        side: ORDER_SIDE_CLOSE.SELL,
        price: limitPrice,
        stopPrice
      }));

      openSnackbar(`Order created successfully. Status: ${order.status}`);
    } catch (error) {
      openErrorSnackbar(`Error: ${error.message}`);
    }
  };

  return {
    createLongOrder,
    createShortOrder,
    data,
    error,
    isMutating,
    reset,
    trigger,
  };
}

export default useMakeOrders;
