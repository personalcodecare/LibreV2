const { ContractFactory } = require('@ethersproject/contracts');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
var chai = require('chai');
const { ethers, providers } = require('hardhat');
chai.use(require('chai-bignumber')());
use(solidity);

var TokenABI;
var LibToken;
var TestToken;
var WETH;
var UniFactory;
var UniRouter;
var LibFactory;
var LibRouter;
var chefV2;
var LibSupply =  BigInt(10000*10**18);
var TestSupply = BigInt(1000*10**18);
var ETHSupply = BigInt(1*10**18);
var BoosterNFT;
// Start test block

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
describe('Test Masterchef', function () {
  before(async function () {
    this.UniswapFactory = await ethers.getContractFactory("UniswapV2Factory");
    this.UniswapRouter = await ethers.getContractFactory("UniswapV2Router02");
    this.MasterChef = await ethers.getContractFactory("MasterChefV2");
    this.Lib = await ethers.getContractFactory("LibToken");
    this.Test = await ethers.getContractFactory("BEP20");
    this.WrappedETH = await ethers.getContractFactory("WETH");
    this.NFT = await ethers.getContractFactory("NFT");

    TokenABI = this.Test.interface;
  });

  beforeEach(async function () {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();
    UniFactory = await this.UniswapFactory.deploy(owner.address);
    await UniFactory.deployed();
    LibFactory = await this.UniswapFactory.deploy(owner.address);
    await LibFactory.deployed();
    LibToken = await this.Lib.deploy();
    TestToken = await this.Test.deploy("Test","TEST");
    WETH = await this.WrappedETH.deploy();
    //factory pair created
    UniFactory.createPair(LibToken.address, TestToken.address);
    UniFactory.createPair(LibToken.address, WETH.address);
    UniFactory.createPair(WETH.address, TestToken.address);
    LibFactory.createPair(LibToken.address, TestToken.address);
    LibFactory.createPair(LibToken.address, WETH.address);
    LibFactory.createPair(WETH.address, TestToken.address);

    UniRouter = await this.UniswapRouter.deploy(UniFactory.address, WETH.address);
    await UniRouter.deployed();
    LibRouter = await this.UniswapRouter.deploy(LibFactory.address, WETH.address);
    await LibRouter.deployed();
    await TestToken.mint(BigInt(10**23));
    await WETH.deposit({value:BigInt(10**19)});
    await LibToken.approve(UniRouter.address, BigInt(10**25));
    await TestToken.approve(UniRouter.address, BigInt(10**25));

    await UniRouter.addLiquidity(LibToken.address, TestToken.address,LibSupply,TestSupply, 
    0,0, owner.address, Date.now());
    await UniRouter.addLiquidityETH(LibToken.address, LibSupply, 
    0,0, owner.address, Date.now(),{value:ETHSupply});
    await UniRouter.addLiquidityETH(TestToken.address,TestSupply,
    0,0, owner.address, Date.now(),{value:ETHSupply});

    chefV2 = await this.MasterChef.deploy( [LibToken.address], owner.address, LibRouter.address, UniRouter.address);
    await LibToken.approve(chefV2.address, BigInt(10**25));
    await TestToken.approve(chefV2.address, BigInt(10**25));
    await LibToken.connect(user1).approve(chefV2.address, BigInt(10**25));
    await TestToken.connect(user1).approve(chefV2.address, BigInt(10**25));
    await LibToken.connect(user2).approve(chefV2.address, BigInt(10**25));
    await TestToken.connect(user2).approve(chefV2.address, BigInt(10**25));
    await LibToken.setChef(chefV2.address);
    LibTestPair = await LibFactory.getPair(LibToken.address, TestToken.address);
    LibETHPair = await LibFactory.getPair(LibToken.address, WETH.address);
    TestETHPair = await LibFactory.getPair(WETH.address, TestToken.address);
    chefV2.add(30, LibTestPair, [TestToken.address, LibToken.address], true, false);
    chefV2.add(30, LibETHPair, [WETH.address, LibToken.address], true, true);
    chefV2.add(30, TestETHPair, [WETH.address, TestToken.address], true, true);
    LibToken.transfer(user1.address, BigInt(10**15));
    TestToken.transfer(user1.address, BigInt(10**15));
    LibToken.transfer(user2.address, BigInt(10**15));
    TestToken.transfer(user2.address, BigInt(10**15));
    WETH.transfer(user1.address, BigInt(10**15));
    WETH.transfer(user2.address, BigInt(10**15));    
    WETH.transfer(user3.address, BigInt(10**15));
    WETH.transfer(user4.address, BigInt(10**15));

    BoosterNFT = await this.NFT.deploy("Test","TEST", LibToken.address);
    await BoosterNFT.deployed();
    for(var i=0;i<25;i++){
      await BoosterNFT.initRarity(10*i + 1,10*i+10,[1,2,2,6,3,1,5,4,3,1]);
    }
    // await token.setURI("https://ipfs.io/ipfs/");
    // await token.setCID("QmPhribQrECVnJaaK9z5nnMJB4AQHFrXLFUyhHpwyD9fUN/");

  });

//   it('UniRouter test',async ()=>{
//     await LibToken.approve(UniRouter.address, BigInt(10**15));
//     await TestToken.approve(UniRouter.address, BigInt(10**15));
//     UniRouter.addLiquidity(LibToken.address, TestToken.address, 10000, 1000, 0, 0, owner.address, Date.now());
//     LPToken = await UniFactory.getPair(LibToken.address, TestToken.address);
//     LP = new ethers.Contract(LPToken, TokenABI,ethers.provider);
//     expect(parseInt(await LP.balanceOf(owner.address))).to.above(0);

//     await LibToken.connect(user1).approve(UniRouter.address, BigInt(10**15));
//     await TestToken.connect(user1).approve(UniRouter.address, BigInt(10**15));
//     var LibBal = await LibToken.balanceOf(user1.address);
//     var TestBal = await TestToken.balanceOf(user1.address);
//     await UniRouter.connect(user1).swapExactTokensForTokens(100, 0, [LibToken.address, TestToken.address],user1.address, Date.now());
//     expect(parseInt(await LibToken.balanceOf(user1.address))).to.below(LibBal);
//     expect(parseInt(await TestToken.balanceOf(user1.address))).to.above(TestBal);

//   })
//   it('Stake test', async function () {
//     var stakeAmount = BigInt(10**4);
//     initBal = await LibToken.balanceOf(user1.address);
//     // console.log("inital balance: "+initBal);
//     await chefV2.connect(user1).stake(stakeAmount);
//     // console.log("balance after deposit: "+await LibToken.balanceOf(user1.address))
//     expect(BigInt((await chefV2.userInfo(0,user1.address))[0])).to.eq(stakeAmount);
//     for(var i=0;i<5;i++){//generate 5 blocks
//       await LibToken.approve(chefV2.address, BigInt(10**25));
//     }
//     // console.log("PendingLib: "+parseInt(await chefV2.pendingLib(0,user1.address)));
//     await chefV2.connect(user1).unstake(stakeAmount);
//     bal = await LibToken.balanceOf(user1.address);
//     // console.log("balance after withdraw: "+bal)
//     expect(bal).to.above(initBal);
//   });

//   it('Deposit token test', async ()=>{
//     var depositAmount = 1000000;

//     initBal = await TestToken.balanceOf(user1.address);
//     await chefV2.connect(user1).deposit(1,depositAmount, 0);
//     expect(parseInt(await TestToken.balanceOf(user1.address))).to.below(parseInt(initBal));
//     expect(parseInt((await chefV2.userInfo(1,user1.address))[0])).to.above(0);
//     for(var i=0;i<5;i++){//generate 5 blocks
//       await LibToken.approve(chefV2.address, BigInt(10**25));
//     }
//     await chefV2.massUpdatePools();
//     expect(parseInt(await chefV2.pendingLib(1,user1.address))).to.above(0);
// });
//   it('Deposit LP test', async ()=>{
//     LPToken = await LibFactory.getPair(LibToken.address, TestToken.address);
//     LP = new ethers.Contract(LPToken, TokenABI,ethers.provider);
//     await LibToken.connect(user1).approve(LibRouter.address,BigInt(10**18));
//     await TestToken.connect(user1).approve(LibRouter.address,BigInt(10**18));
//     await LibRouter.connect(user1).addLiquidity(LibToken.address, TestToken.address, 100000000, 100000000, 0, 0, user1.address, Date.now());
//     depositAmount = parseInt(await LP.balanceOf(user1.address))
//     await LP.connect(user1).approve(chefV2.address, BigInt(10**18))
//     await chefV2.connect(user1).depositLP(1,depositAmount);
//     expect(parseInt((await chefV2.userInfo(1,user1.address))[0])).to.above(0);
//   });
//   it('Deposit ETH test', async ()=>{
//     var depositAmount = 1000000;
//     initBal = await LibToken.balanceOf(user1.address);
//     await chefV2.connect(user1).deposit(2,depositAmount, 0,{value:10000});
//     expect(parseInt((await chefV2.userInfo(2,user1.address))[0])).to.above(0);

//     for(var i=0;i<5;i++){//generate 5 blocks
//       await LibToken.approve(chefV2.address, BigInt(10**25));
//     }
//     await chefV2.massUpdatePools();
//     expect(parseInt(await chefV2.pendingLib(2,user1.address))).to.above(0);

//   });
//   it('ClaimReward test', async ()=>{
//     var rewardPeriod = 5;
//     expect(parseInt(await chefV2._rewardPeriod())).to.equal(86400*7);
//     await chefV2.setRewardPeriod(rewardPeriod);
//     expect(parseInt(await chefV2._rewardPeriod())).to.equal(rewardPeriod);
//     var stakeAmount = BigInt(10**4);
//     await chefV2.connect(user1).stake(stakeAmount);
//     await chefV2.connect(user1).deposit(1,100000, 0);

//     expect(BigInt((await chefV2.userInfo(0,user1.address))[0])).to.eq(stakeAmount);
//     for(var i=0;i<5;i++){//generate 5 blocks
//       await LibToken.approve(chefV2.address, BigInt(10**25));
//     }
//     currBal = (parseInt(await LibToken.balanceOf(user1.address)));
//     res = await chefV2.connect(user1).claimReward(1);
//     receipt = await res.wait();
//     var claimEvent = receipt.events.filter(function (one) {
//       return one.event == "RewardClaim";
//     })[0].args;
//     expect(parseInt(claimEvent[1])).to.above(0);
//     expect(parseInt(claimEvent[4])).to.equal(parseInt(claimEvent[3])+rewardPeriod);
//     expect(parseInt(await LibToken.balanceOf(user1.address))).to.above(currBal);
//     await expect(chefV2.connect(user1).claimReward(1)).to.revertedWith("Can claim reward once 7 days");

//     currBal = (parseInt(await LibToken.balanceOf(user1.address)));
//     for(var i=1;i<=rewardPeriod;i++){ //Pass 5 sec
//       await delay(1000);
//       await LibToken.approve(chefV2.address, BigInt(10**25));
//       console.log(`Wait ${i} sec...`);
//     }
//     await chefV2.connect(user1).claimReward(1)
//     expect(parseInt(await LibToken.balanceOf(user1.address))).to.above(currBal);

//   });
//   it('Restake test', async ()=>{
//     var stakeAmount = BigInt(10**4);
//     await chefV2.connect(user1).stake(stakeAmount);
//     expect(BigInt((await chefV2.userInfo(0,user1.address))[0])).to.eq(stakeAmount);
//     for(var i=0;i<5;i++){//generate 5 blocks
//       await LibToken.approve(chefV2.address, BigInt(10**25));
//     }
//     await chefV2.connect(user1).restake();
//     expect(parseInt((await chefV2.userInfo(0,user1.address))[0])).to.above(parseInt(stakeAmount));
//   });
//   it('Fix emission test', async ()=>{
//     libPerBlock=100;
//     await chefV2.setLibrePerBlock(libPerBlock);
//     expect(parseInt(await chefV2.libPerBlock())).to.equal(libPerBlock);
//     await chefV2.connect(user1).stake(10000);
//     await LibToken.approve(chefV2.address, BigInt(10**25));//generate 1 block
//     expect(parseInt(await chefV2.pendingLib(0,user1.address))).to.equal(parseInt(libPerBlock)/10);
//     await chefV2.connect(user1).claimReward(0);
//     expect(parseInt(await chefV2.pendingLib(0,user1.address))).to.equal(0);
//   });
//   it('Change LibRouter test', async ()=>{
//     await LibToken.approve(LibRouter.address, LibSupply);
//     await TestToken.approve(LibRouter.address, TestSupply);
//     await LibRouter.addLiquidity(LibToken.address, TestToken.address,LibSupply,TestSupply, 
//       0,0, owner.address, Date.now());
//     await chefV2.set(1, 30, [TestToken.address, LibToken.address], LibRouter.address,true);
//     expect((await chefV2.poolInfo(1))[3]).to.equal(LibRouter.address);
//     await chefV2.connect(user1).deposit(1,100000, 0);
//     expect((await chefV2.userInfo(1,user1.address))[0]).to.above(0);
//   });
  it('NFT boost test', async ()=>{
    await chefV2.setBoosterNFT(BoosterNFT.address);
    await chefV2.NFTBoostOn(true);
    await BoosterNFT.connect(user3).mintWithEth({value:BigInt(10**18)});
    id = await BoosterNFT.tokenOfOwnerByIndex(user3.address, 0);
    rarity = await BoosterNFT.getRarity(id)
    console.log(rarity)
    expect(await BoosterNFT.getBestRarity(user3.address)).to.equal(rarity);
    var stakeAmount = BigInt(10**5);
    await chefV2.connect(user3).deposit(2,0, 0,{value:stakeAmount});
    await chefV2.connect(user4).deposit(2,0, 0,{value:stakeAmount});
    amount3 = (await chefV2.userInfo(2,user3.address))[0];
    amount4 = (await chefV2.userInfo(2,user4.address))[0];
    // console.log((await chefV2.userInfo(2,user3.address))[0]);
    for(var i=0;i<5;i++){//generate 5 blocks
      await LibToken.approve(chefV2.address, BigInt(10**25));
    }
    await chefV2.connect(user3).withdraw(2,amount3);
    await chefV2.connect(user4).withdraw(2,amount4);

    // await chefV2.connect(user3).claimReward(2);
    // await chefV2.connect(user4).claimReward(2);
    bal = await LibToken.balanceOf(user3.address);
    bal2 = await LibToken.balanceOf(user4.address);
    console.log(bal);
    console.log(bal2);

  });
});



