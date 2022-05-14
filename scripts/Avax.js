const hre = require("hardhat");
const rarityArr = require("./rarityArr");
const LIBRE = "0x63db060697b01c6f4a26561b1494685DcbBd998c";
const WBNB = "";
const CAKE = "";
const BAKE = "";
const BUSD = "";
const ZERO="0x0000000000000000000000000000000000000000";
const LibRouter = "0x98Ee246E3aCb2eBA5F5Cc4AF768f4ae989Af3C3e";
const UniRouter = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const LBREBNB = {"address":"0xEc89a7333e897bAB62dbC106b7D5406Bde8E8AA3","weight":40};
const LBREBUSD = {"address":"0xaA50B9675b6C6FaBb75F1f542f5adF53A61963cE","weight":40};
const BNBCAKE = {"address":"0x7A9DA03d738301ad4928Da2351Bb9007be45a2aE ","weight":1};
const BAKEBUSD = {"address":"0x403Af8046E92607525F686FA5C78D93ec6257354 ","weight":1};
const BNBBUSD = {"address":"0x5D83533C903F2B4F50516aa2E684Fe742519Ffc3 ","weight":10};
async function main() {
  const [owner] = await hre.ethers.getSigners();
  // LibToken = await ethers.getContractAt("LibToken",LIBRE);

  chefV2 = await ethers.getContractAt("MasterChefV2","");

  // BoosterNFT = await ethers.getContractAt("NFT","0x1A35Cb725bA2E08F93b5b536Dea607f1f57648c7");
  // await LibToken.setChef(chefV2.address);
  // console.log('setChef done...');
  txn = await chefV2.set(0, 18, ZERO, false);
  console.log(await txn.wait())
  txn = await chefV2.add(LBREBNB.weight, LBREBNB.address, [WBNB, LIBRE], LibRouter, true, true);
  console.log(await txn.wait())
  txn = await chefV2.add(LBREBUSD.weight, LBREBUSD.address, [BUSD, LIBRE], LibRouter, true, false);
  console.log(await txn.wait())
  txn = await chefV2.add(BNBCAKE.weight, BNBCAKE.address, [WBNB, CAKE], UniRouter, true, true);
  console.log(await txn.wait())
  txn = await chefV2.add(BAKEBUSD.weight, BAKEBUSD.address, [BAKE, BUSD], UniRouter, true, false);
  console.log(await txn.wait())
  txn = await chefV2.add(BNBBUSD.weight, BNBBUSD.address, [WBNB, BUSD], UniRouter, true, true);
  // console.log('add Pool done...');
  // await chefV2.setBoosterNFT(BoosterNFT.address);
  // console.log(await BoosterNFT.Lib());
  // console.log(owner.address);
  // await BoosterNFT.setURI("https://ipfs.io/ipfs/");
  // await BoosterNFT.setCID("QmPhribQrECVnJaaK9z5nnMJB4AQHFrXLFUyhHpwyD9fUN/");
  // for(var i=0;i<50;i++){ 
  //   var tmp=[];
  //   for(var j=0;j<50;j++)tmp.push(rarityArr[j+i*50]);
  //   txn = await BoosterNFT.initRarity(50*i + 1,50*i+50,tmp);
  //   res = await txn.wait();
  //   console.log(`i=${i}, id ${50*i + 1} to ${50*i+50} complete`);
  // }
  // for(var i=0;i<25;i++){
  //     var tmp=[];
  //   for(var j=0;j<100;j++)tmp.push(rarityArr[j+i*50]);
  //   txn = await BoosterNFT.initRarity(100*i + 1,100*i+100,tmp);
  //   res = await txn.wait();
  //   console.log(`i=${i}, id ${100*i + 1} to ${100*i+100} complete`);
  // }
  // for(var i=1;i<=25;i++){
  //   if((await BoosterNFT.getRarity(100*i + 1))==0)console.log(i+"=0")
  // }
  // await BoosterNFT.setPrice(BigInt(0.38*10**18),BigInt(7868*10**18));
  // txn = await BoosterNFT.ownerReserve(100);
  // res = await txn.wait();
  // console.log(res)
  // txn = await BoosterNFT.ownerReserve(100);
  // res = await txn.wait();
  // console.log(res)
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
