$(init);

function init() {
  console.log('ready');
}

// State
const state = {
  users: {
 /*   id: {
      id: '',
      albums: [],
    },*/
  },

  selectedAlbums: [],
  loading: false,
  hintDrop: false,
};

// DOM
const DOM = {

};

// API
function getUser(userId) {
  console.log('getUser');
}

function getAlbumsByUser(userId) {
  console.log('getAlbumsByUser');
}

function updateAlbumsOfUser(userId, albumId) {
  console.log('updateUserAlbum');
}

function showLoader(loading = true) {
  console.log('showLoader');
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
