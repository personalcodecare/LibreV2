const {merge} = require("sol-merger");
fs = require("fs");

async function start(){
    const code = await merge('UniswapV2Pair.sol');
    fs.writeFile("UniswapPair.sol",code,(err)=>{
        if(err)console.log(err);
    })
}
start();