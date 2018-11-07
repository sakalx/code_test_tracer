$(init);

const state = {
  usersId: ['1', '2'],
  users: {},
  draggableEl: null,
  draggableFrom: null,
  draggableTo: null,
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
      EVENT.bindListenerTables();
      EVENT.bindListenerSearchForms();
    });
}


// ================================================================
// API handler
const API = (() => {
  const url = 'https://jsonplaceholder.typicode.com';
  let currentLoading = false;

  const handleError = jqXHR => {
    console.error(`status code: ${jqXHR.status}`);
    console.log(`error message: ${jqXHR.responseText}`)
  };

  const showLoader = (loading = true) => {
    if (currentLoading !== loading) {
      currentLoading = loading;
      $('.spinner').toggleClass('invisible');
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

  const fetchUser = getData({url: `${url}/users`});
  const fetchAlbumsByUser = getData({url: `${url}/users`, endPoint: 'albums'});
  const updateAlbum = putData(`${url}/albums`);

  return {
    getUsers: getAll(fetchUser),
    getAlbumsByUser: getAll(fetchAlbumsByUser),
    updateAlbum,
  }
})();
// API handler END
// ================================================================


// ================================================================
// Templates
const TEMPLATE = (() => {
  const table = user => `
          <div class='table' data-user=${user.id}>
              <div class='table__row table__header'>
                  <div class='table__cell table__cell--short'>id</div>
                  <div class='table__cell'>Title</div>
              </div>
              
              ${user.albums.map(({id, title}) => `
                <div class='table__row table__row--items' data-album=${id} draggable='true'>
                    <div class='table__cell table__cell--short'>${id}</div>
                    <div class='table__cell table__cell--large'>${title}</div>
                </div>
              `).join('')}
              
          </div>
       `;

  const searchForm = userId => `
          <div class='search'>
            <label class='search__label'>Search</label>
            <input class='search__input' type='text'/>
            <button class='search__button' type='submit' data-user=${userId}>Submit</button>
          </div>
        `;

  return {
    table,
    searchForm,
  }
})();
// ================================================================


// ================================================================
// DOM handler
const DOM = (() => {
  const node = {
    getTablesContainer() {
      return $('main');
    },
    getSearchContainer() {
      return $('.search-wrap');
    },
    getSearchField({target}) {
      return target.previousElementSibling;
    },
    getSearchBtn() {
      return $('.search__button');
    },
    getTableElements() {
      return $('.table');
    },
    getTableByUser(id) {
      return $(`main [data-user='${id}']`);
    },
    getTableByAlbum({target}) {
      return target.closest('.table');
    },
    getAlbumElement({target}) {
      return target.closest('.table__row');
    },
    getSelectedElements() {
      return $('.selected');
    },
  };

  const render = {
    allTables(users) {
      const tables = Object.values(users).map(TEMPLATE.table).join('');
      DOM.node.getTablesContainer().append(tables);
    },

    tableByUser(user) {
      DOM.node.getTableByUser(user.id).replaceWith(TEMPLATE.table(user));
    },

    allSearchForm(usersId) {
      const searchForms = usersId.map(TEMPLATE.searchForm).join('');
      DOM.node.getSearchContainer().append(searchForms);
    },
  };

  return {
    node,
    render,
  }
})();
// DOM handler END
// ================================================================


// ================================================================
// EVENT handler
const EVENT = (() => {
  const handleSelect = e => $(DOM.node.getAlbumElement(e)).toggleClass('selected');

  const handleSearch = e => {
    const isReset = e.target.innerHTML === 'Reset';
    const userId = e.target.dataset.user;
    const albums = state.users[userId].albums;
    const searchField = DOM.node.getSearchField(e);

    const updateTable = user => {
      e.target.innerHTML = isReset ? 'Submit' : 'Reset';
      isReset && (searchField.value = '');
      DOM.render.tableByUser(user);
      bindListenerTables();
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
  };

  const handleAddDragEvents = e => {
    const selectedAlbum = DOM.node.getAlbumElement(e);
    if (selectedAlbum) {
      selectedAlbum.addEventListener('dragstart', DD.handleDragStart);
      selectedAlbum.addEventListener('dragend', DD.handleDragEnd);
    }
  };

  const bindListenerTables = () => {
    const tables = DOM.node.getTableElements();
    for (const table of tables) {
      table.addEventListener('dragover', DD.handleDragOver);
      table.addEventListener('drop', DD.handleDrop);
      table.addEventListener('mousedown', handleAddDragEvents);
      table.addEventListener('click', handleSelect);
    }
  };
  const bindListenerSearchForms = () => {
    const searchButtons = DOM.node.getSearchBtn();
    for (const searchBtn of searchButtons) {
      searchBtn.addEventListener('click', handleSearch);
    }
  };

  return {
    bindListenerTables,
    bindListenerSearchForms,
  }
})();
// EVENT handler END
// ================================================================


// ================================================================
// Drag & Drop handler
const DD = (() => {
  const handleDropHint = () => {
    DOM.node.getTableElements().each(function () {
      $(this).data('user') !== +state.draggableFrom && $(this).toggleClass('drop-hint');
    });
  };

  const handleDragOver = e => e.preventDefault();

  const handleDragStart = e => {
    const draggableMultiEl = DOM.node.getSelectedElements();
    const draggableSingleEl = $(e.target);

    state.draggableEl = !!draggableMultiEl.length ? draggableMultiEl : draggableSingleEl;
    state.draggableFrom = DOM.node.getTableByAlbum(e).dataset.user;

    $(state.draggableEl).toggleClass('hold');
    setTimeout(() => $(state.draggableEl).toggleClass('invisible'), 0);
    handleDropHint();
  };

  const handleDragEnd = e => {
    $(DOM.node.getSelectedElements()).removeClass('selected');
    $(state.draggableEl).toggleClass('hold');
    $(state.draggableEl).toggleClass('invisible');
    handleDropHint();
  };

  function handleDrop(e) {
    state.draggableTo = DOM.node.getTableByAlbum(e).dataset.user;
    const {draggableFrom, draggableTo, draggableEl} = state;

    if (draggableFrom === draggableTo) return;

    const draggableAlbumsId = [];
    const draggableAlbumPromises = [];


    draggableEl.each(function () {
      const albumId = $(this).data('album');
      const album = state.users[draggableFrom].albums.find(({id}) => id === albumId);
      const data = {
        ...album,
        userId: +draggableTo,
      };
      draggableAlbumsId.push(albumId);
      draggableAlbumPromises.push(API.updateAlbum({id: albumId, data}));
    });

    const updateStateAlbums = draggableAlbums => {
      const fromAlbums = state.users[draggableFrom].albums;
      const toAlbums = state.users[draggableTo].albums;

      state.users[draggableFrom].albums = fromAlbums.filter(({id}) => !draggableAlbumsId.includes(id));
      state.users[draggableTo].albums = [...toAlbums, ...draggableAlbums];
    };

    Promise.all(draggableAlbumPromises).then(draggableAlbums => {
      $(this).append(draggableEl);
      updateStateAlbums(draggableAlbums);
      console.log(state);
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
// UTILS handler END
// ================================================================