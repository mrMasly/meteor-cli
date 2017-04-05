var fs = require('fs'),
  path = require('path'),
  build = require('./build'),
  testMeteor = require('../help/testMeteor'),
  exec = require('../help/exec');

var deploy = function() {

  var json, jsonFile;

  // только в meteor приложении
  if(!testMeteor()) return false;

  // проверяем чтобы был сервер
  jsonFile = process.env.PWD+'/package.json'
  if(!fs.existsSync(jsonFile)) {
    console.log("Файл package.json не найден".red);
    return false;
  }
  json = JSON.parse(fs.readFileSync(jsonFile));

  if(!json._mc.remote) {
    console.log("Удаленный сервер не указан в package.json -> _mc".red);
    return false;
  }

  var fileName = require('path').basename(process.env.PWD) + '.tar.gz';
  var file = require('path').dirname(process.env.PWD)+'/'+fileName;

  var user = json._mc.remote.user,
    ip = json._mc.remote.ip,
    path = json._mc.remote.path,
    service = json._mc.remote.service;

  // собираем под linux
  build('..', 'linux');

  // останавливаем приложение
  exec("ssh root@"+ip+" 'service "+service+" stop'");

  // отправляем файл на сервер
  console.log("Копируем на сервер...".yellow);
  rsync = []
  rsync.push("rsync -a");
  rsync.push(file);
  rsync.push(user+"@"+ip+":"+path);
  rsync = rsync.join(' ');
  exec(rsync);

  // распаковываем файл на сервере
  console.log("Запускаем приложение на сервере...".yellow);
  cmd = "ssh "+user+"@"+ip+" 'cd "+path+"; tar -xf "+fileName+" bundle --strip-components=1; rm -f "+fileName+"; cd programs/server; npm i' ";
  exec(cmd);

  // запускам приложение
  exec("ssh root@"+ip+" 'service "+service+" start'");
  console.log("Готово!".green);
}



module.exports = deploy;
