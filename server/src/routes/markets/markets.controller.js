const { getAllFutureSymbols } = require('../../models/binanceFuture.models');
const { getAllSymbols } = require('../../models/binanceSpotTry');



async function httpGetAllMarkets(req, res) {
  return res.status(200).json(await getAllSymbols());
}

async function httpGetAllFutureMarkets(req, res) {
  return res.status(200).json(await getAllFutureSymbols());
}



module.exports = {
  httpGetAllMarkets,
  httpGetAllFutureMarkets
};

