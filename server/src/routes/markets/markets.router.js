const express = require('express');

const { httpGetAllMarkets, httpGetAllFutureMarkets } = require('./markets.controller');

const marketsRouter = express.Router();

marketsRouter.get('/spot', httpGetAllMarkets);
marketsRouter.get('/future', httpGetAllFutureMarkets);

module.exports = marketsRouter;

