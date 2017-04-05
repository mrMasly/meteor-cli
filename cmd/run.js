var spawn = require('child_process').spawn;
var testMeteor = require('../help/testMeteor');
var net = require('net');
var fs = require('fs');
module.exports = function() {

  // проверяем что мы в meteor-приложении
  if(!testMeteor()) return false;


  jsonFile = process.env.PWD+'/package.json'
  if(!fs.existsSync(jsonFile)) {
    console.log("Файл package.json не найден".red);
    return false;
  }
  json = JSON.parse(fs.readFileSync(jsonFile));
  var mc = json._mc;

  if(mc == null) return false;


  // запускаем Meteor
  cmd = 'export MONGO_URL=mongodb://localhost:27017/'+mc.db+'; meteor';
  meteor = spawn(cmd);
  meteor.stdout.on('data', function(data) {
    process.stdout.write(data);
  });





}
