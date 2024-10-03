const axios = require('axios');
const WebSocket = require('ws');
const crypto = require('crypto');
const querystring = require('querystring');
require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = 15;

const baseURL = 'https://fapi.binance.com';
const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;
const priceObj = {};
const infoObj = {};
let socket;
let socketSinglePrice;


// make everything start
async function loadFutureMarkets() {
  console.log('future markets have been started!');

  keepBinanceFutAlive();
  binSocket();
  setinfoObj();
  //optimalLeverage();
  setInterval(setinfoObj, 6 * 60 * 60 * 1000);
  setInterval(optimalLeverage, 12 * 60 * 60 * 1000);
}



// BACKGROUND SETTING PROPERTY

//keep sending ping
function keepBinanceFutAlive() {
  setInterval(() => {
    try {
      axios.get(`${baseURL}/fapi/v1/ping`);
    } catch (e) {
      console.log('Error sending ping request:', e);
    }
  }, 1000 * 20);
}

// Track real time price of the coin and save them in an obj, first price is the last
function binSocket() {

  if (socket) {
    socket.removeAllListeners('message');
    socket.removeAllListeners('close');
    socket.removeAllListeners('error');
    socket.close();
  }

  socket = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr');
  socket.on('message', (data) => {
    const dataArray = JSON.parse(data);
    dataArray.forEach((priceData) => {
      const symbol = priceData.s;
      const price = parseFloat(priceData.c);
      if (!priceObj.hasOwnProperty(symbol)) {
        priceObj[symbol] = { price: [price] };
      } else {
        priceObj[symbol].price = priceObj[symbol].price.length < 60 ? [price, ...priceObj[symbol].price] : [price, ...priceObj[symbol].price.slice(0, -1)];
      }
    });
  });
  socket.on('close', (code) => {
    console.log(`WebSocket connection closed with code ${code}`);
    setTimeout(() => binSocket(), 1000);
  });
  socket.on('error', (e) => {
    console.log('WebSocket connection error: ' + e);
  });
}



function setMarkPriceVariationStream(symbol) {
  const streamName = `${symbol.toLowerCase()}@markPrice@1s`;
  const wsUrl = `wss://fstream.binance.com/ws/${streamName}`;

  if (socketSinglePrice) {
    socketSinglePrice.removeAllListeners('message');
    socketSinglePrice.removeAllListeners('close');
    socketSinglePrice.removeAllListeners('error');
    socketSinglePrice.close();
  }

  socketSinglePrice = new WebSocket(wsUrl);

  // Ensure priceObj is initialized and has the initial price
  if (!priceObj[symbol] || priceObj[symbol].price.length === 0) {
    console.error(`Initial price for ${symbol} not found.`);
    return;
  }

  const initialPrice = parseFloat(priceObj[symbol].price[0]);

  socketSinglePrice.on('message', (data) => {
    const priceData = JSON.parse(data);
    const newPrice = parseFloat(priceData.p);
    
    const priceVariation = (((newPrice - initialPrice) / initialPrice) * 100).toFixed(2);
    console.log(`Price: ${newPrice}, Initial Price: ${initialPrice}, Price variation for ${symbol}: ${priceVariation}%`);
  });

  socketSinglePrice.on('close', (code) => {
    console.log(`WebSocket connection closed with code ${code}`);
    setTimeout(() => setMarkPriceVariationStream(symbol), 1000);
  });

  socketSinglePrice.on('error', (e) => {
    console.log('WebSocket connection error: ' + e);
  });
}




//Create an object with the orders filters
async function setinfoObj() {
  try {
    const response = await axios.get(`${baseURL}/fapi/v1/exchangeInfo`);
    const tradingSymbols = response.data.symbols.filter((e) => e.status === "TRADING");
    tradingSymbols.forEach((symbol) => { infoObj[symbol.symbol] = symbol.filters });
    return infoObj;
  } catch (e) {
    console.error("Error fetching exchange info:", e);
    return e;
  }
}


