require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
var dns = require('dns');
const app = express();
// Basic Configuration
const port = process.env.PORT || 3000;

//connect to DB and create Schema
const mongoose = require('mongoose');
const { Schema } = mongoose;
//const mySecret = process.env['DB_URI']
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const urlSchema = new Schema({
  original_url: String,
  short_url: Number,
})
let UrlData = mongoose.model('UrlData', urlSchema)


//basic configuration for express
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


//set up parser for request body and get data from form 
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(bodyParser.urlencoded({ extended: true }));

//post request
app.post('/api/shorturl', urlencodedParser, async function(req, res) {
  //console.log('urlencodedParser', urlencodedParser)
  console.log('req.body', req.body)
  console.log('req.body.url', req.body.url);
  //send data 
  let original_url = req.body.url;

  const haveHttp = original_url.includes('http');
  const haveHttps = original_url.includes('https');

  if (!haveHttp || !haveHttps) {
    res.json({ error: 'invalid url' })
    return
  }

  // create new document if url is not exist in DB
  await UrlData.countDocuments({ original_url: original_url }, function(err, count) {
    console.log('there are %d documents', count);
    //if document is not exists
    if (!count) {
      UrlData.countDocuments({}, function(err, allCount) {
        //create new short_url
        console.log('find all %d documents', allCount);
        allCount = allCount + 1
        console.log('new number of %d new document', allCount)
        //crete new document
        let addUrl = new UrlData({
          original_url,
          short_url: allCount,
        });
        addUrl.save(function(err, data) {
          if (err) return done(err);
          //for redirection  
          res.json({ original_url: original_url, short_url: allCount })
        });

      })
    } else {
       UrlData.find({ original_url: original_url }, function(err, docs) {
        if (err) return err;
        console.log('original_url', docs[0])
        if (docs[0]) res.json({ original_url: docs[0].original_url, short_url: docs[0].short_url })
      })
    }
  });
  //finf short url 
  //https://forum.freecodecamp.org/t/url-shortener-it-seems-to-work-but-doesnt-pass/428343/7
  //https://forum.freecodecamp.org/t/url-shortener-question/432733
})

//get request
app.get(`/api/shorturl/:short_url`, function(req, res) {
  console.log('req.params', req.params)
  UrlData.find({ short_url: req.params.short_url }, function(err, docs) {
        if (err) return err;
        console.log('original_url', docs)
        //res.json({ original_url: docs[0].original_url, short_url: docs[0].short_url })
        res.redirect(docs[0].original_url)
      })
})

