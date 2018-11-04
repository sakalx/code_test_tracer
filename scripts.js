$(init);

function init() {

  const state = {
    usersId: ['1', '2'],
    users: {},
    selectedAlbums: [],
    loading: false,
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
      console.log(state);
      // renderListOfAlbums()
      // bindEventsToAlbums()

      renderTableAlbums(state.users)
    });


}


function renderTableAlbums(users) {

  const templateTableAlbums = user => `
    <div class='table'>
        <div class='table__row table__header'>
            <div class='table__cell table__cell--short'>id</div>
            <div class='table__cell'>title</div>
        </div>
        
        ${user.albums.map(({id, title}) => `
          <div class='table__row' draggable='true'>
              <div class='table__cell table__cell--short'>${id}</div>
              <div class='table__cell table__cell'>${title}</div>
          </div>
        `).join('')}
        
    </div>
    `;

  const listOfTable = Object.values(users).map(templateTableAlbums).join('');

  $('main').append(listOfTable);
}


const DOM = (() => {

})();


const API = (() => {
  const baseURL = 'https://jsonplaceholder.typicode.com';
  let currentLoading = false;

  const handleError = jqXHR => {
    console.error(`status code: ${jqXHR.status}`);
    console.log(`error message: ${jqXHR.responseText}`)
  };

  const showLoader = (loading = true) => {
    if (currentLoading !== loading) {
      currentLoading = loading;
      console.log('toggle spinner');
    }
  };

  const getData = ({url, endPoint = ''}) => id => {
    const api = `${url}/${id}/${endPoint}`;
    showLoader();

    return $.getJSON(api)
      .fail(jqXHR => handleError(jqXHR))
      .always(() => showLoader(false));
  };

  const getAllData = request => list => Promise.all(list.map(id => request(id)));

  const fetchUser = getData({
    url: `${baseURL}/users`,
  });
  const fetchAlbumsByUser = getData({
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