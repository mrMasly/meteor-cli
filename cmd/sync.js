var fs = require('fs'),
  colors = require('colors'),
  inquirer = require('inquirer'),
  testMeteor = require('../help/testMeteor'),
  exec = require('../help/exec'),
  _ = require('lodash');


var sync = function() {

  // только в meteor приложении
  if(!testMeteor()) return false;

  var json, jsonFile;

  // проверяем чтобы был сервер
  jsonFile = process.env.PWD+'/package.json'
  if(!fs.existsSync(jsonFile)) {
    console.log("File package.json does not exists".red);
    return false;
  }
  json = JSON.parse(fs.readFileSync(jsonFile));

  if(!json._mc.remote) {
    console.log("Remote server not exist in package.json -> _mc".red);
    return false;
  }
  var mc = json._mc;

  // проверяем чтобы были папки для синхронизации
  if(!mc.sync) {
    console.error("Не указана папка для синхронизаций (package.json->_mc->sync)");
    return false;
  }

  var user = mc.remote.user,
        ip = mc.remote.ip,
      path = mc.remote.path;


  var dir = {
    local: require('path').normalize(process.env.PWD + '/' + mc.sync),
    remote: require('path').normalize(path+'/'+mc.sync)
  }

  // проверяем чтобы папка для синхронизации существовала
  if(!fs.existsSync(dir.local)) {
    console.error("Не удается найти директорию "+mc.sync);
    return false;
  }

  // проверяем чтобы эта папка существовала на сервере
  var _path = '~', ok = false;
  remoteDirs = _.compact(dir.remote.split('/'));
  remoteDirs.forEach(function(one) {
    files = exec("ssh "+user+"@"+ip+" 'cd "+_path+"; ls'");
    files = files.split("\n");
    if(files.indexOf(one)+1) {
      ok = false;
    } else {
      exec("ssh "+user+"@"+ip+" 'cd "+_path+"; mkdir "+one+"'");
      ok = true;
    }
    _path = _path + '/' + one;
  });


  // смотрим, какие папки есть
  var dirs = [];
  fs.readdirSync(dir.local).map(function(one) {
    if(fs.lstatSync(dir.local+'/'+one).isDirectory()) {
      dirs.push(one);
    }
  });

  inquirer.prompt([{
    type: 'checkbox',
    choices: dirs,
    name: "dirs",
    message: 'Выберите папки для синхронизации'
  }]).then(function(a) {
    a.dirs.forEach(function(one) {
      // console.log("Синхронизируем "+one.yellow);
      process.stdout.write("Синхронизируем "+one.yellow+"...");
      var local = dir.local+"/"+one;
      var remote = user+'@'+ip+':'+dir.remote+'/'+one;
      var cmd1 = "rsync -rtuv "+dir.local+"/"+one+' '+user+'@'+ip+':'+dir.remote,
        cmd2 = "rsync -rtuv "+user+'@'+ip+':'+dir.remote+'/'+one+' '+dir.local;
      var cmd = cmd1 + '; '+ cmd2;
      exec(cmd);
      process.stdout.write(" Готово!".green+"\n");
    });
  });






}



module.exports = sync;
