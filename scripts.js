$(init);

const state = {
  usersId: ['1', '2'],
  users: {},
  selectedAlbums: [],
};

function init() {
  DOM.render.allSearchForm(state.usersId);

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
      DOM.render.allTables(state.users);
      DOM.listener.bindEventsForTables();
      DOM.listener.bindEventsForSearchForms();
    });
}


// ================================================================
// DOM handler
const DOM = (() => {
  const node = {
    getAlbumNode({target}) {
      return target.closest('.table__row');
    },
    getSearchField({target}) {
      return target.previousElementSibling;
    },
  };

  const listener = {
    _handleSearch(e) {
      const isReset = e.target.innerHTML === 'Reset';
      const userId = e.target.dataset.user;
      const albums = state.users[userId].albums;
      const searchField = DOM.node.getSearchField(e);

      const updateTable = user => {
        DOM.render.tableByUser(user);
        DOM.listener.bindEventsForTables();
        e.target.innerHTML = isReset ? 'Submit' : 'Reset';
        isReset && (searchField.value = '');
      };

      if (searchField.value.length > 2) {
        const filteredAlbums = albums.filter(({title}) => UTILS.testValue(searchField.value, title));
        const user = {
          ...state.users[userId],
          albums: filteredAlbums,
        };
        filteredAlbums.length && updateTable(user);
      }

      isReset && updateTable(state.users[userId]);
    },
    _handleAddDragEvents(e) {
      const selectedAlbum = DOM.node.getAlbumNode(e);
      if (selectedAlbum) {
        selectedAlbum.addEventListener('dragstart', DD.handleDragStart);
        selectedAlbum.addEventListener('dragend', DD.handleDragEnd);
      }
    },
    _handleRemoveDragEvents(e) {
      const selectedAlbum = DOM.node.getAlbumNode(e);
      if (selectedAlbum) {
        selectedAlbum.removeEventListener('dragstart', DD.handleDragStart);
        selectedAlbum.removeEventListener('dragend', DD.handleDragEnd);
      }
    },
    bindEventsForTables() {
      const tables = $('.table');
      for (const table of tables) {
        table.addEventListener('dragover', DD.handleDragOver);
        table.addEventListener('drop', DD.handleDrop);
        table.addEventListener('mousedown', this._handleAddDragEvents);
        table.addEventListener('mouseup', this._handleRemoveDragEvents);
      }
    },
    bindEventsForSearchForms() {
      const searchButtons = $('.search__button');
      for (const searchBtn of searchButtons) {
        searchBtn.addEventListener('click', this._handleSearch);
      }
    },
  };

  const render = {
    template: {
      tableAlbums(user) {
        return `
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
      },
      searchForm(userId) {
        return `
          <div class='search'>
            <label class='search__label'>Search</label>
            <input class='search__input' type='text'/>
            <button class='search__button' type='submit' data-user=${userId}>Submit</button>
          </div>
      `;
      },
    },

    allTables(users) {
      const listOfTable = Object.values(users).map(this.template.tableAlbums).join('');
      $('main').append(listOfTable);
    },

    tableByUser(user) {
      $(`main [data-user='${user.id}']`).replaceWith(this.template.tableAlbums(user));
    },

    allSearchForm(usersId) {
      const searchForms = usersId.map(this.template.searchForm).join('');
      $('.search-wrap').append(searchForms);
    },
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
    const albumId = +draggableElement.dataset.album;

    const transferFromUser = draggableElement.parentElement.dataset.user;
    const transferToUser = albumNode ? albumNode.parentElement.dataset.user : e.target.dataset.user;

    if (transferFromUser !== transferToUser) {
      Promise.all([
        utilsDrop.handleFromUserRequest(transferFromUser, albumId),
        utilsDrop.handleToUserRequest(transferFromUser, transferToUser, albumId),
      ])
        .then(users => {
          state.users = {...state.users, ...utilsDrop.getUpdatedUsers(users)};
          this.append(draggableElement);
        });
    }
  }

  const utilsDrop = {
    getUpdatedUsers(users) {
      return users.reduce((acc, next) => {
        acc[next.id] = {...next};
        return acc
      }, {});
    },

    handleToUserRequest(userFromId, userToId, albumId) {
      const fromAlbums = state.users[userFromId].albums;
      const transferredAlbum = fromAlbums.find(({id}) => id === albumId);

      transferredAlbum.userId = +userToId;

      const toUserNewData = {
        ...state.users[userToId],
        albums: [...state.users[userToId].albums, transferredAlbum],
      };

      return API.updateUser({id: userToId, data: toUserNewData});
    },

    handleFromUserRequest(userFromId, albumId) {
      const fromUserNewData = {
        ...state.users[userFromId],
        albums: state.users[userFromId].albums.filter(({id}) => id !== albumId),
      };

      return API.updateUser({id: userFromId, data: fromUserNewData});
    }
  };

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


// ================================================================
// UTILS handler
const UTILS = (() => {

  const testValue = (value, text) => {
    const regex = new RegExp(value, 'gi');
    return regex.test(text);
  };

  return {
    testValue,
  }
})();
// API handler END
// ================================================================