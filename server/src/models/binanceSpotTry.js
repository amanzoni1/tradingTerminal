const axios = require('axios');
const WebSocket = require('ws');
const crypto = require('crypto');
//const querystring = require('querystring');
require('dotenv').config();

const baseURL = 'https://api.binance.com';
const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;
const priceObj = {};
const infoObj = {};




// make everything start
async function loadSpotMarkets() { 
  console.log('spot markets have been started!');
  
  keepBinanceSpotAlive();
  spotSocket();
  setSpotInfoObj();
  setInterval(setSpotInfoObj, 6 * 60 * 60 * 1000);
}

//loadSpotMarkets()



// BACKGROUND SETTING PROPERTY

//keep sending ping
function keepBinanceSpotAlive() {
  setInterval(() => {
    try {
      axios.get(`${baseURL}/api/v3/ping`);
    } catch (e) {
      console.log('Error sending ping request:', e);
    }
  }, 1000 * 20);
}

// Track real time price of the coin and save them in an obj, first price is the last
function spotSocket() {
  const socket = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
  socket.on('message', (data) => {
    const dataArray = JSON.parse(data);
    dataArray.forEach((priceData) => {
      const symbol = priceData.s;
      const price = parseFloat(priceData.c);
      if (symbol.endsWith('USDT') || symbol.endsWith('BUSD')) {
        if (!priceObj.hasOwnProperty(symbol)) {
          priceObj[symbol] = { price: [price] };
        } else {
          priceObj[symbol].price = priceObj[symbol].price.length < 20 ? [price, ...priceObj[symbol].price] : [price, ...priceObj[symbol].price.slice(0, -1)];
        }
      }
    });
  });
  socket.on('close', (code) => {
    console.log(`WebSocket connection closed with code ${code}`);
    setTimeout(() => spotSocket(), 1000);
  });
  socket.on('error', (e) => {
    console.log('WebSocket connection error: ' + e);
    setTimeout(() => spotSocket(), 1000);
  });
}