//Optimal leverage for all symbol
async function optimalLeverage() {
  try {
    const accountMarginBalanceTot = await getMarginBalance();
    const accountMarginBalance = accountMarginBalanceTot.marginBalance;
    const response = await axios.get(`${baseURL}/fapi/v1/exchangeInfo`);
    const symbolsArr = response.data.symbols.filter(e => e.status === 'TRADING').map(e => e.symbol);

    for (let i = 0; i < symbolsArr.length; i++) {
      const symbol = symbolsArr[i];
      const timestamp = Date.now();
      const url = 'https://fapi.binance.com/fapi/v1/leverageBracket';
      const params = { timestamp, symbol };
      const signature = generateSignature(params);
      const config = {
        headers: { 'X-MBX-APIKEY': apiKey },
        params: { ...params, signature },
      };

      const response = await axios.get(url, config);
      const leverageOptions1 = response.data;
      const leverageOptions = leverageOptions1[0].brackets;

      const result = leverageOptions.reduce((acc, bracket) => {
        const notionalCap = parseFloat(bracket.notionalCap);
        const maxLeverage = parseFloat(bracket.initialLeverage);
        const currentMaxPosition = (accountMarginBalance * maxLeverage) > notionalCap ? notionalCap : (accountMarginBalance * maxLeverage);

        if (currentMaxPosition > acc.maxPosition) {
          return { maxLeverage, maxPosition: currentMaxPosition };
        } else {
          return acc;
        }
      }, { maxLeverage: 0, maxPosition: 0 });

      const maxL = result.maxLeverage;
      await setLeverage(symbol, maxL);
    }
  } catch (e) {
    console.log('optimal lev: ' + e);
    return e;
  }
}

//Set the optimal leverage for any coins
async function setLeverage(symbol, leverage) {
  try {
    const timestamp = Date.now();
    const params = { timestamp, symbol, leverage };
    const signature = generateSignature(params);
    const config = {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    };

    const response = await axios.post(`${baseURL}/fapi/v1/leverage`, null, config);
    //console.log(`Successfully set leverage for ${symbol}`);
  } catch (e) {
    console.log(`Failed to set leverage for ${symbol}`);
    return e;
  }
}










// GENERAL FUNCTIONS

