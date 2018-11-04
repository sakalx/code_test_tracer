$(init);

function init() {

  const state = {
    usersId: ['1', '2'],
    users: {},
    selectedAlbums: [],
  };

  API.getUsers(state.usersId)
    .then(users => {
      users.forEach(user => {
        const userId = String(user.id);
        state.users[userId] = {...state.users[userId], ...user};
      });
    });

  API.getAlbumsByUser(state.usersId)
    .then(res => {
      res.forEach(albums => {
        const userId = String(albums[0].userId);
        state.users[userId] = {...state.users[userId], albums};
      });
    })
    .then(() => {
      // renderListOfAlbums()
      // bindEventsToAlbums()
    });
}


/*// DOM
const DOM = {
  firstTable: $('main:nth-child(1)'),
  secondTable: $('main:nth-child(2)'),
};*/
const DOM = (() => {

})();


const API = (() => {
  const baseURL = 'https://jsonplaceholder.typicode.com';

  const handleError = jqXHR => {
    console.error(`status code: ${jqXHR.status}`);
    console.log(`error message: ${jqXHR.responseText}`)
  };

  const ajax = ({url, endPoint = ''}) => id => {
    const api = `${url}/${id}/${endPoint}`;
    // In the meantime when we wait for data we can show a spinner, if it needed :
    // showLoader();

    return $.getJSON(api)
      .fail(jqXHR => handleError(jqXHR))
    // Hide spinner :
    // .always(() => showLoader(false));
  };

  const getAllData = request => list => Promise.all(list.map(id => request(id)));

  const fetchUser = ajax({
    url: `${baseURL}/users`,
  });
  const fetchAlbumsByUser = ajax({
    url: `${baseURL}/users`,
    endPoint: 'albums',
  });

  return {
    getUsers: getAllData(fetchUser),
    getAlbumsByUser: getAllData(fetchAlbumsByUser),
  }
})();


function updateAlbumsOfUser(userId, albumId) {
  console.log('updateUserAlbum');
}

function showLoader(loading = true) {
  console.log(loading);
}


// DOM handlers
function createElement(id, title) {
  console.log('createItem');
}

function appendElement(el) {
  console.log('appendElement');
}

// Drag&Drop handlers
function dragElement(el) {
  console.log('dragElement');
}

function multipleDrags(elements) {
  console.log('dropToArea');
}

function dropToSection(el) {
  console.log('dropToArea');
}

function hintDropSection(el) {
  console.log('dropToArea');
}

// Utils
function filterArrayByText(array, text) {
  console.log('filterArrayByText');
}


const BindEvents = newItem => {
  const checkbox = newItem.querySelector('.checkbox'),
    editButton = newItem.querySelector('button.edit'),
    delButton = newItem.querySelector('button.delete');

  checkbox.addEventListener('change', Checkbox);
  //editButton.addEventListener('click', EditItem);
  //delButton.addEventListener('click', DelButton);
};

const Checkbox = ({target}) => {
  const item = target.parentNode;
  item.classList.toggle('completed');
};