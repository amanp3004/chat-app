const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage} = require('./utils/messages.js')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users.js')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT||3000;
const publicDirectoryPath = path.join(__dirname, '../public');
app.use(express.static(publicDirectoryPath));

io.on('connection', (socket)=>{
    console.log('new room up')
    socket.on('join',(options,callback)=>{
        const {error,user} = addUser({ id:socket.id, ...options });
        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin',`Welcome! ${user.username}`));
        socket.broadcast.to(user.room).emit('message',generateMessage( 'Admin', `${user.username} has joined the chat-room!`));
        
        io.to(user.room).emit('room-data',{
            room : user.room,
            users : getUsersInRoom(user.room)
        })

        callback();
    })

    socket.on('data',(content,callback)=>{
        const filter = new Filter()
        if(filter.isProfane(content)){
            return callback('Profanity is not allowed!')
        }
        const user = getUser(socket.id);
        io.to(user.room).emit('message', generateMessage(user.username,content));
        callback()
    });

    socket.on('sendlocation',(locationCoordinates,callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('location-message',generateMessage(user.username,`https://google.com/maps?q=${locationCoordinates.latitude},${locationCoordinates.longitude}`));
        callback();
    });

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user) {
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left the chat-room!`))
            io.to(user.room).emit('room-data',{
            room : user.room,
            users : getUsersInRoom(user.room)
            })
        }
    });

});


server.listen(port,()=>{
    console.log('Server started on Port 3000');
})