pragma solidity 0.6.12;

interface IWETH{
     function transfer(address recipient, uint256 amount) external;
     function withdraw(uint wad) external;
}