var colors = require('colors');
var isMeteor = require('./isMeteor');

var testMeteor = function() {
  if(!isMeteor) {
    console.log('It`s not meteor app'.red);
  }
  return isMeteor;
}

module.exports = testMeteor;
