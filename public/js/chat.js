const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageInput = $messageForm.querySelector('input');
const $messageBtn = $messageForm.querySelector('button');
const $messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const buttonTemplate = document.querySelector('#button-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const {username, room} =Qs.parse(location.search,{ ignoreQueryPrefix : true })

const autoscroll = ()=>{
    const $newMessage = $messages.lastElementChild
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight
    const containerHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

   // if(containerHeight-newMessageHeight<=scrollOffset){  //this is when you want user to scroll once and then autoscroll
        $messages.scrollTop = $messages.scrollHeight    //this is simply autoscroll
   // }
}

socket.on('message', (message)=>{
    //console.log(text);
    const html = Mustache.render(messageTemplate,{
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoscroll();
})

socket.on('location-message', (locationlink)=>{
    //console.log(locationlink);
    const btnhtml = Mustache.render(buttonTemplate,{
        username:locationlink.username,
        link : locationlink.text,
        createdAt : moment(locationlink.createdAt).format('h:mm a')
         })
    $messages.insertAdjacentHTML('beforeend', btnhtml);
    autoscroll();
})

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();

    $messageBtn.setAttribute('disabled', 'disabled');
    const content = $messageInput.value;

    socket.emit('data',content,(error)=>{
        $messageBtn.removeAttribute('disabled');
        $messageInput.value = "";
        $messageInput.focus();
        if(error){
            return console.log(error);
        }
        console.log('The message was delivered!');
    });
});

const $LocationBtn = document.querySelector('#send-location');

$LocationBtn.addEventListener('click',(e)=>{
    e.preventDefault();
    $LocationBtn.setAttribute('disabled', 'disabled');

    if(!navigator.geolocation)
    {return alert('Geolocation is not supported by ur browser')}

    navigator.geolocation.getCurrentPosition((position)=>{
        const locationCoordinates = {latitude: position.coords.latitude , longitude: position.coords.longitude};
        socket.emit('sendlocation',locationCoordinates,()=>{
            console.log('Location Shared!!')
            $LocationBtn.removeAttribute('disabled');
        });
    })
})


socket.emit('join',{username, room},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
});

socket.on('room-data',({room, users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})