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
describe('Test NFT', function () {
  before(async function () {
    this.NFT = await ethers.getContractFactory("NFT");
    this.Libre = await ethers.getContractFactory("LibToken");
  });

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
    lib = await this.Libre.deploy();
    await lib.deployed();
    token = await this.NFT.deploy("Test","TEST", lib.address);
    await token.deployed();
    for(var i=0;i<25;i++){
      await token.initRarity(10*i + 1,10*i+10,[1,2,2,6,3,1,5,4,3,1]);
    }

    await token.setURI("https://ipfs.io/ipfs/");
    await token.setCID("QmPhribQrECVnJaaK9z5nnMJB4AQHFrXLFUyhHpwyD9fUN/");
  
  });

  it('Owner reserve mint test',async ()=>{
    await token.ownerReserve(10);
    bal = await token.balanceOf(owner.address);
    var arr=[];
    for(var i=0;i<bal;i++){
      arr.push(await token.tokenOfOwnerByIndex(owner.address, i));
    }
    // console.log(arr);
    expect(arr.length).to.equal(10);
  })
  it('Mint test',async function(){
    await token.connect(user1).mintWithEth({value:BigInt(1*10**18)});
    expect(await token.balanceOf(user1.address)).to.equal(1);
    await lib.transfer(user2.address, BigInt(10*10**18));
    await lib.connect(user2).approve(token.address, BigInt(10*10**18));
    await token.connect(user2).mintWithLib();
    expect(await token.balanceOf(user2.address)).to.equal(2);
  });
  it('URI test',async function(){
    await token.connect(user1).mintWithEth({value:BigInt(1*10**18)});
    expect(await token.balanceOf(user1.address)).to.equal(1);
    id = await token.tokenOfOwnerByIndex(user1.address, 0);
    console.log(id)
    console.log(await token.tokenURI(id));
  });
  it('Rarity test',async function(){
    await token.connect(user1).mintWithEth({value:BigInt(1*10**18)});
    id = await token.tokenOfOwnerByIndex(user1.address, 0);
    rarity = await token.getRarity(id)
    expect(rarity).to.above(0)
    expect(rarity).to.below(7)
    expect(await token.unmintedTokens(id-2)).to.equal(parseInt(id)-1);
    expect(await token.unmintedTokens(id-1)).to.equal(parseInt(id)+1);
  });
 
});



