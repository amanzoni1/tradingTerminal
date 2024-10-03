import { useMemo } from 'react';
import useOpenOrders from './useOpenOrders';

const useChartOrders = (selectedSymbol) => {
  const { data: orders = [] } = useOpenOrders();

  const symbol = useMemo(() => selectedSymbol?.label.replace(/\//g, ''), [selectedSymbol]);

  const orderLines = useMemo(() => {
    if (selectedSymbol) {
      const symbolOrders = orders.filter((e) => e.symbol === symbol);

      return symbolOrders.map((order) => {
        const price =
          Number(order.stopPrice) !== 0 ? Number(order.stopPrice) : Number(order.price);
        return {
          price: price,
          color: order.side === 'BUY' ? 'rgb(14, 203, 129)' : 'rgb(246, 70, 93)',
          lineWidth: 1,
          lineStyle: Number(order.stopPrice) !== 0 ? 3 : 1,
          axisLabelVisible: true,
        };
      });
    } else {
      return [];
    }
  }, [selectedSymbol, orders, symbol]);

  return orderLines;
};

export default useChartOrders;