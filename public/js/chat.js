const socket = io();   // function io() provided by /socket.io/socket.io.js loaded in chat.html

//Elements 
//$variable is just a convention for elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $LocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');  //target where message-template will be rendered

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
//Qs is from qs library loaded in chat.html
//location is a global object in client JS
//location.search holds the querystring
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true}) //remove ? at the beginning of query

// socket.on('welcomeClient', (message) => {
//     console.log(message);
// });

const autoScroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild; //get last element as a child (newest message)

    //height of the newest message
    const newMessageStyles = getComputedStyle($newMessage); //figure out bottom margin spacing
    const newMessageMargin = parseInt(newMessageStyles.marginBottom); //get margin bottom value
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin; 

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const containerHeight = $messages.scrollHeight; //total height able to scroll through

    // how far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight; //scrollTop -> amount of distance scrolled from the top (scrolling down from the top increases value)

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('messageUpdate', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
});

socket.on('LocationMessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
});

socket.on('roomData', ({room,users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});


$messageForm.addEventListener('submit', (event) => {
    event.preventDefault(); //prevent page from reloading after submitting form

    if($messageFormInput.value == "")
    {
        return;
    }

    //disable
    $messageFormButton.setAttribute('disabled', 'disabled');

    //event.target is target we are listening the event on ($messageform)
    //the form has elements that we can choose by name, message (input)
    //message (input) has value that stores text
    const message = event.target.elements.message.value;
    
    socket.emit('sendMessage', message, (error) => { //callback function is acknowledgment from server
        //re-enable
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = "";   //clear input
        $messageFormInput.focus();

        if(error)
        {
            return console.log(error);  //error variable is the variable inside the callback from the server (a string)
        }
        console.log('the message was delivered', ); 
    });
});

//geolocation API might NOT work on older browsers
$LocationButton.addEventListener('click', () => {
    if(!navigator.geolocation)  //check if browsers supports geolocation
    {
        return alert('Geolocation is not supported by your browser');
    }

    $LocationButton.setAttribute('disabled','disabled');

    //getcurrentPosition does NOT have Promise, thus we need to do simple callback functions
    navigator.geolocation.getCurrentPosition((position) => {
        const cords = {
            lat : position.coords.latitude,
            long: position.coords.longitude
        };
        socket.emit('sendLocation', cords, (error) => {
            $LocationButton.removeAttribute('disabled');

            if(error)
            {
                return console.log(error);
            }
            console.log('location shared');
        });
    });
});

socket.emit('join', {username, room}, (error) => {
    if(error)
    {
        alert(error);
        location.href= '/'  //redirect to root of site
    }
});

// socket.on('countUpdated', (count) => {
//     console.log('the count has been updated', count);
// });

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('clicked');
//     socket.emit('increment');
// })