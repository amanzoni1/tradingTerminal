const { getOpenPositions, closePosition } = require('../../models/binanceFuture.models');
const { getOpenBags, sellTheBag } = require('../../models/binanceSpotTry');



async function httpGetPosition(req, res) {
  return res.status(200).json(await getOpenPositions());
}


async function httpClosePosition(req, res) {
  const orderParams = req.body;

  if (!orderParams.symbol || !orderParams.type || !orderParams.sideClose || !orderParams.contracts || !orderParams.reduction) {
    return res.status(400).json({
      error: 'Missing required order property',
    });
  }

  return res.status(201).json(await closePosition(orderParams));
}


async function httpGetOpenBags(req, res) {
  return res.status(200).json(await getOpenBags());
}


async function httpSellTheBag(req, res) {
  const orderParams = req.body;

  if (!orderParams.symbol || !orderParams.type || !orderParams.contracts || !orderParams.reduction) {
    return res.status(400).json({
      error: 'Missing required order property',
    });
  }

  return res.status(201).json(await sellTheBag(orderParams));
}



module.exports = {
  httpGetPosition,
  httpClosePosition,
  httpGetOpenBags,
  httpSellTheBag
};
