const express = require('express');

const { 
  httpGetPosition,
  httpClosePosition,
  httpGetOpenBags,
  httpSellTheBag
} = require('./position.controller');


const positionRouter = express.Router();


positionRouter.get('/spot', httpGetOpenBags);
positionRouter.post('/spot', httpSellTheBag);
positionRouter.get('/future', httpGetPosition);
positionRouter.post('/future', httpClosePosition);


module.exports = positionRouter;


