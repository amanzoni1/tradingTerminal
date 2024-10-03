const { createOrder, getOpenOrders, deleteOrder } = require('../../models/binanceFuture.models');


async function httpCreateNewOrder(req, res) {
  const orderParams = req.body;

  if (!orderParams.symbol || !orderParams.type || !orderParams.side || !orderParams.amount) {
    return res.status(400).json({
      error: 'Missing required order property',
    });
  }

  return res.status(201).json(await createOrder(orderParams));
}


async function httpGetOpenOrders(req, res) {
  return res.status(200).json(await getOpenOrders());
}

async function httpDeleteOrder(req, res) {
  const orderParams = req.body;
  return res.status(200).json(await deleteOrder(orderParams));
}



module.exports = {
  httpCreateNewOrder,
  httpGetOpenOrders,
  httpDeleteOrder
};
