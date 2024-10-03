import { useDeleteRequest } from './requests';
import useSnackbar from './useSnackbar';

const useDeleteOrder = () => {
  const { trigger, data, error } = useDeleteRequest('/orders');
  const { openSnackbar, openErrorSnackbar } = useSnackbar();

  const deleteOrder = async (symbol, orderId) => {
    try {
      trigger({
        symbol,
        orderId
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
    deleteOrder,
  };
};

export default useDeleteOrder;
