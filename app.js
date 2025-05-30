require('dotenv').config();

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/dynamic-chat-app')

const app = require('express')();

const http = require('http').Server(app);

const userRoute = require('./routes/userRoute.js');
const User = require('./models/userModel.js');
const Chat = require('./models/chatModel.js');

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

    // user broadcasts online status
    socket.broadcast.emit('getOnlineUser', {
        user_id: userId,
    })

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

        // user broadcasts offline status
        socket.broadcast.emit('getOfflineUser', {
            user_id: userId,
        })
    });

    // Chatting functionality
    socket.on('newChat', function (data) {
        socket.broadcast.emit('loadNewChat', data);
    });

    // Load previous chats
    socket.on('existsChat', async function (data) {
        let chats = await Chat.find({
            $or: [
                {
                    sender_id: data.sender_id,
                    receiver_id: data.receiver_id
                },
                {
                    sender_id: data.receiver_id,
                    receiver_id: data.sender_id
                }
            ]
        })

        socket.emit('loadChats', {
            chats: chats
        });
    })

    // delete chats
    socket.on('chatDeleted', function (id) {
       socket.broadcast.emit('chatMessageDeleted', id);
    });
});

http.listen(3000, function () {
    console.log('Server is running on port http://localhost:3000');
});