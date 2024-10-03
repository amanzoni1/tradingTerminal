import { useState } from 'react';
import './tabs.css';
import Positions from '../Positions/positions';
import Orders from '../Orders/orders';
import Bags from '../Bags/bags';
import usePositions from '../../hooks/usePositions';
import useOpenOrders from '../../hooks/useOpenOrders';
import useBags from '../../hooks/useBags';


const tabNames = {
  Positions: 'Positions',
  Orders: 'Orders',
  Bags: 'Bags',
};

const Tabs = () => {
  const [tabName, setTabName] = useState('Positions');
  const { data: positions } = usePositions();
  const { data: orders } = useOpenOrders();
  const { data: bags } = useBags();

  const handleTabChange = (event) => setTabName(event.target.value);

  return (
    <div className="tab">
      <div className='container-leg'>
        <button
          className={`tab-button ${tabName === tabNames.Positions ? 'active1' : ''}`}
          value={tabNames.Positions}
          onClick={handleTabChange}
        >
          Positions ({positions?.length})
        </button>
        <button
          className={`tab-button ${tabName === tabNames.Bags ? 'active1' : ''}`}
          value={tabNames.Bags}
          onClick={handleTabChange}
        >
          Bags ({bags?.length})
        </button>
        <button
          className={`tab-button ${tabName === tabNames.Orders ? 'active1' : ''}`}
          value={tabNames.Orders}
          onClick={handleTabChange}
        >
          Orders ({orders?.length})
        </button>
      </div>
      <div className="content">
        {tabName === tabNames.Positions && <Positions />}
        {tabName === tabNames.Bags && <Bags />}
        {tabName === tabNames.Orders && <Orders />}
      </div>
    </div>
  );
};

export default Tabs;
