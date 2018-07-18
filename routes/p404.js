var express = require('express');
var router = express.Router();

// Get Homepage
router.get('/', function(req, res){

    res.render('p404', {
        title: "Page not Found",
    });

});

module.exports = router;