//Create an object with the orders filters
async function setSpotInfoObj() {
  try {
    const response = await axios.get(`${baseURL}/api/v3/exchangeInfo`);
    const tradingSymbols = response.data.symbols.filter((e) => e.status === "TRADING" && (e.symbol.endsWith('USDT') || e.symbol.endsWith('BUSD')));
    tradingSymbols.forEach((symbol) => { infoObj[symbol.symbol] = symbol.filters });
    return infoObj;
  } catch (e) {
    console.error("Error fetching exchange info:", e);
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
async function getAllSymbols() {
  try {
    const response = await axios.get(`${baseURL}/api/v3/exchangeInfo`);
    const symbols = response.data.symbols
      .filter(e => e.status === 'TRADING' && e.permissions.includes('SPOT') && (e.symbol.endsWith('USDT') || e.symbol.endsWith('BUSD')))
      .map(e => e.symbol);

    const responseF = await axios.get(`https://fapi.binance.com/fapi/v1/exchangeInfo`);
    const futSymbols = responseF.data.symbols
      .filter(e => e.status === 'TRADING' && (e.symbol.endsWith('USDT') || e.symbol.endsWith('BUSD')))
      .map(e => e.symbol);

    const complete = symbols.reduce(
      (acc, item) => {
        return acc.includes(item) ? acc : [...acc, item];
      }, [...futSymbols]
    );

    const modifiedSymbols = complete.map(e => {
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
    console.error('getAllSymbols: ' + e);
    return e;
  }
}

//Get the spot symbols available for trading
async function getTradingSymbol(rawSymbol) {
  try {
    const response = await axios.get(`${baseURL}/api/v3/exchangeInfo`);
    const symbols = response.data.symbols
      .filter(e => e.status === 'TRADING' && e.permissions.includes('SPOT') && (e.symbol.endsWith('USDT') || e.symbol.endsWith('BUSD')))
      .map(e => e.symbol);

    if (symbols.includes(rawSymbol + 'USDT')) {
      return rawSymbol + 'USDT';
    } 

    else if (symbols.includes(rawSymbol + 'BUSD')) {
      return rawSymbol + 'BUSD';
    } 

    else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting trading symbol: ${error}`);
    return null;
  }
}

//get available fund
async function getNonZeroSpotBalances() {
  try {
    const timestamp = Date.now();
    const url = `${baseURL}/api/v3/account`;
    const params = { timestamp };
    const signature = generateSignature(params);
    const config = {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    };

    const response = await axios.get(url, config);
    const accountData = response.data;
    const nonZeroSpotBalances = accountData.balances
      .map(asset => ({
        asset: asset.asset,
        free: parseFloat(asset.free),
        locked: parseFloat(asset.locked),
        total: parseFloat(asset.free) + parseFloat(asset.locked)
      }))
      .filter(asset => asset.total > 0);

    const totalValue = nonZeroSpotBalances
      .map(asset => {
        let price = 1; // Default to 1 in case there's no price for the asset
        const assetPriceData = priceObj[`${asset.asset}USDT`] || priceObj[`${asset.asset}BUSD`];
        if (assetPriceData) {
          price = assetPriceData.price[0];
        }
        return asset.total * price;
      })
      .reduce((a, b) => a + b, 0);

    //console.log('Non-zero Spot Balances:', nonZeroSpotBalances);
    //console.log('Total value of assets:', totalValue);
    return { nonZeroSpotBalances, totalValue };
  } catch (e) {
    console.error(e);
    return e;
  }
}

// USDT disponibili in spot
async function getSpotBalance() {
  try {
    const timestamp = Date.now();
    const url = `${baseURL}/api/v3/account`;
    const params = { timestamp };
    const signature = generateSignature(params);
    const config = {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    };

    const response = await axios.get(url, config);
    const accountData = response.data;
    const spotBalance = accountData.balances.find(asset => asset.asset === 'USDT').free;
    //console.log('Spot Balance Available:', spotBalance);
    return spotBalance;
  } catch (e) {
    console.error(e);
    return e;
  }
}

// transfer the found from future to spot account
async function transferFunds(asset, amount) {
  let balance;
  
  try {
    balance = await getMarginBalance();
    balance = parseFloat(balance);
  } catch (e) {
    console.log('Fetch balance failed', e.constructor.name, e.message);
    return e;
  }

  const timestamp = Date.now();
  const transferUrl = `${baseURL}/sapi/v1/futures/transfer`;
  const transferAmount = Math.min(amount, balance);
  const transferParams = {
    asset,
    amount: transferAmount,
    type: 2,
    timestamp  
  };

  const transferSignature = generateSignature(transferParams);
  const transferConfig = {
    headers: { 'X-MBX-APIKEY': apiKey },
    params: { ...transferParams, signature: transferSignature },
  };

  try {
    await axios.post(transferUrl, null, transferConfig);
  } catch (e) {
    console.log('Transfer failed', e.constructor.name, e.message, e.response.data);
    return e;
  }
  return transferAmount; 
}

//Get future available margin
async function getMarginBalance() {
  try {
    const timestamp = Date.now();
    const url = `https://fapi.binance.com/fapi/v2/account`;
    const params = { timestamp };
    const signature = generateSignature(params);
    const config = {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...params, signature },
    };

    const response = await axios.get(url, config);
    const accountData = response.data;
    const marginBalance = accountData.assets.find(asset => asset.asset === 'USDT').crossWalletBalance;
  
    return marginBalance;
  } catch (e) {
    console.error(e);
    return e;
  }
}

// change fund from USDT to BUSD
async function exchangeToBUSD(amountUSDT) {
  const orderParams = {
    symbol: 'BUSDUSDT',
    side: 'BUY',
    type: 'MARKET',
    amount: amountUSDT,
  };

  try {
    const order = await createSpotOrder(orderParams);
    const convertedAmount = parseFloat(order.executedQty);

    return convertedAmount;
  } catch (e) {
    console.log(e.constructor.name, e.message);
    return e.message;
  }
}







// FETCH DELLE POSIZIONI APERTE

//Get all open bags
async function getOpenBags() {
  try {
    const { nonZeroSpotBalances } = await getNonZeroSpotBalances();
    const openBags = nonZeroSpotBalances
      .filter(asset => {
        const symbolUSDT = asset.asset === 'USDT' ? asset.asset : asset.asset + 'USDT';
        const symbolBUSD = asset.asset === 'BUSD' ? asset.asset : asset.asset + 'BUSD';
        const lastPrice = priceObj.hasOwnProperty(symbolUSDT) ? priceObj[symbolUSDT].price[0] : (priceObj.hasOwnProperty(symbolBUSD) ? priceObj[symbolBUSD].price[0] : 0);
        const value = asset.total * lastPrice;
        return value >= 5;
      })
      .map(asset => {
        const symbolUSDT = asset.asset === 'USDT' ? asset.asset : asset.asset + 'USDT';
        const symbolBUSD = asset.asset === 'BUSD' ? asset.asset : asset.asset + 'BUSD';
        const lastPrice = priceObj.hasOwnProperty(symbolUSDT) ? priceObj[symbolUSDT].price[0] : (priceObj.hasOwnProperty(symbolBUSD) ? priceObj[symbolBUSD].price[0] : 0);
        const value = (asset.total * lastPrice).toFixed(2);
        return { coin: asset.asset, quantity: asset.total, value };
      });

    //console.log(`Open bags with value greater than 5 USDT:`, openBags);
    return openBags;
  } catch (e) {
    console.error('Error fetching open bags with value greater than 5 USDT:', e);
    return e;
  }
}

//Get all open orders or a specific symbol if given
async function getOpenOrders(symbol) {
  const timestamp = Date.now();
  const url = `${baseURL}/api/v3/openOrders`;
  const params = { timestamp };
  if (symbol) { params.symbol = symbol }
  const signature = generateSignature(params);
  const config = {
    headers: { 'X-MBX-APIKEY': apiKey },
    params: { ...params, signature },
  };

  try {
    const response = await axios.get(url, config);
    console.log(response.data)
    return response.data;
  } catch (e) {
    console.error('Error getting open orders:', e);
    return e;
  }
}

// query the status of a specific order
async function queryOrders(symbol, orderId) {
  const timestamp = Date.now();
  const url = `${baseURL}/api/v3/order`;
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
    console.error(e);
    return e;
  }
}

// query the status of a specific order
async function cancelOrder(symbol, orderId) {
  const timestamp = Date.now();
  const url = `${baseURL}/api/v3/order`;
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
    console.error(e);
    return e;
  }
}









// CREARE E CHIUDERE ORDINI

//create orders
async function createSpotOrder(orderParams) {
  if (orderParams.amount && orderParams.symbol !== 'BUSDUSDT') {
    orderParams.amount = (await transferFunds('USDT', orderParams.amount)) * 0.96;

    if (orderParams.symbol.endsWith('BUSD')) {
      const exchangedAmount = (await exchangeToBUSD(orderParams.amount)) * 0.96;
      orderParams.amount = exchangedAmount;
    }
  }

  const preparedParams = await prepareOrderParams(orderParams);
  const url = `${baseURL}/api/v3/order`;
  const signature = generateSignature(preparedParams);
  const config = {
    headers: { 'X-MBX-APIKEY': apiKey },
    params: { ...preparedParams, signature },
  };

  try {
    const response = await axios.post(url, null, config);
    const order = await queryOrders(response.data.symbol, response.data.orderId);

    if (orderParams.type === 'LIMITUP') {
      const stopOrderParams = {
        symbol: orderParams.symbol,
        type: 'STOP',
        side: orderParams.side === 'BUY' ? 'SELL' : 'BUY',
        quantity: order.executedQty, 
        stopPrice: orderParams.side === 'BUY' ? parseFloat(response.data.fills[0].price * 0.98) : parseFloat(response.data.fills[0].price * 1.02),
        price: orderParams.side === 'BUY' ? parseFloat(response.data.fills[0].price * 0.977) : parseFloat(response.data.fills[0].price * 1.023)
      };
      await createSpotOrder(stopOrderParams);
    }

    return response.data;
  } catch (e) {
    console.log(e.constructor.name, e.message, e.response.data);
    return e.message;
  }
}

//setTimeout(() => createSpotOrder( {symbol: 'BTCUSDT', amount: 200, type: 'LIMITUP', side: 'BUY'}), 20000)








// Close or reduce open Positions and adj SL
async function sellTheBag(orderParams) {
  try {
    let { symbol, type, side, contracts, reduction } = orderParams;
    const rawQuantity = contracts * reduction;

    const tradingSymbol = await getTradingSymbol(symbol);
    if (!tradingSymbol) {
      console.log(`The symbol ${symbol} is not available with USDT or BUSD.`);
    }

    const params = { symbol: tradingSymbol, type, side, quantity: rawQuantity };
    const preparedParams = await prepareOrderParams(params);
    console.log(preparedParams)
    const url = `${baseURL}/api/v3/order`;
    const signature = generateSignature(preparedParams);
    const config = {
      headers: { 'X-MBX-APIKEY': apiKey },
      params: { ...preparedParams, signature },
    };

    const closedPosition = await axios.post(url, null, config);
    const orders = await getOpenOrders(tradingSymbol);
    const stopMarketOrders = orders.filter(order => order.type === 'STOP_LOSS_LIMIT');
    if(stopMarketOrders.length > 0) {
      const newOrderParams = {
        symbol: stopMarketOrders[0].symbol,
        type: 'STOP',
        side: stopMarketOrders[0].side,
        price: stopMarketOrders[0].price,
        stopPrice: stopMarketOrders[0].stopPrice,
        quantity: rawQuantity, 
    };
    await cancelOrder(stopMarketOrders[0].symbol, stopMarketOrders[0].orderId);
    await createSpotOrder(newOrderParams);
    }

    return closedPosition;
  } catch (e) {
      console.log(e.constructor.name, e.message, e.response.data);
      return e.message;
  }
}

//setTimeout(() => sellTheBag( {symbol: 'BTC', type: 'LIMITUP', side: 'SELL', contracts: 0.0, reduction: 0.5}), 20000)
//setTimeout(() => getOpenOrders('ETHUSDT'), 2000)

 





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
      setMarketOrderParams(params);
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
function setMarketOrderParams(params) {
  params.type = 'MARKET';
  params.quoteOrderQty = params.amount;

  if ('price' in params || 'stopPrice' in params) {
    if ('price' in params) {
      delete params.price;
    }
    if ('stopPrice' in params) {
      delete params.stopPrice;
    }
  }
  if ('amount' in params) {
    delete params.amount;
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
  if ('amount' in params) {
    delete params.amount;
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
  if ('amount' in params) {
    delete params.amount;
  }
}

function setStopOrderParams(params, symbolFilters) {
  if (params.price) {
    const formattedPrice = formatPrice(params.price, symbolFilters);
    const formattedStopPrice = formatPrice(params.stopPrice, symbolFilters);
    const { formattedQuantity } = formatQuantity(params.quantity ? params.quantity : params.amount / params.price, symbolFilters);
    params.type = 'STOP_LOSS_LIMIT';
    params.price = formattedPrice;
    params.stopPrice = formattedStopPrice;
    params.quantity = formattedQuantity;
    params.timeInForce = 'GTC';
  } else {
    const formattedStopPrice = formatPrice(params.stopPrice, symbolFilters);
    const { formattedQuantity } = formatQuantity(params.quantity ? params.quantity : params.amount / params.stopPrice, symbolFilters);
    params.type = 'STOP_LOSS';
    params.stopPrice = formattedStopPrice;
    params.quantity = formattedQuantity;
  }
  if ('amount' in params) {
    delete params.amount;
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





module.exports = {
  loadSpotMarkets,
  getAllSymbols,
  getSpotBalance,
  createSpotOrder,
  getOpenBags,
  sellTheBag
};
