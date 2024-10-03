const express = require('express');

const { httpCreateNewOrder, httpGetOpenOrders, httpDeleteOrder } = require('./orders.controller');

const orderRouter = express.Router();

orderRouter.post('/', httpCreateNewOrder);
orderRouter.get('/', httpGetOpenOrders);
orderRouter.delete('/', httpDeleteOrder);

module.exports = orderRouter;
