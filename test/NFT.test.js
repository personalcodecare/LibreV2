const { ContractFactory } = require('@ethersproject/contracts');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
var chai = require('chai');
const { ethers, providers } = require('hardhat');
chai.use(require('chai-bignumber')());
use(solidity);

var token;
var lib;
// Start test block

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
async function submitRawTxn(input, sender, ethers, provider, val) {
  const txCount = await provider.getTransactionCount(sender.address);
  var rawTx = {
      nonce: ethers.utils.hexlify(txCount),
      to: input.to,
      value: ethers.utils.hexlify(val),
      gasLimit: ethers.utils.hexlify(19500000),
      gasPrice: ethers.utils.hexlify(5000),
      data: input.data
  };
  const rawTransactionHex = await sender.signTransaction(rawTx);
  const { hash } = await provider.sendTransaction(rawTransactionHex);
  return await provider.waitForTransaction(hash);
}
describe('Test NFT', function () {
  before(async function () {
    this.NFT = await ethers.getContractFactory("NFT");
    this.Libre = await ethers.getContractFactory("LibToken");
  });

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    lib = await this.Libre.deploy();
    await lib.deployed();
    token = await this.NFT.deploy("Test","TEST", lib.address);
    await token.deployed();
    for(var i=0;i<100;i++){
      await token.initRarity(25*i + 1,25*i+25,[2,6,3,1,5,4,3,1,2,3,4,1,5,1,3,2,1,3,5,1,2,4,3,1,3]);
    }

    await token.setURI("https://ipfs.io/ipfs/");
    await token.setCID("QmPhribQrECVnJaaK9z5nnMJB4AQHFrXLFUyhHpwyD9fUN/");
  
  });

  // it('Owner reserve mint test',async ()=>{
  //   await token.ownerReserve(50);
  //   bal = await token.balanceOf(owner.address);
  //   var arr=[];
  //   for(var i=0;i<bal;i++){
  //     arr.push(await token.tokenOfOwnerByIndex(owner.address, i));
  //   }
  //   expect(arr.length).to.equal(50);
  //   await expect(token.ownerReserve(50)).to.revertedWith("Owner is already reserved");
  // })
  it('Mint test',async function(){
    await token.connect(user1).mintWithEth({value:BigInt(1*10**18)});
    expect(await token.balanceOf(user1.address)).to.equal(1);
    await lib.transfer(user2.address, BigInt(10*10**18));
    await lib.connect(user2).approve(token.address, BigInt(10*10**18));
    await token.connect(user2).mintWithLib();
    expect(await token.balanceOf(user2.address)).to.equal(2);
    ownerBalance = await ethers.provider.getBalance(owner.address);

    await token.withdrawAll();
    
    ownerBalance2 = await ethers.provider.getBalance(owner.address);
    console.log(ownerBalance)
    console.log(ownerBalance2)
  });
  // it('URI test',async function(){
  //   await token.connect(user1).mintWithEth({value:BigInt(1*10**18)});
  //   expect(await token.balanceOf(user1.address)).to.equal(1);
  //   id = await token.tokenOfOwnerByIndex(user1.address, 0);
  //   console.log(id)
  //   console.log(await token.tokenURI(id));
  // });
  // it('Rarity test',async function(){
  //   await token.connect(user1).mintWithEth({value:BigInt(1*10**18)});
  //   id = await token.tokenOfOwnerByIndex(user1.address, 0);
  //   rarity = await token.getRarity(id)
  //   expect(rarity).to.above(0)
  //   expect(rarity).to.below(7)
  //   expect(await token.unmintedTokens(id-2)).to.equal(parseInt(id)-1);
  //   expect(await token.unmintedTokens(id-1)).to.equal(parseInt(id)+1);
  // });
  // it('Maximum mint allowance test',async()=>{
  //   for(var i=0;i<10;i++) await token.connect(user1).mintWithEth({value:BigInt(1*10**18)});
  //   expect(await token.balanceOf(user1.address)).to.equal(10);
  //   await expect(token.connect(user1).mintWithEth({value:BigInt(1*10**18)})).to.revertedWith("You have reached maximum mint allowance with BNB");

  //   await lib.transfer(user2.address, BigInt(10*10**18));
  //   await lib.connect(user2).approve(token.address, BigInt(10*10**18));
  //   for(var i=0;i<5;i++) await token.connect(user2).mintWithLib();
  //   expect(await token.balanceOf(user2.address)).to.equal(10);
  //   await expect(token.connect(user2).mintWithLib()).to.revertedWith("You have reached maximum mint allowance with Libre");

  // }); 
  it('Mint All test',async function(){
    for(var i=0;i<9;i++){
      time = Date.now();
      await token.ownerReserve(250);
      console.log(`Owner reserve ${i} ,left=${(await token.unMintedCount())}, processing time=${Date.now() - time}`);
    } 
    await lib.transfer(user2.address, BigInt(10*10**18));
    await lib.connect(user2).approve(token.address, BigInt(10*10**18));

    await token.ownerReserve(249);
    await token.connect(user2).mintWithLib();
    console.log(await token.balanceOf(user2.address))
    // for(var i=1;i<=2500;i++){
    //   expect(await token.ownerOf(i)).to.equal(owner.address);
    // }
    // expect(await token.balanceOf(owner.address)).to.equal(50)
    // let wallets = [];
    // for (var i = 0; i < 100; i++) {
    //     var temp = await ethers.Wallet.createRandom();
    //     await owner.sendTransaction({
    //         to: temp.address,
    //         value: ethers.utils.parseEther("12")
    //     });
    //     await lib.transfer(temp.address, BigInt(10*10**18));
    //     input = await lib.connect(temp).populateTransaction.approve(token.address, BigInt(10**25));
    //     await submitRawTxn(input, temp, ethers, ethers.provider, 0);

    //     for(var j=0;j<5;j++){
    //       input = await token.connect(temp).populateTransaction.mintWithEth();
    //       await submitRawTxn(input, temp, ethers, ethers.provider, BigInt(1*10**18));
    //       await submitRawTxn(input, temp, ethers, ethers.provider, BigInt(1*10**18));
    //       input = await token.connect(temp).populateTransaction.mintWithLib();
    //       await submitRawTxn(input, temp, ethers, ethers.provider, 0);
    //     }
    //     wallets[i] = temp;
    //     console.log(`wallet ${i} done`)
    // }
    // for(var i=0;i<100;i++) expect(await token.balanceOf(wallets[i].address)).to.equal(20)
    // for(var i=1;i<=2500;i++) expect(await token.ownerOf(i)).to.not.equal("0x0000000000000000000000000000000000000000");
    // for(var i=0;i<10;i++)console.log(await token.getBestRarity(wallets[i].address));
    // await expect(token.connect(user1).mintWithEth({value:BigInt(1*10**18)})).to.revertedWith("All NFT has mint");

  });
});



