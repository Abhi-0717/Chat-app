const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true}) // taking username and room properties from the query string object by object destructuring

// socket.on('countUpdated', (count) =>{
//     console.log('The count has been updated!', count)
// })

// document.querySelector('#increment').addEventListener('click', () =>{
//     console.log('Clicked')
//     socket.emit('increment')
// })

//acknowledgement concept
// server(emit) -> client(receive) --acknowledgement--> server
// client(emit) -> server(receive) --acknowledgement--> client

const autoscroll = () =>{
    // New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages conatainer
    const conatainerHeight = $messages.scrollHeight

    //How far I have scrolled ?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(conatainerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message) =>{
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) =>{
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users}) =>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit',(e) =>{
    e.preventDefault()
    //disable the send btn

    $messageFormButton.setAttribute('disabled', 'disabled')
    //complete
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) =>{ //error argument contains callback from server
        //Clears the message after typing and gets the cursor's focus back to the starting point
        $messageFormInput.value = ''
        $messageFormInput.focus()
        //enable the send btn

        $messageFormButton.removeAttribute('disabled')
        //complete
        if(error){
            return console.log(error)
        }

        console.log('Message delivered!')
    })

})

$sendLocationButton.addEventListener('click', () =>{

    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    //Disabling button
    $sendLocationButton.setAttribute('disabled','disabled')

    const options = {
        enableHighAccuracy: true
      }
    navigator.geolocation.getCurrentPosition((position) =>{

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () =>{

            //enabling button
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})

socket.emit('join', { username, room}, (error) =>{
    if(error){
        alert(error)
        location.href = '/'
    }
})