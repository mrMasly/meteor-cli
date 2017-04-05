module.exports = function() {
  var dir, fs, getServerFile, globwatcher;

  globwatcher = require('globwatcher').globwatcher;
  fs = require('fs-extra');

  dir = process.env.PWD;



  getServerFile = function(file) {
    return file.replace(dir + "/client", dir + "/server");
  };

  testServer = function(file) {
    if (file.indexOf('/server/')+1) return true;
    else if(file.indexOf('/server.')+1) return true;
    else return false;
  };

  watcher = globwatcher(dir+"/client/**/*.coffee");

  watcher.on("added", function(file) {
    if(!testServer(file)) return false;
    // console.log('added', file);
    var serverFile;
    serverFile = getServerFile(file);
    return fs.copy(file, serverFile);
  });

  watcher.on("changed", function(file) {
    if(!testServer(file)) return false;
    // console.log('changed', file);
    var serverFile;
    serverFile = getServerFile(file);
    return fs.copy(file, serverFile);
  });

  watcher.on("deleted", function(file) {
    if(!testServer(file)) return false;
    // console.log('deleted', file);
    var serverFile;
    serverFile = getServerFile(file);
    return fs.remove(serverFile);
  });

};
