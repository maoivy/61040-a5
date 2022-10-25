/* eslint-disable @typescript-eslint/restrict-template-expressions */

/**
 * Fields is an object mapping the names of the form inputs to the values typed in
 * e.g. for createUser, fields has properites 'username' and 'password'
 */

function viewCollectionsByUser(fields) {
  fetch(`/api/collection?userId=${fields.userId}`)
    .then(showResponse)
    .catch(showResponse);
}

function createCollection(fields) {
  fetch('/api/collection', {method: 'POST', body: JSON.stringify(fields), headers: {'Content-Type': 'application/json'}})
    .then(showResponse)
    .catch(showResponse);
}

function editCollection(fields) {
  fetch(`/api/collection/${fields.collectionId}`, {method: 'PUT', body: JSON.stringify(fields), headers: {'Content-Type': 'application/json'}})
    .then(showResponse)
    .catch(showResponse);
}

function deleteCollection(fields) {
  fetch(`/api/collection/${fields.collectionId}`, {method: 'DELETE'})
    .then(showResponse)
    .catch(showResponse);
}
