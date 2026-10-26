// Kapsül çizim kitaplığı (v46 kaynağı): LOOK.svg(görünüş, 'fig' | 'av')
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const SRC = path.resolve(__dirname, '../../v46/kaynak/kapsul/kapsul-cizim-kutuphanesi.js');
const ctx = { Math, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(SRC, 'utf8') + '\n;this.LOOK=LOOK;', ctx);
module.exports = ctx.LOOK;
