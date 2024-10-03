import React from 'react';
import useFearAndGreedIndex from '../../hooks/useFearAndGreedIndex';
import './FearAndGreedIndex.css';


const colors = [
  "#E74C3C",
  "#E67E22",
  "#F39C12",
  "#F1C40F", 
  "#D4AC0D", 
  "#C6BF22", 
  "#9BBE44", 
  "#79d23c", 
  "#3bcb3b", 
  "#3bcb3b"  
];

const getColorFromValue = (value) => {
  const numValue = parseInt(value);
  const index = Math.min(Math.floor(numValue / 10), colors.length - 1);
  return colors[index];
};

const FearAndGreedIndex = () => {
  const { data, loading, error } = useFearAndGreedIndex();

  if (loading || error) return null;

  const backgroundColor = getColorFromValue(data.value);

  return (
    <div className="fear-and-greed-container">
      <div className="circle" style={{ backgroundColor: backgroundColor, color: 'white' }}>
        {data.value}
      </div>
      <div style={{ color: backgroundColor }}>
        {data.classification}
      </div>
    </div>
  );
};

export default FearAndGreedIndex;
