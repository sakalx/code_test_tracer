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
      renderTables(state.users);
      bindEventsForTable()
    });


  API.updateUser({id:1, data:   {
      "userId": 1,
      "id": 3,
      "title": "omnis laborum odio"
    },}).then(res => {
    console.log(res);
  })
}


function renderTables(users) {

  const templateTableAlbums = user => `
    <div class='table'>
        <div class='table__row table__header'>
            <div class='table__cell table__cell--short'>id</div>
            <div class='table__cell'>title</div>
        </div>
        
        ${user.albums.map(({id, title}) => `
          <div class='table__row' draggable='true'>
              <div class='table__cell table__cell--short'>${id}</div>
              <div class='table__cell'>${title}</div>
          </div>
        `).join('')}
        
    </div>
    `;

  const listOfTable = Object.values(users).map(templateTableAlbums).join('');
  $('main').append(listOfTable);
}


function handleAddDragEvents(e) {
  const currentElement = e.target.closest('.table__row');
  currentElement.addEventListener('dragstart', dragStart);
  currentElement.addEventListener('dragend', dragEnd);
}

function handleRemoveDragEvents(e) {
  const currentElement = e.target.closest('.table__row');
  currentElement.removeEventListener('dragstart', dragStart);
  currentElement.removeEventListener('dragend', dragEnd);
}


function bindEventsForTable() {
  const tables = $('.table');

  for (const table of tables) {
    table.addEventListener('dragover', dragOver);
    table.addEventListener('dragenter', dragEnter);
    table.addEventListener('drop', dragDrop);
    table.addEventListener('mousedown', handleAddDragEvents);
    table.addEventListener('mouseup', handleRemoveDragEvents);
  }
}

let draggableElement = null;

function dragOver(e) {
  e.preventDefault();
  console.log('dragOver');
}

function dragEnter(e) {
  e.preventDefault();
  console.log('dragEnter');
}

function dragDrop(e) {

  this.append(draggableElement);
}


function dragStart(e) {
  console.log('dragStart');
  draggableElement = e.target.closest('.table__row');
  setTimeout(() => $(this).toggleClass('invisible'), 0);
}

function dragEnd(e) {
  console.log('dragEnd');
  $(this).toggleClass('invisible');
}


function dragLeave(e) {
  console.log('dragLeave', e);
}


function hintDropSection(el) {
  console.log('dropToArea');
}


const API = (() => {
  const url = 'https://jsonplaceholder.typicode.com/users';
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

  const putData = url => ({id, data}) => {
    const api = `${url}/${id}`;
    showLoader();

    return $.ajax({
      url: api,
      type: 'put',
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
      data: JSON.stringify(data),
    })
      .fail(jqXHR => handleError(jqXHR))
      .always(() => showLoader(false));
  };

  const getAll = request => list => Promise.all(list.map(id => request(id)));

  const fetchUser = getData({url});
  const fetchAlbumsByUser = getData({url, endPoint: 'albums'});
  const updateUser = putData(url);

  return {
    getUsers: getAll(fetchUser),
    getAlbumsByUser: getAll(fetchAlbumsByUser),
    updateUser,
  }
})();


function updateAlbumsOfUser(userId, albumId) {
  console.log('updateUserAlbum');
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