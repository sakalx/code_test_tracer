$(init);

const state = {
  usersId: ['1', '2'],
  users: {},
  selectedAlbums: [],
};

function init() {

  const getUsers = API.getUsers(state.usersId)
    .then(users => {
      users.forEach(user => {
        const userId = String(user.id);
        state.users[userId] = {...state.users[userId], ...user};
      });
    });

  const getAlbums = API.getAlbumsByUser(state.usersId)
    .then(res => {
      res.forEach(albums => {
        const userId = String(albums[0].userId);
        state.users[userId] = {...state.users[userId], albums};
      });
    });

  Promise.all([getUsers, getAlbums])
    .then(() => {
      DOM.render.tables(state.users);
      DOM.listener.bindEventsForTable();
    });
}


// ================================================================
// DOM handler
const DOM = (() => {
  const node = {
    getAlbumNode({target}) {
      return target.closest('.table__row');
    },
  };

  const listener = {
    handleAddDragEvents(e) {
      const selectedAlbum = DOM.node.getAlbumNode(e);
      selectedAlbum.addEventListener('dragstart', DD.handleDragStart);
      selectedAlbum.addEventListener('dragend', DD.handleDragEnd);
    },
    handleRemoveDragEvents(e) {
      const selectedAlbum = DOM.node.getAlbumNode(e);
      selectedAlbum.removeEventListener('dragstart', DD.handleDragStart);
      selectedAlbum.removeEventListener('dragend', DD.handleDragEnd);
    },
    bindEventsForTable() {
      const tables = $('.table');
      for (const table of tables) {
        table.addEventListener('dragover', DD.handleDragOver);
        table.addEventListener('drop', DD.handleDrop);
        table.addEventListener('mousedown', this.handleAddDragEvents);
        table.addEventListener('mouseup', this.handleRemoveDragEvents);
      }
    },
  };

  const render = {
    tables(users) {
      const templateTableAlbums = user => `
        <div class='table' data-user=${user.id}>
            <div class='table__row table__header'>
                <div class='table__cell table__cell--short'>id</div>
                <div class='table__cell'>title</div>
            </div>
            
            ${user.albums.map(({id, title}) => `
              <div class='table__row table__row--hover' data-album=${id} draggable='true'>
                  <div class='table__cell table__cell--short'>${id}</div>
                  <div class='table__cell'>${title}</div>
              </div>
            `).join('')}
            
        </div>
        `;

      const listOfTable = Object.values(users).map(templateTableAlbums).join('');
      $('main').append(listOfTable);
    }
  };


  return {
    node,
    listener,
    render,
  }
})();
// DOM handler END
// ================================================================


// ================================================================
// Drag & Drop handler
const DD = (() => {
  let draggableElement = null;

  const handleDragOver = e => e.preventDefault();

  const handleDragStart = e => {
    const albumNode = DOM.node.getAlbumNode(e);

    draggableElement = albumNode;
    setTimeout(() => $(albumNode).toggleClass('invisible'), 0);
  };

  const handleDragEnd = e => {
    const albumNode = DOM.node.getAlbumNode(e);
    $(albumNode).toggleClass('invisible');
  };

  function handleDrop(e) {
    const albumNode = DOM.node.getAlbumNode(e);
    const transferFromUser = draggableElement.parentElement.dataset.user;
    const transferToUser = albumNode ? albumNode.parentElement.dataset.user : e.target.dataset.user;

    if (transferFromUser === transferToUser) return;

    const albumId = +draggableElement.dataset.album;
    const fromAlbum = state.users[transferFromUser].albums;

    const fromUserNewData = {
      ...state.users[transferFromUser],
      albums: state.users[transferFromUser].albums.filter(({id}) => id !== albumId),
    };
    const toUserNewData = {
      ...state.users[transferToUser],
      albums: [...state.users[transferToUser].albums, fromAlbum.find(({id}) => id === albumId)],
    };

    const fromUserRequest = API.updateUser({id: transferFromUser, data: fromUserNewData});
    const toUserRequest = API.updateUser({id: transferToUser, data: toUserNewData});

    Promise.all([fromUserRequest, toUserRequest]).then(res => {
      const updatedUsers = res.reduce((acc, next) => {
        acc[next.id] = {...next};
        return acc
      }, {});

      state.users = {...state.users, ...updatedUsers};
      this.append(draggableElement);
    });
  }

  return {
    handleDragOver,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  }
})();
// Drag & Drop handler END
// ================================================================


// ================================================================
// API handler
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
// API handler END
// ================================================================