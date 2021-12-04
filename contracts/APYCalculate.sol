pragma solidity 0.6.12;

import './interface/IUniswapFactory.sol';
import './MasterChef.sol';
contract APYCalcualte{
    
    using SafeMath for uint256;
    using SafeMath for uint112;
    address public USD;
    address public LBRE;
    IUniswapFactory public factory;
    MasterChef public chef;

    constructor(address _USD, address _LBRE, address _factory, address payable _chef)public{
        USD = _USD;
        LBRE = _LBRE;
        factory = IUniswapFactory(_factory);
        chef = MasterChef(_chef);
    }
   function USDToToken0(address _token0)public view returns(uint256){
        require(_token0 != USD, "USDToToken0 input cannot be USD address");
        address token0USD = factory.getPair(_token0, USD);
        IUniswapPair token0USDPair = IUniswapPair(token0USD);
        IERC20 usd = token0USDPair.token0() == USD ?IERC20(token0USDPair.token0()) :IERC20(token0USDPair.token1());
        IERC20 token0 = token0USDPair.token0() == USD ?IERC20(token0USDPair.token1()) :IERC20(token0USDPair.token0());
        (uint112 reserve0, uint112 reserve1,) = token0USDPair.getReserves(); 
        uint256 res0 = token0USDPair.token0() == USD ?uint256(reserve1) * (10**uint256(usd.decimals())) :uint256(reserve0) * (10**uint256(usd.decimals()));
        uint256 resUSD = token0USDPair.token0() == USD ?uint256(reserve0) * (10**uint256(token0.decimals())) :uint256(reserve1) * (10**uint256(token0.decimals()));
        return res0.mul(1e18).div(resUSD);
    }
    function LbreToUSD(uint256 input)public view returns(uint256){
        address lbreUSD = factory.getPair(USD, LBRE);
        IUniswapPair lbreUSDPair = IUniswapPair(lbreUSD);
        IERC20 usd = lbreUSDPair.token0() == USD ?IERC20(lbreUSDPair.token0()) :IERC20(lbreUSDPair.token1());
        IERC20 lbre = lbreUSDPair.token0() == USD ?IERC20(lbreUSDPair.token1()) :IERC20(lbreUSDPair.token0());
        (uint112 reserve0, uint112 reserve1,) = lbreUSDPair.getReserves(); 
        uint256 res0 = lbreUSDPair.token0() == USD ?uint256(reserve1) * (10**uint256(usd.decimals())) :uint256(reserve0) * (10**uint256(usd.decimals()));
        uint256 resUSD = lbreUSDPair.token0() == USD ?uint256(reserve0) * (10**uint256(lbre.decimals())) :uint256(reserve1) * (10**uint256(lbre.decimals()));
        return input.mul(resUSD).div(res0);
    }
    function APYC(uint8 _pid) public view returns(uint256 lpOutput, uint256 rewardPerBlock){
        // PoolInfo storage pool = chef.poolInfo[_pid];
        (IERC20 lp,address[]memory lpPath,uint256 allocPoint) = chef.forAPYC(_pid);
        uint256 totalAllocPoint = chef.totalAllocPoint(); 
        uint256 libPerBlock = chef.libPerBlock();
        IERC20 token0 = IERC20(lpPath[0]);
        if(_pid != 0){
            IUniswapPair pair = IUniswapPair(address(lp));
            uint256 USDToToken0 = address(token0) == USD ?1e18 :USDToToken0(address(token0));
            uint256 token0input = USDToToken0.div(2);
            (uint112 reserve0, uint112 reserve1,) = pair.getReserves(); 
            uint256 lpOutput = (lpPath[0] == pair.token0()) ?token0input * pair.totalSupply() / uint256(reserve0) 
            :token0input * pair.totalSupply() / uint256(reserve1);
            uint256 rewardPerBlock = lpOutput.mul(libPerBlock).div(lp.balanceOf(address(chef)));
            rewardPerBlock = rewardPerBlock.mul(allocPoint).div(totalAllocPoint);
            rewardPerBlock = LbreToUSD(rewardPerBlock);
            return (lpOutput, rewardPerBlock);
        }else{
            uint256 libInput = 1e18;
            rewardPerBlock = libInput.mul(libPerBlock).div(chef.totalStaked());
            rewardPerBlock = rewardPerBlock.mul(allocPoint).div(totalAllocPoint);
            return (0, rewardPerBlock);
        }
    }
    function LPtoUSD(address lp)public view returns(uint256 LPToUSD, uint256 totalLP, uint256 token0, uint256 token1, string memory token0Symbol, string memory token1Symbol){
        IUniswapPair pair = IUniswapPair(lp);
        IERC20 token0 = IERC20(pair.token0());
        IERC20 token1 = IERC20(pair.token1());
        (uint112 res0, uint112 res1,)=pair.getReserves();
        uint256 token0Value;
        uint256 token1Value;
        uint256 LPToUSD;
        uint256 totalLP = pair.totalSupply();
        if(res0 != 0 && res1 != 0){
            token0Value = address(token0) != USD ?res0.mul(tokenToUSD(address(token0))).div(1e18) : res0;
            token1Value = address(token1) != USD ?res1.mul(tokenToUSD(address(token1))).div(1e18) : res1;
            if(token0.decimals() != token1.decimals()){
                token0Value = token0Value.mul(10 ** uint256(token1.decimals()));
                token1Value = token1Value.mul(10 ** uint256(token0.decimals()));
                LPToUSD = (token0Value.add(token1Value)).mul(1e36).div(10 ** (uint256(token0.decimals())+uint256(token1.decimals()))).div(totalLP);
            }else{
                LPToUSD = (token0Value.add(token1Value)).mul(1e18).div(totalLP);
            }

        }else{
            token0Value = 0;
            token1Value = 0;
            LPToUSD = 0;
        }
        return (LPToUSD, totalLP,res0, res1, token0.symbol(), token1.symbol());
    }

    function tokenToUSD(address token)public view returns(uint256){
        require(token != USD, "tokenToUSD input cannot be USD address");
        address tokenUSD = factory.getPair(token, USD);
        IUniswapPair tokenUSDPair = IUniswapPair(tokenUSD);
        IERC20 usd = tokenUSDPair.token0() == USD ?IERC20(tokenUSDPair.token0()) :IERC20(tokenUSDPair.token1());
        IERC20 token0 = tokenUSDPair.token0() == USD ?IERC20(tokenUSDPair.token1()) :IERC20(tokenUSDPair.token0());
        (uint112 reserve0, uint112 reserve1,) = tokenUSDPair.getReserves(); 
        uint256 res0 = tokenUSDPair.token0() == USD ?uint256(reserve1) * (10**uint256(usd.decimals())) :uint256(reserve0) * (10**uint256(usd.decimals()));
        uint256 resUSD = tokenUSDPair.token0() == USD ?uint256(reserve0) * (10**uint256(token0.decimals())) :uint256(reserve1) * (10**uint256(token0.decimals()));
        return resUSD.mul(1e18).div(res0);
    }
}