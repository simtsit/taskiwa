var express = require('express');
var router = express.Router();

// Get Homepage
router.get('/', function(req, res){

    res.render('p403', {
        title: "Access Denied",
    });

});

module.exports = router;
