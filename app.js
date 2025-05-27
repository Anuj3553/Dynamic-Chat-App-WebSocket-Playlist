require('dotenv').config();

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/dynamic-chat-app')

const app = require('express')();

const http = require('http').Server(app);

const userRoute = require('./routes/userRoute.js')

app.use('/', userRoute)

http.listen(3000, function () {
    console.log('Server is running on port http://localhost:3000/');
});