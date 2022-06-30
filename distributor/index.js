require("dotenv").config();
const cron = require('node-cron');
var mongoose = require('mongoose');
mongoose.connect(process.env.DB_HOST+'/'+process.env.DB_NAME, {useNewUrlParser: true, useUnifiedTopology: true})
var mongoDB = mongoose.connection;
const models = require('./models');
const { getState, mixedAction, getHash, winningVote } = require('./contract');

const { Zilliqa } = require('@zilliqa-js/zilliqa');
var net_url = process.env.TEST_STREAM;
if (process.env.NET_TYEP == 'main') {
  net_url = process.env.MAIN_STREAM;
}
const zilliqa = new Zilliqa(net_url);

const { runMaintainPeleBalance } = require('./cron/updatePelebalance');

mongoDB.once('open', function() {
  console.log('--  MogoDB Connected  --')

  cron.schedule("0 */1 * * * *", async function() {
  // cron.schedule("*/10 * * * * *", async function() {

    const { result } = await zilliqa.blockchain.getNumTxBlocks();

    var unregistered = await models.distributer.findOne({registerd:0})
    if (unregistered != null) {
      var txCB = await mixedAction('RegisterDistributor', unregistered.account, unregistered.amount, unregistered.epoch, unregistered.period, unregistered.timestamp);
      if (txCB.state == 'ok') {
        unregistered.registerd = 1;
        unregistered.save();
      }
    }
    else {
      models.distributer.find({ellipsed:{$gt:0}}, async function(err, data) {
        if(err == null && data.length>0) {
          var contract_state = await getState();
          if (contract_state != null) {
            for (var x in data) {
              if (data[x].last_called + data[x].period <= result) {
                var hash = getHash(data[x].account, data[x].amount, data[x].epoch, data[x].period, data[x].timestamp);
                console.log(hash);
                if(contract_state['distribut_estimate'] && contract_state['distribut_estimate'][hash] && contract_state['distribut_estimate'][hash] > 0) {
                  var txCB = await mixedAction('CallDistribute', data[x].account, data[x].amount, data[x].epoch, data[x].period, data[x].timestamp);
                  if(txCB.state == 'ok') {
                    data[x].last_called = result;
                    data[x].ellipsed = contract_state['distribut_estimate'][hash];
                    data[x].save();
                    break;
                  }
                }
              }
            }
          }
        }
      })
    } // end else
  });

  runMaintainPeleBalance();
})


var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./router');

var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Credentials", true);
  // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', indexRouter);

console.log('--  Server Started  --')

const port = process.env.PORT || 4100;
//Starting a server
app.listen(port, () => {
  // winningVote('zil1wsuyqwqmr6tl004s77l29u86a0wscpvnapuk83', process.env.DISTRIBUTOR_TEST_BECH32, 1, 0.5);
  console.log(`app is running at ${port}`);
});