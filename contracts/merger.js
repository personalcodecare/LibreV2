const { merge } = require('sol-merger');
fs = require('fs');
async function start(){
    const mergedCode = await merge("./MasterChefV2.sol");
    // console.log(mergedCode);
    fs.writeFile("MasterChefV2_verify.sol",mergedCode, (err)=>{
        if(err)console.log(err);
    });
}
start();