//Generate signature when needed
function generateSignature(params) {
  try {
    const queryString = Object.keys(params)
      .map((key) => {
        if (key === 'orderIdList') {
          return `${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
        } else {
          return `${key}=${params[key]}`;
        }
      })
      .join('&');

    const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
    return signature;
  } catch (e) {
    console.error('Error generating signature:', e);
    return e;
  }
}

//Get all symbols
async function getAllFutureSymbols() {
  try {
    const response = await axios.get(`${baseURL}/fapi/v1/exchangeInfo`);
    const symbols = response.data.symbols
      .filter(e => e.status === 'TRADING' && (e.symbol.endsWith('USDT') || e.symbol.endsWith('BUSD')))
      .map(e => e.symbol);

    const modifiedSymbols = symbols.map(e => {
      if (e.endsWith('USDT')) {
        return e.slice(0, -4) + '/' + 'USDT';
      } else if (e.endsWith('BUSD')) {
        return e.slice(0, -4) + '/' + 'BUSD';
      } else {
        return e;
      }
    });

    const renderSymbols = modifiedSymbols.map(e => ({ label: e, value: e }));
    return renderSymbols;
  } catch (e) {
    console.error('Error get all future symbols:', e);
    return e;
  }
}

//Get available margin
async function getMarginBalance() {
  try {
    const timestamp = Date.now();
    const url = `${baseURL}/fapi/v2/account`;
    const params = { timestamp };
    const signature = generateSignature(params);
    const config = {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    };

    const response = await axios.get(url, config);
    const accountData = response.data;
    //const marginBalance = accountData.assets.find(asset => asset.asset === 'USDT').crossWalletBalance;
    const marginBalance = accountData.totalMarginBalance;
    const totalInitialMargin = accountData.totalInitialMargin;
    const pnl = accountData.totalUnrealizedProfit;

    //console.log('Margin Balance Available:', marginBalance);
    //console.log('Current PNL:', pnl);

    return { marginBalance, pnl, totalInitialMargin };
  } catch (e) {
    console.error('Error getting margin balance:', e.constructor.name, e.message);
    return e;
  }
}













// FETCH DELLE VARIE POSIZIONI E ORDINI

//Get all open positions
async function getOpenPositions() {
  try {
    const timestamp = Date.now();
    const url = `${baseURL}/fapi/v2/positionRisk`;
    const params = { timestamp };
    const signature = generateSignature(params);
    const config = {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    };

    const response = await axios.get(url, config);
    const positions = response.data.filter(position => position.notional !== '0');
    return positions;
  } catch (e) {
    console.log('Error getting open positions:', e.constructor.name, e.message);
    return e.message
  }
}

//Get all open orders or a specific symbol if given
async function getOpenOrders(symbol) {
  const timestamp = Date.now();
  const url = `${baseURL}/fapi/v1/openOrders`;
  const params = { timestamp };
  if (symbol) { params.symbol = symbol }
  const signature = generateSignature(params);
  const config = {
    headers: { 'X-MBX-APIKEY': apiKey },
    params: { ...params, signature },
  };

  try {
    const response = await axios.get(url, config);
    return response.data;
  } catch (e) {
    console.error('Error getting open orders:', e);
    return e;
  }
}

// query the status of a specific order
async function queryOrders(symbol, orderId) {
  const timestamp = Date.now();
  const url = `${baseURL}/fapi/v1/order`;
  const params = { timestamp, symbol, orderId };
  const signature = generateSignature(params);
  const config = {
    headers: { 'X-MBX-APIKEY': apiKey },
    params: { ...params, signature },
  };

  try {
    const response = await axios.get(url, config);
    return response.data;
  } catch (e) {
    console.error('Error querying orders:', e);
    return e;
  }
}

//Delete an open order
async function deleteOrder(orderParams) {
  const { symbol, orderId } = orderParams;
  const timestamp = Date.now();
  const url = `${baseURL}/fapi/v1/order`;
  const params = { timestamp, symbol, orderId };
  const signature = generateSignature(params);
  const config = {
    headers: { 'X-MBX-APIKEY': apiKey },
    params: { ...params, signature },
  };

  try {
    const response = await axios.delete(url, config);
    return response.data;
  } catch (e) {
    console.error('Error deleting the order:', e.response.data);
    return e;
  }
}















// CREARE E CHIUDERE ORDINI

//create orders
async function createOrder(orderParams) {
  const preparedParams = await prepareOrderParams(orderParams);
  const url = `${baseURL}/fapi/v1/order`;
  const signature = generateSignature(preparedParams);
  const config = {
    headers: { 'X-MBX-APIKEY': apiKey },
    params: { ...preparedParams, signature },
  };

  try {
    const response = await axios.post(url, null, config);
    const order = await queryOrders(response.data.symbol, response.data.orderId);

    if ((orderParams.type === 'LIMITUP' || orderParams.type === 'MARKET') && !orderParams.isClosingPosition) {
      const stopMarketOrderParams = {
        symbol: orderParams.symbol,
        type: 'STOP',
        side: orderParams.side === 'BUY' ? 'SELL' : 'BUY',
        quantity: order.executedQty,
        stopPrice: orderParams.side === 'BUY' ? parseFloat(order.avgPrice * 0.99) : parseFloat(order.avgPrice * 1.01),
      };
      await createOrder(stopMarketOrderParams);
    }

    return response.data;
  } catch (e) {
    console.log('Error creating the order:', e.constructor.name, e.message, e.response.data);
    return e.message
  }
}

// Close or reduce open Positions and adj SL
async function closePosition(orderParams) {
  const { symbol, type, sideClose, contracts, reduction } = orderParams;
  const rawQuantity = contracts * reduction;
  const params = { symbol, type, side: sideClose, quantity: rawQuantity };

  try {
    const closedPosition = await createOrder({ ...params, isClosingPosition: true });
    const orders = await getOpenOrders(symbol);
    const stopMarketOrders = orders.filter(order => order.type === 'STOP_MARKET' && order.side === sideClose);

    let newQuantity = 0;
    let totalWeightedPrice = 0;

    stopMarketOrders.forEach(order => {
      const remainingQuantity = order.origQty - order.executedQty;
      newQuantity += remainingQuantity;
      totalWeightedPrice += order.stopPrice * remainingQuantity;
    });

    let weightedStopPrice = 0;
    if (newQuantity > 0) {
      weightedStopPrice = totalWeightedPrice / newQuantity;
    }

    const newOrderParams = {
      symbol: symbol,
      type: 'STOP',
      side: sideClose,
      quantity: newQuantity - (newQuantity * reduction),
      stopPrice: weightedStopPrice,
    };

    if (stopMarketOrders.length > 0) { await closeMultipleOrders(stopMarketOrders) }
    if (reduction !== 1) { await createOrder(newOrderParams) }

    return closedPosition;
  } catch (e) {
    console.log('Error closing the position:', e.message);
    return e.message
  }
}

// Close multiple orders
async function closeMultipleOrders(orders) {
  const timestamp = Date.now();
  const symbol = orders[0].symbol;
  const orderIdList = orders.map(order => order.orderId);
  const params = { symbol, timestamp, orderIdList };
  const url = `${baseURL}/fapi/v1/batchOrders`;
  const signature = generateSignature(params);
  const config = {
    headers: {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  const data = querystring.stringify({ ...params, signature, orderIdList: JSON.stringify(orderIdList) });

  try {
    const response = await axios.delete(url, { ...config, data });
    return response.data;
  } catch (e) {
    console.error('Error closing multiple positions:', e);
    return e;
  }
}











// SETTING PARAMETRI E FILTRI

// set the right params for any kind of orders
async function prepareOrderParams(orderParams) {
  const { symbol, type } = orderParams;
  const priceNow = priceObj[symbol]?.price[0];
  const pricePre = priceObj[symbol]?.price[10];
  const symbolFilters = infoObj[symbol];
  const timestamp = Date.now();
  const params = { timestamp, symbol, ...orderParams };

  switch (type) {
    case 'MARKET':
      setMarketOrderParams(params, priceNow, symbolFilters);
      break;
    case 'LIMIT':
      setLimitOrderParams(params, symbolFilters);
      break;
    case 'LIMITUP':
      setLimitUpOrderParams(params, pricePre, symbolFilters);
      break;
    case 'STOP':
      setStopOrderParams(params, symbolFilters);
      break;
    default:
      console.error(`Invalid order type: ${type}`);
      return { error: true, message: `Invalid order type: ${type}` };
  }

  return params;
}

//function for setting specific params for any type order
function setMarketOrderParams(params, priceNow, symbolFilters) {
  params.type = 'MARKET';
  const { formattedQuantity } = formatMarketQuantity(params.quantity ? params.quantity : params.amount / priceNow, symbolFilters);
  params.quantity = formattedQuantity;

  if ('price' in params || 'stopPrice' in params) {
    if ('price' in params) {
      delete params.price;
    }
    if ('stopPrice' in params) {
      delete params.stopPrice;
    }
  }
}

function setLimitOrderParams(params, symbolFilters) {
  params.type = 'LIMIT';
  const formattedPrice = formatPrice(params.price, symbolFilters);
  const { formattedQuantity } = formatQuantity(params.quantity ? params.quantity : params.amount / params.price, symbolFilters);
  params.price = formattedPrice;
  params.quantity = formattedQuantity;
  params.timeInForce = 'GTC';

  if ('stopPrice' in params) {
    delete params.stopPrice;
  }
}

function setLimitUpOrderParams(params, pricePre, symbolFilters) {
  params.type = 'LIMIT';
  const targetPrice = params.side === 'BUY' ? (pricePre * 1.03) : (pricePre * 0.97);
  const formattedPrice = formatPrice(targetPrice, symbolFilters);
  const { formattedQuantity } = formatQuantity(params.quantity ? params.quantity : params.amount / pricePre, symbolFilters);
  params.price = formattedPrice;
  params.quantity = formattedQuantity;
  params.timeInForce = 'IOC';

  if ('stopPrice' in params) {
    delete params.stopPrice;
  }
}

function setStopOrderParams(params, symbolFilters) {
  if (params.price) {
    const formattedPrice = formatPrice(params.price, symbolFilters);
    const formattedStopPrice = formatPrice(params.stopPrice, symbolFilters);
    const { formattedQuantity } = formatQuantity(params.quantity ? params.quantity : params.amount / params.price, symbolFilters);
    params.type = 'STOP';
    params.price = formattedPrice;
    params.stopPrice = formattedStopPrice;
    params.quantity = formattedQuantity;
  } else {
    const formattedStopPrice = formatPrice(params.stopPrice, symbolFilters);
    const { formattedQuantity } = formatQuantity(params.quantity ? params.quantity : params.amount / params.stopPrice, symbolFilters);
    params.type = 'STOP_MARKET';
    params.stopPrice = formattedStopPrice;
    params.quantity = formattedQuantity;
  }
}

// set a price in line with filters
function formatPrice(price, symbolFilters) {
  const priceFilter = symbolFilters.find((filter) => filter.filterType === "PRICE_FILTER");

  if (!priceFilter) {
    console.error("PRICE_FILTER not found for this symbol.");
    return price;
  }

  const { minPrice, maxPrice, tickSize } = priceFilter;
  const priceNumber = parseFloat(price);
  const tickSizeNumber = parseFloat(tickSize);

  if (tickSizeNumber === 0) { return price; }

  const adjustedPrice = Math.round((priceNumber - parseFloat(minPrice)) / tickSizeNumber) * tickSizeNumber + parseFloat(minPrice);
  const formattedPrice = adjustedPrice.toFixed((tickSize.split('.')[1] || []).length);

  return formattedPrice;
}

// set a qty in line with filters
function formatQuantity(quantity, symbolFilters) {
  const lotSizeFilter = symbolFilters.find((filter) => filter.filterType === "LOT_SIZE");

  if (!lotSizeFilter) {
    console.error("LOT_SIZE filter not found for this symbol.");
    return { formattedQuantity: quantity, ordersRequired: 1 };
  }

  const { minQty, maxQty, stepSize } = lotSizeFilter;
  const quantityNumber = parseFloat(quantity);
  const stepSizeNumber = parseFloat(stepSize);
  const maxQtyNumber = parseFloat(maxQty);

  if (stepSizeNumber === 0) { return { formattedQuantity: quantity, ordersRequired: 1 }; }

  let ordersRequired = 1;
  let adjustedQuantity;

  if (quantityNumber > maxQtyNumber) {
    ordersRequired = Math.ceil(quantityNumber / maxQtyNumber);
    adjustedQuantity = maxQtyNumber;
  } else {
    adjustedQuantity = Math.round((quantityNumber - parseFloat(minQty)) / stepSizeNumber) * stepSizeNumber + parseFloat(minQty);
  }
  const formattedQuantity = adjustedQuantity.toFixed((stepSize.split('.')[1] || []).length);

  return { formattedQuantity, ordersRequired };
}

// set a qty in line with filters with markets orders
function formatMarketQuantity(quantity, symbolFilters) {
  const marketLotSizeFilter = symbolFilters.find((filter) => filter.filterType === "MARKET_LOT_SIZE");

  if (!marketLotSizeFilter) {
    console.error("MARKET_LOT_SIZE filter not found for this symbol.");
    return { formattedQuantity: quantity, ordersRequired: 1 };
  }

  const { minQty, maxQty, stepSize } = marketLotSizeFilter;
  const quantityNumber = parseFloat(quantity);
  const stepSizeNumber = parseFloat(stepSize);
  const maxQtyNumber = parseFloat(maxQty);

  if (stepSizeNumber === 0) { return { formattedQuantity: quantity, ordersRequired: 1 }; }

  let ordersRequired = 1;
  let adjustedQuantity;

  if (quantityNumber > maxQtyNumber) {
    ordersRequired = Math.ceil(quantityNumber / maxQtyNumber);
    adjustedQuantity = maxQtyNumber;
  } else {
    adjustedQuantity = Math.round((quantityNumber - parseFloat(minQty)) / stepSizeNumber) * stepSizeNumber + parseFloat(minQty);
  }
  const formattedQuantity = adjustedQuantity.toFixed((stepSize.split('.')[1] || []).length);

  return { formattedQuantity, ordersRequired };
}







module.exports = {
  loadFutureMarkets,
  getAllFutureSymbols,
  getMarginBalance,
  createOrder,
  getOpenPositions,
  getOpenOrders,
  closePosition,
  deleteOrder,
  setMarkPriceVariationStream
};




