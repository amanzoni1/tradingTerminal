const { getMarginBalance } = require('../../models/binanceFuture.models');
const { getSpotBalance } = require('../../models/binanceSpotTry');


async function httpGetSpotAccountInfo(req, res) {
  return res.status(200).json(await getSpotBalance());
}

async function httpGetFuturesAccountInfo(req, res) {
  return res.status(200).json(await getMarginBalance());
}



module.exports = {
  httpGetSpotAccountInfo,
  httpGetFuturesAccountInfo
};

