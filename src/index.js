const path = require('path');   //core node module, no need to install
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, getUser, getUsersInRoom, removeUser} = require('./utils/users');

const app = express();
const server = http.createServer(app);  
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));   // serve static

// let count = 0;

//io.on used for connection
//socket is an object that contains info about the connection
io.on('connection', (socket) => {
    console.log('new websocket connection');

    // socket.emit('messageUpdate', generateMessage('Welcome new user!'));
    // socket.broadcast.emit('messageUpdate', generateMessage('A new user has joined'));     //send event to everyone EXCEPT this specified socket
    
    //send an event (emit) from server to client
    // socket.emit('countUpdated', count); //count is a variable that is available on the callback of the client
    
    // socket.on('increment', () => {
    //     count++;
    //     //socket.emit('countUpdated', count);   //emits event to specific client
    //     io.emit('countUpdated',count);  //emits event to ALL clients
    // });

    socket.on('sendLocation', (cords, callback) => {
        if(!cords)
        {
            return callback('location unabled to be shared')
        }        
        const user = getUser(socket.id);
        io.to(user.room).emit('LocationMessage', generateLocationMessage(user.username, 'https://google.com/maps?q=' + cords.lat + ',' + cords.long));       
        callback();
    });

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({id: socket.id, username,room});
        
        if(error)
        {
            return callback(error);
        }

        //io.to().emit -> emits an event to everyone in a specific room
        //io.broadcast.to().emit => emits an event to everyone in a specific room EXCEPT the specific client
        socket.join(user.room);   

        socket.emit('messageUpdate', generateMessage(" ", 'Welcome new user!'));    //send event to specific user
        socket.broadcast.to(user.room).emit('messageUpdate', generateMessage(user.username + ' has joined'));     //send event to everyone in the room EXCEPT this specified socket    
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    });

    socket.on('sendMessage', (message,  callback) => {
        const filter = new Filter();

        //check if message string contains profanity
        if(filter.isProfane(message))
        {
            return callback('profanity is not allowed');
        }

        const user = getUser(socket.id);
        if(user)
        {
            io.to(user.room).emit('messageUpdate', generateMessage(user.username ,message));
            return callback(); //callback to run acknowledgment
        }

        return callback('user not found');
    });

    socket.on('disconnect', () => {
        const removedUser = removeUser(socket.id);
        if(removedUser)
        {
            io.to(removedUser.room).emit('messageUpdate', generateMessage(" ", removedUser.username + ' has left'));
            io.to(removedUser.room).emit('roomData', {
                room: removedUser.room,
                users: getUsersInRoom(removedUser.room)
            })
        }        
    });
});

server.listen(port, () => {
    console.log('server is up on port ' + port);
});
