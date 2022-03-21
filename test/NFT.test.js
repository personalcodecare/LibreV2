const { ContractFactory } = require('@ethersproject/contracts');
const { expect, use } = require('chai');
const { solidity } = require('ethereum-waffle');
var chai = require('chai');
const { ethers, providers } = require('hardhat');
chai.use(require('chai-bignumber')());
use(solidity);

var token;
// Start test block

async function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}
describe('Test NFT', function () {
  before(async function () {
    this.NFT = await ethers.getContractFactory("NFT");
  
  });

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
    token = await this.NFT.deploy("Test","TEST");
    await token.deployed();
    
  });

  it('Token mint test',async ()=>{
    await token.mint({value:BigInt(1*10**18)});
    expect(await token.getRarity(1)).to.equal(await token.getBestRarity(owner.address));
    expect(await token.ownerOf(1)).to.equal(owner.address);
  })
  it('Rarity test',async function(){
    var rarityCount = [0,0,0,0,0,0];
    rank1_supply = await token.rarity_left(1);
    rank2_supply = await token.rarity_left(2);
    rank3_supply = await token.rarity_left(3);
    rank4_supply = await token.rarity_left(4);
    rank5_supply = await token.rarity_left(5);
    rank6_supply = await token.rarity_left(6);
    for(var i = 1;i <=60;i ++){
      await token.connect(user1).mint({value:BigInt(1*10**18)});
      var rarity = await token.getRarity(i);
      rarityCount[rarity-1]++;
    }
    expect(rarityCount[0]).to.equal(rank1_supply);
    expect(rarityCount[1]).to.equal(rank2_supply);
    expect(rarityCount[2]).to.equal(rank3_supply);
    expect(rarityCount[3]).to.equal(rank4_supply);
    expect(rarityCount[4]).to.equal(rank5_supply);
    expect(rarityCount[5]).to.equal(rank6_supply);
    expect(await token.getBestRarity(user1.address)).to.equal(6);
    expect(await token.getBestRarity(owner.address)).to.equal(0);
  });

 
});



