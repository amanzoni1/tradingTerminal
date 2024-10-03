import useMakeOrders from "../../hooks/useMakeOrders";

import useSnackbar from '../../hooks/useSnackbar';

const CreateOrder = ({ selectedSymbol, orderType, amount, limitPrice, stopPrice }) => {
  const { createLongOrder, createShortOrder } = useMakeOrders();
  const { openSnackbar, openErrorSnackbar } = useSnackbar();

  // Event handles
  // const handleLongClick = () => createLongOrder(selectedSymbol, orderType, amount, limitPrice, stopPrice);
  // const handleShortClick = () => createShortOrder(selectedSymbol, orderType, amount, limitPrice, stopPrice);

  // Event handles in show mode
  const handleLongClick = () => {
    openErrorSnackbar("Long order is not available without inserting an API key");
  };

  const handleShortClick = () => {
    openErrorSnackbar("Short order is not available without inserting an API key");
  };

  return (
    <>
      <div className="buttons">
        <button className="long" onClick={handleLongClick}>
          Long
        </button>
        <button className="short" onClick={handleShortClick}>
          Short
        </button>
      </div>
    </>
  );
};

export default CreateOrder;
