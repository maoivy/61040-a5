/**
 * Fields is an object mapping the names of the form inputs to the values typed in
 * e.g. for createUser, fields has properites 'username' and 'password'
 */

function getFeed() {
  fetch('/api/feed')
    .then(showResponse)
    .catch(showResponse);
}