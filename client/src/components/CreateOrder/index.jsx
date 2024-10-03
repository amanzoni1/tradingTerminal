import useMakeOrders from "../../hooks/useMakeOrders";

const CreateOrder = ({ selectedSymbol, orderType, amount, limitPrice, stopPrice }) => {
  const { createLongOrder, createShortOrder } = useMakeOrders();

  // Event handles
  const handleLongClick = () => createLongOrder(selectedSymbol, orderType, amount, limitPrice, stopPrice);
  const handleShortClick = () => createShortOrder(selectedSymbol, orderType, amount, limitPrice, stopPrice);

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
