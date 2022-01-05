pragma solidity 0.6.12;
import './IERC20.sol';

interface ILibre is IERC20 {
    function chef()external view returns (address);
    function setChef(address chef) external;
    function mint(address _to, uint256 _amount) external;
}