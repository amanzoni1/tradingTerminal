import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import useChartHistory from '../../hooks/useChartHystory';
import useChartUpdates from '../../hooks/useChartUpdates';
//import useChartPositions from '../../hooks/useChartPositions';
//import useChartOrders from '../../hooks/useChartOrders';
import Switcher from '../Switcher/switcher'
import FearAndGreedIndex from '../FearAndGreedIndex/FearAndGreedIndex';
import './chart.css';

const ChartComponent = ({ selectedSymbol }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  //const priceLinesRef = useRef({ positionLine: null, orderLines: [] });
  const [interval, setInterval] = useState('1m');
  const { chartData } = useChartHistory(selectedSymbol, interval);
  const { candle, volume } = useChartUpdates(selectedSymbol, interval);
  //const { positionLine } = useChartPositions(selectedSymbol);
  //const orderLines = useChartOrders(selectedSymbol);

  const newChartDataCandle = useCallback(() => {
    return chartData.map((cart) => ({
      time: cart[0] / 1000,
      open: Number(cart[1]),
      high: Number(cart[2]),
      low: Number(cart[3]),
      close: Number(cart[4]),
    }));
  }, [chartData]);

  const newVolData = useCallback(() => {
    return chartData.map((cart) => ({
      time: cart[0] / 1000,
      value: Number(cart[7]),
    }));
  }, [chartData]);

  // Initialize and update the chart
  useEffect(() => {
    if (!chartData || chartData.length === 0) return;

    // Clean up existing chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Create a new chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#808080',
        lineColor: '#29f1ff',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        rightBarStaysOnScroll: true,
        fixLeftEdge: true,
      },
      crosshair: {
        mode: 0,
        vertLine: { labelBackgroundColor: 'rgb(29, 29, 29)' },
        horzLine: { labelBackgroundColor: 'rgb(29, 29, 29)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 510,
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#29f1ff',
      downColor: '#808080',
      wickUpColor: '#29f1ff',
      wickDownColor: '#808080',
      borderUpColor: '#29f1ff',
      borderDownColor: '#808080',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: 'rgb(69, 69, 69)',
      lineWidth: 2,
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeriesRef.current = volumeSeries;

    // Set initial data
    const data = newChartDataCandle();
    candlestickSeries.setData(data);
    const volData = newVolData();
    volumeSeries.setData(volData);

    // Apply precision and minMove calculations
    if (data.length > 0) {
      const firstPrice = data[0].open;

      const precision =
        firstPrice >= 100
          ? 2
          : firstPrice >= 10
          ? 3
          : firstPrice >= 1
          ? 4
          : firstPrice >= 0.1
          ? 5
          : 6;

      const minMove =
        firstPrice >= 100
          ? 0.01
          : firstPrice >= 10
          ? 0.001
          : firstPrice >= 1
          ? 0.0001
          : firstPrice >= 0.1
          ? 0.00001
          : 0.000001;

      candlestickSeries.applyOptions({
        priceFormat: {
          precision: precision,
          minMove: minMove,
        },
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      });
    }

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    // Handle resize
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [chartData, interval, selectedSymbol, newChartDataCandle, newVolData]);

  // Update chart with live data
  useEffect(() => {
    if (candlestickSeriesRef.current && candle) {
      candlestickSeriesRef.current.update(candle);
    }
    if (volumeSeriesRef.current && volume) {
      volumeSeriesRef.current.update(volume);
    }
  }, [candle, volume]);

  //Update price lines
  // useEffect(() => {
  //   if (candlestickSeriesRef.current) {
  //     // Remove existing position line
  //     if (priceLinesRef.current.positionLine) {
  //       candlestickSeriesRef.current.removePriceLine(priceLinesRef.current.positionLine);
  //     }
  
  //     // Add new position line
  //     if (positionLine) {
  //       const newPositionLine = candlestickSeriesRef.current.createPriceLine(positionLine);
  //       priceLinesRef.current.positionLine = newPositionLine;
  //     } else {
  //       priceLinesRef.current.positionLine = null;
  //     }
  
  //     // Remove existing order lines
  //     if (priceLinesRef.current.orderLines.length > 0) {
  //       priceLinesRef.current.orderLines.forEach((line) =>
  //         candlestickSeriesRef.current.removePriceLine(line)
  //       );
  //     }
  
  //     // Add new order lines
  //     const newOrderLines = orderLines.map((orderLine) =>
  //       candlestickSeriesRef.current.createPriceLine(orderLine)
  //     );
  //     priceLinesRef.current.orderLines = newOrderLines;
  //   }
  // }, [positionLine, orderLines, candlestickSeriesRef.current]);

  return (
    <div className="main-graph-component">
      <Switcher interval={interval} setInterval={setInterval} selectedSymbol={selectedSymbol} />
      <FearAndGreedIndex />
      <div ref={chartContainerRef} className="tv-lightweight-charts" />
      <div className="tv-lightweight-charts-volume" />
    </div>
  );
};

export default ChartComponent;