import React from 'react';
import usePositions from '../../hooks/usePositions';
import useBags from '../../hooks/useBags';


const ReLoader = () => {
  const { refetch: refetchPositions } = usePositions();
  const { refetch: refetchBags } = useBags();
  const reLoad = () => {refetchPositions(); refetchBags()}

  return (
    <button 
        className="refetch-button" 
        onClick={() => reLoad()}
    >
      &#8634;
    </button>
  );
};

export default ReLoader;

