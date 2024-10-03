const express = require('express');

const { httpGetSpotAccountInfo, httpGetFuturesAccountInfo } = require('./account.controller');

const accountRouter = express.Router();

accountRouter.get('/spot', httpGetSpotAccountInfo);
accountRouter.get('/future', httpGetFuturesAccountInfo);

module.exports = accountRouter;

