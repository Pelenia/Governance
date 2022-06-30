var express = require('express');
var router = express.Router();

const { setDistributor, calPeleVoteRate } = require('./controller/distributor');
router.post('/setDistributor', setDistributor);
router.get('/calPeleVoteRate', calPeleVoteRate);

module.exports = router;
