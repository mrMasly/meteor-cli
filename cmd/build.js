var exec = require('../help/exec'),
  colors = require('colors');
var oss = {
  linux: "os.linux.x86_64"
}

var build = function(dir, os) {

  // директория по умолчанию
  dir = dir || '.';

  // определяем операционную систему
  if(!os || os == '') {
    os = oss.linux;
  } else if(oss[os]) {
    os = oss[os];
  } else {
    console.log("Операционная система не найдена: "+os);
    return false;
  }



  // собираем команду
  process.stdout.write("Собираем приложение для "+os.yellow+"...");
  // console.log(("Собираем приложение для "+os+"...").yellow);
  cmd = "meteor build --architecture " + os + " " + dir;
  exec(cmd);
  // console.log('Готово!'.green);
  process.stdout.write("Готово!".green+"\n");



}
module.exports = build;
