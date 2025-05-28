require('dotenv').config();

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/dynamic-chat-app')

const app = require('express')();

const http = require('http').Server(app);

const userRoute = require('./routes/userRoute.js');
const User = require('./models/userModel.js');

app.use('/', userRoute)

const io = require('socket.io')(http);

var usp = io.of('/user-namespace')

usp.on('connection', async function (socket) {
    console.log("user connected");

    let userId = socket.handshake.auth.token;

    await User.findByIdAndUpdate(
        { _id: userId },
        {
            $set: {
                is_online: '1'
            }
        }
    )

    socket.on('disconnect', async function () {
        console.log("user disconnected");

        let userId = socket.handshake.auth.token;

        await User.findByIdAndUpdate(
            { _id: userId },
            {
                $set: {
                    is_online: '0'
                }
            }
        )
    });
});

http.listen(3000, function () {
    console.log('Server is running on port http://localhost:3000/');
});