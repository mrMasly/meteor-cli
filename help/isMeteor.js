var fs = require('fs'),
  isMeteor, dir, meteor;



// директория приложения
dir = process.env.PWD;

// директория .meteor
meteor = dir + '/.meteor';

// определяем, является ли текущая папка метеор-приложением
isMeteor = fs.existsSync(meteor);


module.exports = isMeteor;
