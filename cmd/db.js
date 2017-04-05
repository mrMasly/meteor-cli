var fs = require('fs'),
  path = require('path'),
  colors = require('colors'),
  inquirer =  require('inquirer'),
  testMeteor = require('../help/testMeteor'),
  exec = require('../help/exec'),
  _ = require('lodash'),
  Fiber = require('fibers');
var db = function(type) {



  // только в meteor приложении
  if(!testMeteor()) return false;

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

  if(type == 'get') {
    get(json._mc);
  } else if(type == 'send') {
    send(json._mc);
  } else {
    console.log("Нужно указать тип [get/send]".red);
    return false;
  }

  // var fileName = require('path').basename(process.env.PWD) + '.goods';
  // var file = require('path').dirname(process.env.PWD)+'/'+fileName;


}

// получаем БД с сервера
var get = function(mc) {

  var user = mc.remote.user,
        ip = mc.remote.ip,
      path = mc.remote.path;

  // выбираем коллекции
  var cmd = "ssh "+user+"@"+ip+" 'mongo "+mc.remote.db+" --quiet --eval \"db.getCollectionNames()\"'"
  json = collections = JSON.parse(exec(cmd));
  json.unshift('ALL COLLECTIONS');

  inquirer.prompt([{
    type: 'checkbox',
    choices: json,
    name: "collections",
    message: 'Выберите коллекции'
  }]).then(function(a) {


    if (a.collections.length) {
      if (a.collections[0] == 'ALL COLLECTIONS') {
        a.collections = _.slice(collections, 1);
      }
    }

    collections = a.collections

    var make = function(i) {

      if(collections[i] == null) {
        console.log("Готово!".green);
      } else {
        one = collections[i]
        inquirer.prompt([{
          type: 'input',
          name: 'query',
          message: 'mongo query'
        }]).then(function(an) {

          query = an.query


          // получаем названия файла для дампа
          file = path+'/'+one+'.json';

          var dir = require('path').dirname(process.env.PWD)

          // делаем дамп на сервере
          add = ''
          if(query) {add = '--query \''+query+'\'';}
          var dump = "ssh "+user+"@"+ip+" 'mongoexport -h localhost -d "+mc.remote.db+" -c "+one+" > "+file+" "+add+"'";
          // копируем на компьютер (в родительскую папку проекта)
          var copy = "rsync -a "+user+"@"+ip+":"+file+" "+dir;
          // загружаем в БД

          if(query) {
            var imprt = 'mongo --eval "db.'+mc.db+'.remove('+query+')";';
            imprt+= "mongoimport -h localhost:27017 -d "+mc.db+" -c "+one+" < "+dir+"/"+one+".json";
          } else {
            var imprt = "mongoimport -h localhost:27017 -d "+mc.db+" -c "+one+" < "+dir+"/"+one+".json --drop --batchSize 1";
          }



          // удаляем все дампы
          var del = "rm "+dir+"/"+one+".json; ssh "+user+"@"+ip+" 'rm "+file+"'";

          console.log("Получаем "+one.yellow+"...");

          exec(dump);
          exec(copy);
          exec(imprt);
          exec(del);

          make(i+1);
        });

      }

    }

    make(0);

  });
}



// отправляем БД на сервер
var send = function(mc) {

  var user = mc.remote.user,
        ip = mc.remote.ip,
      path = mc.remote.path;

  // выбираем коллекции
  var cmd = "mongo "+mc.db+" --port 27017 --quiet --eval 'db.getCollectionNames()'"
  json = collections = JSON.parse(exec(cmd));
  json.unshift('ALL COLLECTIONS');
  inquirer.prompt([{
    type: 'checkbox',
    choices: json,
    name: "collections",
    message: 'Выберите коллекции'
  }]).then(function(a) {

    if (a.collections.length) {
      if (a.collections[0] == 'ALL COLLECTIONS') {
        a.collections = _.slice(collections, 1);
      }
    }

    // проходимся по всем коллекция, которые нужно синхронизировать
    a.collections.forEach(function(one) {

      // получаем названия файла для дампа
      file = require('path').dirname(process.env.PWD)+'/'+one+'.json';

      // делаем дамп
      var dump = "mongoexport -h localhost:27017 -d "+mc.db+" -c "+one+" > "+file+"  --jsonArray";
      // копируем на сервер
      var copy = "rsync -a "+file+" "+user+"@"+ip+":"+path;
      // загружаем на сервер
      var imprt = "ssh "+user+"@"+ip+" 'cd ~/"+path+"; mongoimport -h localhost -d "+mc.remote.db+" -c "+one+" < "+one+".json --drop --jsonArray'";
      // удаляем все дампы
      var del = "rm "+file+"; ssh "+user+"@"+ip+" 'cd ~/"+path+"; rm "+one+".json'";

      console.log("Отправляем "+one.yellow+"...");

      exec(dump);
      exec(copy);
      exec(imprt);
      exec(del);

    });

    console.log("Готово!".green);

  });




}

module.exports = db;
