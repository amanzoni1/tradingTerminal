import { ORDER_TYPE } from '../../constants';

const OrderType = ({ type, onChange }) => {
  return (
    <div className="blocco order">
      <div className="selection"> {type || 'type'} </div>
      <div className="option-amount">
        <button className="button-opt" onClick={() => onChange(ORDER_TYPE.MARKET)}>
          market
        </button>
        <button className="button-opt" onClick={() => onChange(ORDER_TYPE.LIMIT_UP)}>
          limitUP
        </button>
      </div>
      <div className="option-amount">
        <button className="button-opt" onClick={() => onChange(ORDER_TYPE.LIMIT)}>
          limit
        </button>
        <button className="button-opt" onClick={() => onChange(ORDER_TYPE.STOP)}>
          stop
        </button>
      </div>
    </div>
  );
};

export default OrderType;
