const express = require('express');
const path = require('path');
const cors = require('cors');

const positionRouter = require('./routes/position/position.router');
const accountRouter = require('./routes/account/account.router');
const marketsRouter = require('./routes/markets/markets.router');
const orderRouter = require('./routes/orders/orders.router');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/position', positionRouter);
app.use('/account', accountRouter);
app.use('/markets', marketsRouter);
app.use('/orders', orderRouter);

module.exports = app;