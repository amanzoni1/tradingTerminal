import { useState, useEffect, useMemo } from 'react';
import usePositions from './usePositions';

const useChartPositions = (selectedSymbol) => {
  const { data: positions = [] } = usePositions();
  const [positionLine, setPositionLine] = useState(null);

  // Memoize 'symbol' to prevent unnecessary recalculations
  const symbol = useMemo(() => selectedSymbol?.label.replace(/\//g, ''), [selectedSymbol]);

  // Memoize 'positionN' to prevent unnecessary changes
  const positionN = useMemo(() => {
    if (!selectedSymbol || positions.length === 0) return null;
    return positions.find((e) => e.symbol === symbol);
  }, [positions, symbol, selectedSymbol]);

  useEffect(() => {
    if (positionN) {
      const newPositionLine = {
        price: Number(positionN.entryPrice),
        color: Number(positionN.positionAmt) > 0 ? 'rgb(14, 203, 129)' : 'rgb(246, 70, 93)',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
      };

      setPositionLine((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newPositionLine)) {
          return newPositionLine;
        }
        return prev;
      });
    } else {
      setPositionLine((prev) => (prev !== null ? null : prev));
    }
  }, [positionN]);

  return { positionLine };
};

export default useChartPositions;