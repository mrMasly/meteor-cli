var execSync = require('child_process').execSync,
  _ = require('lodash');

var exec = function(cmd) {
  return _.trim(execSync(cmd, {encoding:"utf8"}));
}

module.exports = exec;
