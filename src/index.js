const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server) //configure socket.io to work with a server

const port = process.env.PORT || 3000
const publiDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publiDirectoryPath))

// let count = 0
//server(emit) -> client(receive) - countUpdated
//client(emit) -> server(receive) - increment

io.on('connection', (socket) =>{
    console.log('New WebSocket connection')

//     socket.emit('countUpdated', count)  //We are using socket not io as if we use io everytime a new user joins all clients would get
//                                         //  the count data which is not needed to sent as the count is not changed.

//     socket.on('increment', () =>{
//         count++
//         //socket.emit('countUpdated', count)
//         io.emit('countUpdated', count)        
//     })

   socket.on('join', ({ username, room}, callback) =>{
       const {error, user} = addUser({ id: socket.id, username, room })

       if(error){
           return callback(error)
       }

       socket.join(user.room)

       socket.emit('message', generateMessage('Admin', 'Welcome!'))
       socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
       io.to(user.room).emit('roomData', {
           room: user.room,
           users: getUsersInRoom(user.room)
       })
        callback()

       //socket.emit, io.emit, socket.broadcast.emit
       //With the addition of rooms, we have two different variations of above emitting methods, one is variation of io.emit and other of socket.broadcast.emit
       //io.to.emit -> Emits an event to everybody in that specific room 
       //socket.broadcast.to.emit -> Sending an event to everyone except that specific client, but limiting this to a chat room 
   })

   socket.on('sendMessage', (message, callback) =>{
       const filter = new Filter()
       const user = getUser(socket.id)

       if(filter.isProfane(message)){
           return callback('Profanity is not allowed!')
       }

       io.to(user.room).emit('message', generateMessage(user.username, message))
       callback()
   })

   socket.on('sendLocation', (coords, callback) =>{

       const user = getUser(socket.id)
       io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
       callback()
   })

   socket.on('disconnect', () =>{
    const user = removeUser(socket.id)

    if(user){
     io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
     io.to(user.room).emit('roomData', {
         room: user.room,
         users: getUsersInRoom(user.room)
     })
      }
   })

})

server.listen(port,() =>{
    console.log(`Server is up on ${port}!`)
})