const User = require('../models/userModel.js')
const Chat = require('../models/chatModel.js');
const bcrypt = require('bcrypt');

const registerLoad = async (req, res) => {
    try {
        res.render('register');
    } catch (error) {
        console.log(error.message)
    }
}

const register = async (req, res) => {
    try {
        const passwordHash = await bcrypt.hash(req.body.password, 10);

        const user = new User({
            name: req.body.name,
            email: req.body.email,
            image: 'images/' + req.file.filename,
            password: passwordHash
        })

        await user.save();

        res.render('register', { message: 'Your Registration has been completed!' });
    } catch (error) {
        console.log(error.message)
    }
}

const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message)
    }
}

const login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                req.session.user = userData;
                res.redirect('/dashboard');
            } else {
                res.render('login', { message: 'Invalid Email or Password' });
            }
        }
        else {
            res.render('login', { message: 'Invalid Email or Password!' });
        }


    } catch (error) {
        console.log(error.message)
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/');

    } catch (error) {
        console.log(error.message)
    }
}

const loadDashboard = async (req, res) => {
    try {
        let users = await User.find({ _id: { $nin: [req.session.user._id] } })

        res.render('dashboard', {
            user: req.session.user,
            users: users
        });
    } catch (error) {
        console.log(error.message)
    }
}

const saveChat = async (req, res) => {
    try {
        let chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message
        });

        let newChat = await chat.save();

        res.status(200).send({
            success: true,
            msg: 'Message sent successfully!',
            data: newChat
        });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

const deleteChat = async (req, res) => {
    try {
        await Chat.deleteOne({ _id: req.body.id })

        res.status(200).send({
            success: true,
            msg: 'Chat deleted successfully!'
        });
    } catch (error) {
        res.status(400).send({ success: false, msg: error.message });
    }
}

module.exports = {
    registerLoad,
    register,
    loadLogin,
    login,
    logout,
    loadDashboard,
    saveChat,
    deleteChat
}