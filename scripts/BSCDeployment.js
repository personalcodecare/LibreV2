const hre = require("hardhat");

const LIBRE = "0x4B303C3bFEA56A252D2573ec9A30dE8Efb9d00FD";
const WBNB = "0x54d8b11d6a0437A48fEB1F92fb21418E269ac5fa";
const CAKE = "0x72B81909583ca4C9ccc8374eDD3e770C5181bB16";
const BAKE = "***REMOVED***";
const BUSD = "0x3072e6d4F00Afaa19c06F9eecF0ef8CEE4A2f414";
const LibRouter = "0xF71B135dd1653F65f863a8E5e441C653e1A9c5CF";
const UniRouter = "0x6DB204655db08DF024b9B9F011B61B52c13F1791";
const LBREBNB = {"address":"0x941147e47F85400C533E80b4F6488AB78d298410","weight":25};
const LBREBUSD = {"address":"0x3BA195B9a7565B58cACb7E2866cF4e84e75E8D02","weight":25};
const BNBCAKE = {"address":"0x3B9bcae37AaC21bdF24433612AB3CdDFBC2B5E76","weight":15};
const BAKEBUSD = {"address":"0x3c615eC222BC2F247A7fC9f63d4C9e651CaC8D05","weight":15};
const BNBBUSD = {"address":"0x4AC0f6915090491C538467B77792933C5c996ebA","weight":10};
async function main() {
  const [owner] = await hre.ethers.getSigners();
  LibToken = await ethers.getContractAt("LibToken",LIBRE);
  chefV2 = await ethers.getContractAt("MasterChefV2","0x72B0921e55f88ee1620a887F1a0c01D019e8154F");
  BoosterNFT = await ethers.getContractAt("NFT","0xd4c5BaF9578072Db0588d408A4Cf960C9565FE25");
  // await LibToken.setChef(chefV2.address);
  // console.log('setChef done...');
  // await chefV2.add(LBREBNB.weight, LBREBNB.address, [WBNB, LIBRE], true, true);
  // await chefV2.add(LBREBUSD.weight, LBREBUSD.address, [BUSD, LIBRE], true, false);
  // await chefV2.add(BNBCAKE.weight, BNBCAKE.address, [WBNB, CAKE], true, true);
  // await chefV2.add(BAKEBUSD.weight, BAKEBUSD.address, [BAKE, BUSD], true, false);
  // await chefV2.add(BNBBUSD.weight, BNBBUSD.address, [WBNB, BUSD], true, true);
  // console.log('add Pool done...');
  // await chefV2.setBoosterNFT(BoosterNFT.address);
  // for(var i=0;i<25;i++){
  //   await BoosterNFT.initRarity(10*i + 1,10*i+10,[1,2,2,6,3,1,5,4,3,1]);
  //   console.log(`id ${10*i + 1} to ${10*i+10} complete`);
  // }
  // await BoosterNFT.setURI("https://ipfs.io/ipfs/");
  // await BoosterNFT.setCID("QmPhribQrECVnJaaK9z5nnMJB4AQHFrXLFUyhHpwyD9fUN/");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
