const socket = io();

// Elements
const $messageForm = document.querySelector('#form');
const $messageFormInput = $messageForm.querySelector('#input');
const $messageFormButton = $messageForm.querySelector('#button');
const $messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Ooptions
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true, });

// socket.on('countUpdated', (count) => {
//   console.log(`The count has been updated! And it is ${count}`);
// });


const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // get height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // Visible height
  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }

}


socket.on('message', (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('DD MM YYYY HH:mm:ss'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', message => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    location: message.url,
    createdAt: moment(message.createdAt).format('DD MM YYYY HH:mm:ss'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});

// document.getElementById('increment').addEventListener('click', () => {
//   console.log('dasdsa');
//   socket.emit('increment');
// });


$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // disable form
  $messageFormButton.setAttribute('disabled', true);


  const message = $messageFormInput.value;

  socket.emit('sendMessage', message, (error) => {
    // enable form
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log('message delivered');
  });
});

// location
const $sendLocationButton = document.getElementById('location');

$sendLocationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('location is not supported')
  }

  // disable
  $sendLocationButton.setAttribute('disabled', true);

  navigator.geolocation.getCurrentPosition((position) => {
    console.log(position);

    socket.emit('sendLocation', { lat: position.coords.latitude, long: position.coords.longitude, }, () => {
      // enable $sendLocationButton
      $sendLocationButton.removeAttribute('disabled');

      console.log('Locatio shared');
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
  alert(error);
  location.href = '/';
  }
});