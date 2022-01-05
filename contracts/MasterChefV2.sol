pragma solidity 0.6.12;

import './utils/Ownable.sol';
import './utils/ReentrancyGuard.sol';

import './lib/SafeERC20.sol';

import './interface/ILibre.sol';
import './interface/IWETH.sol';
import './interface/IUniswapRouter.sol';
import './interface/IUniswapPair.sol';
import './interface/IUniswapFactory.sol';
contract MasterChefV2 is Ownable,ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of SUSHIs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accSushiPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accSushiPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }
    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. SUSHIs to distribute per block.
        uint256 lastRewardBlock; // Last block number that SUSHIs distribution occurs.
        address[] lpPath;
        address routerAddress;
        uint256 accLibPerShare; // Accumulated LIBs per share, times 1e12. See below.
        bool isETHPair; // non-Libre LP will be charged 5% fee on withdraw
    }
    // The LIB TOKEN!
    ILibre public lib;
    // Dev address.
    address public devaddr;
    // Lib tokens created per block.
    uint256 public libPerBlock;
    // Lib tokens burn per block.
    IUniswapRouter public uniRouter;
    IUniswapRouter public libreRouter;
    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    //set true after a new lp be added
    mapping (address=>uint256) public pidMapping;
    // Total allocation poitns. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when SUSHI mining starts.
    uint256 public startBlock;
    uint256 public totalStaked = 0;
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount, uint256 token1Amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );
    IWETH public WETH;
    constructor(
        address[]memory _lib,
        address _devaddr,
        address _libRouter,
        address _uniRouter,
        uint256 _libPerBlock
    ) public {
        require(_devaddr != address(0),"_devaddr cannot be 0");
        lib = ILibre(_lib[0]);
        libreRouter = IUniswapRouter(_libRouter);
        uniRouter = IUniswapRouter(_uniRouter);
        devaddr = _devaddr;
        // startBlock = block.number;
        libPerBlock = _libPerBlock;
        totalAllocPoint = totalAllocPoint.add(10);
        WETH = IWETH(uniRouter.WETH());
        poolInfo.push(
            PoolInfo({
                lpToken: lib,
                allocPoint: 10,
                routerAddress: address(0),
                lpPath:_lib,
                lastRewardBlock: 0,
                accLibPerShare: 0,
                isETHPair: false
            })
        );
    }
    function setLibrePerBlock(uint256 _libPerBlock) external onlyOwner{
        libPerBlock = _libPerBlock;
    }
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }
    function getPoolInfo(uint256 _pid)external view returns(address lp, uint256 allocPoint, uint256 lastRewardBlock, address[]memory lpPath, uint256 accLibPerShare, bool isETHpair, address router){
        PoolInfo storage pool = poolInfo[_pid];
        return (address(pool.lpToken), pool.allocPoint, pool.lastRewardBlock, pool.lpPath, pool.accLibPerShare, pool.isETHPair, pool.routerAddress);
    }
    function setRouter(address _router, uint8 index)external onlyOwner{
        require(_router != address(0),"_uniRouter cannot be 0");
        if(index == 0) uniRouter = IUniswapRouter(_router);
        else if(index == 1)libreRouter = IUniswapRouter(_router);
    }
    function forAPYC(uint8 _pid)external view returns(IERC20, address[]memory, uint256){
        return (poolInfo[_pid].lpToken, poolInfo[_pid].lpPath, poolInfo[_pid].allocPoint);
    }

    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        address[] memory _lpPath,
        bool _withUpdate,
        bool _isETHPair
    ) external onlyOwner {
        require(pidMapping[address(_lpToken)]==0,"LP already in pool");
        require(address(_lpToken) != address(lib), "LP cannot be LIBRE");
        pidMapping[address(_lpToken)] = poolInfo.length;
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock =
            block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        IERC20 token0 = IERC20(_lpPath[0]);
        IERC20 token1 = IERC20(_lpPath[1]);
        IUniswapPair pair = IUniswapPair(address(_lpToken));
        require((pair.token0() == _lpPath[0] && pair.token1() == _lpPath[1]) || (pair.token0() == _lpPath[1] && pair.token1() == _lpPath[0]), "pair does not exist");
        token0.approve(address(uniRouter),2**95);
        token1.approve(address(uniRouter),2**95);
        token0.approve(address(libreRouter),2**95);
        token1.approve(address(libreRouter),2**95);
        _lpToken.approve(address(uniRouter),2**95);
        _lpToken.approve(address(libreRouter),2**95);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lpPath:_lpPath,
                lastRewardBlock: lastRewardBlock,
                routerAddress: address(uniRouter),
                accLibPerShare: 0,
                isETHPair: _isETHPair
            })
        );
    }
    
    // Update the given pool's allocation point. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        address[] memory _lpPath,
        address _router,
        bool _withUpdate
    ) external onlyOwner validatePoolByPid(_pid){
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
        poolInfo[_pid].lpPath = _lpPath;
        poolInfo[_pid].routerAddress = _router;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) internal view returns (uint256){
        require(_from >= startBlock, "_from can not less than startBlock!");
        return _to.sub(_from);
    }
    // View function to see pending SUSHIs on frontend.
    function pendingLib(uint256 _pid, address _user)
        external
        view validatePoolByPid(_pid)
        returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accLibPerShare = pool.accLibPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 libReward =  multiplier.mul(libPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accLibPerShare = accLibPerShare.add(
                libReward.mul(1e12).div(lpSupply)
            );
        }
        return user.amount.mul(accLibPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public validatePoolByPid(_pid){
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = _pid == 0 ?totalStaked :pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 libReward =
            multiplier.mul(libPerBlock).mul(pool.allocPoint).div(
                totalAllocPoint
            );

        lib.mint(address(this),libReward);
        pool.accLibPerShare = pool.accLibPerShare.add(
            libReward.mul(1e12).div(lpSupply)
        );
        pool.lastRewardBlock = block.number;
    }
    function stake(uint256 _amount) public nonReentrant{
        lib.transferFrom(msg.sender, address(this), _amount);
        updatePool(0);
        totalStaked = totalStaked.add(_amount);
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(pool.accLibPerShare).div(1e12).sub(
                    user.rewardDebt
                );
            uint256 fee = pending.mul(2).div(100);

            safeLibreTransfer(msg.sender, pending.sub(fee));
            safeLibreTransfer(devaddr, fee);
        }
        user.amount = user.amount.add(_amount);
        user.rewardDebt = user.amount.mul(pool.accLibPerShare).div(1e12);
        emit Deposit(msg.sender, 0, _amount, 0);
    }
    function unstake(uint256 _amount)public nonReentrant{
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        if(lib.chef() == address(this))updatePool(0);
        totalStaked = totalStaked.sub(_amount);
        require(user.amount >= _amount, "withdraw: not good");
        uint256 pending =
            user.amount.mul(pool.accLibPerShare).div(1e12).sub(
                user.rewardDebt
            );
        uint256 fee = pending.mul(2).div(100);

        user.amount = user.amount.sub(_amount);
        safeLibreTransfer(msg.sender, pending.sub(fee));
        safeLibreTransfer(devaddr, fee);
        user.rewardDebt = user.amount.mul(pool.accLibPerShare).div(1e12);
        safeLibreTransfer(address(msg.sender),_amount);
        emit Withdraw(msg.sender, 0, _amount);
    }
    function claimReward(uint256 _pid)public validatePoolByPid(_pid) nonReentrant{
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(lib.chef() == address(this),"Libre: Farm is closed");
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(pool.accLibPerShare).div(1e12).sub(
                    user.rewardDebt
                );
            uint256 fee = pending.mul(2).div(100);

            safeLibreTransfer(msg.sender, pending.sub(fee));
            safeLibreTransfer(devaddr, fee);
        }
        user.rewardDebt = user.amount.mul(pool.accLibPerShare).div(1e12);
        
    }
    function restake()public nonReentrant{
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(lib.chef() == address(this),"Libre: Farm is closed");
        updatePool(0);

        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(pool.accLibPerShare).div(1e12).sub(
                    user.rewardDebt
                );
            uint256 fee = pending.mul(2).div(100);

            // safeLibreTransfer(msg.sender, pending.sub(fee));
            safeLibreTransfer(devaddr, fee);
            uint256 amount = pending.sub(fee);
            user.amount = user.amount.add(amount);        
            totalStaked = totalStaked.add(amount);
        }
        user.rewardDebt = user.amount.mul(pool.accLibPerShare).div(1e12);

    }
    function depositLP(uint256 _pid, uint256 _amount)public validatePoolByPid(_pid) nonReentrant {
        require(_pid>0,"pool 0 is for staking");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        IUniswapPair poolLP = IUniswapPair(address(pool.lpToken));
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(pool.accLibPerShare).div(1e12).sub(
                    user.rewardDebt
                );
            uint256 fee = pending.mul(2).div(100);

            safeLibreTransfer(msg.sender, pending.sub(fee));
            safeLibreTransfer(devaddr, fee);
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accLibPerShare).div(1e12);
    }
    // function depositBoth(uint256 _pid, uint _amount0, uint _amount1) public validatePoolByPid(_pid) nonReentrant payable{
    //     require(_pid>0,"pool 0 is for staking");
    //     PoolInfo storage pool = poolInfo[_pid];
    //     UserInfo storage user = userInfo[_pid][msg.sender];
    //     uint256 lpBefore = pool.lpToken.balanceOf(address(this));
    //     if(pool.lpPath[0]!= address(WETH))IERC20(pool.lpPath[0]).transferFrom(msg.sender, address(this), _amount0);
    //     if(pool.lpPath[1]!= address(WETH))IERC20(pool.lpPath[1]).transferFrom(msg.sender, address(this), _amount1);
    //     uint256 token0init = pool.isETHPair ?address(this).balance :IERC20(pool.lpPath[0]).balanceOf(address(this));
    //     uint256 token1Before = pool.isETHPair ?address(this).balance :IERC20(pool.lpPath[1]).balanceOf(address(this));
    //     _addLibLiquidity(msg.sender, pool.isETHPair, msg.value, IERC20(pool.lpPath[0]), IERC20(pool.lpPath[1]), token0init, token1Before, _amount0, _amount1);
    //     uint256 lpAmount = pool.lpToken.balanceOf(address(this)).sub(lpBefore);
    //     uint256 fee = lpAmount.mul(2).div(100);
    //     lpAmount = lpAmount.sub(fee);
    //     pool.lpToken.transfer(devaddr,fee);
    //     user.amount = user.amount.add(lpAmount);
    //     user.rewardDebt = user.amount.mul(pool.accLibPerShare).div(1e12);
    //     emit Deposit(msg.sender, _pid, _amount0, lpAmount);
    // }
    function deposit(uint256 _pid, uint256 _amount, uint8 _slippage, bool _revert) public validatePoolByPid(_pid) nonReentrant payable{
        require(_pid>0,"pool 0 is for staking");
        require(_slippage<=20,"slippage range not greater than 2%");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(pool.accLibPerShare).div(1e12).sub(
                    user.rewardDebt
                );
            uint256 fee = pending.mul(2).div(100);

            safeLibreTransfer(msg.sender, pending.sub(fee));
            safeLibreTransfer(devaddr, fee);
        }
        uint256 lpBefore = pool.lpToken.balanceOf(address(this));
        if(msg.value>0 && pool.isETHPair && !_revert) _amount = msg.value;

        address[] memory lpPath = new address[](2);
        lpPath[0] = _revert ?pool.lpPath[1]:pool.lpPath[0];
        lpPath[1] = _revert ?pool.lpPath[0]:pool.lpPath[1];
        
        uint256 token1Amount=_swap(msg.sender, lpPath, _amount,_slippage, IUniswapRouter(pool.routerAddress));
        uint256 lpAmount = pool.lpToken.balanceOf(address(this)).sub(lpBefore);

        uint256 fee = lpAmount.mul(2).div(100);
        lpAmount = lpAmount.sub(fee);
        pool.lpToken.transfer(devaddr,fee);
        user.amount = user.amount.add(lpAmount);
        user.rewardDebt = user.amount.mul(pool.accLibPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount, token1Amount);
    }

    function _swap(address payable _to, address[]memory lpPath, uint256 _amount, uint8 _slippage, IUniswapRouter _uniRouter)private returns (uint256){
        IERC20 token0 = IERC20(lpPath[0]);
        IERC20 token1 = IERC20(lpPath[1]);
        // bool _isETH = lpPath[0] == address(WETH);
        uint256 token0init = lpPath[0] == address(WETH)?address(this).balance :token0.balanceOf(address(this));
        if(lpPath[0] != address(WETH))token0.transferFrom(_to, address(this), _amount);
    
        uint256 token1Before = lpPath[1] == address(WETH)? address(this).balance:token1.balanceOf(address(this));

        uint256 minAmount = _slippageCalculate(token0, token1, _amount.div(2), _slippage, _uniRouter);
        if(lpPath[0] == address(WETH)) _uniRouter.swapExactETHForTokens{value: _amount.div(2)}(minAmount, lpPath, address(this), block.timestamp);
        else _uniRouter.swapExactTokensForTokens(_amount.div(2), minAmount, lpPath, address(this), block.timestamp);
        
       
        uint256 token0Amount = lpPath[0] == address(WETH) ?_amount.div(2) :token0init.add(_amount).sub(token0.balanceOf(address(this))); 
        uint256 token1Amount = token1.balanceOf(address(this)).sub(token1Before);
        bool _isETH = lpPath[0] == address(WETH);
        _addLibLiquidity(_to, _isETH, _amount, token0, token1, token0init, token1Before, token0Amount, token1Amount);

        return token1Amount;
    }
    function _addLibLiquidity(address payable _to, bool _isETH, uint256 _amount, IERC20 token0, IERC20 token1, uint256 token0init, uint256 token1Before,uint256 token0Amount, uint256 token1Amount)private{
        if(address(token0) == address(WETH)) libreRouter.addLiquidityETH{value: token0Amount}(address(token1),token1Amount,0,0,address(this), block.timestamp);
        else libreRouter.addLiquidity(address(token0), address(token1), token0Amount, token1Amount, 0 , 0, address(this), block.timestamp);
        uint256 token0leftOver = address(token0) == address(WETH) ?address(this).balance.sub(token0init.sub(_amount)) :token0.balanceOf(address(this)).sub(token0init); 
        uint256 token1leftOver = token1.balanceOf(address(this)).sub(token1Before); 
        
        if(token0leftOver>0 && !_isETH)token0.transfer(_to, token0leftOver);
        else if(token0leftOver>0 && _isETH)_to.transfer(token0leftOver);
        if(token1leftOver>0)token1.transfer(_to, token1leftOver);

    }
    function _slippageCalculate(IERC20 token0, IERC20 token1, uint256 input, uint8 _slippage, IUniswapRouter _uniRouter)private view returns(uint256){
        address[] memory t = new address[](2);
        t[0] = address(token0);
        t[1] = address(token1);
        // uint256 exceptedAmount = uniRouter.getAmountsOut(input, t)[1].mul(1000-_slippage).div(1000);
        return _uniRouter.getAmountsOut(input, t)[1].mul(1000-_slippage).div(1000);
    }
    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) public validatePoolByPid(_pid) nonReentrant payable{
        require(_pid>0,"pool 0 is for staking");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        IERC20 token0 = IERC20(pool.lpPath[0]);
        IERC20 token1 = IERC20(pool.lpPath[1]);

        require(user.amount >= _amount, "withdraw: not good");
        if(lib.chef() == address(this))updatePool(_pid);
        uint256 pending =
            user.amount.mul(pool.accLibPerShare).div(1e12).sub(
                user.rewardDebt
            );
        uint256 fee = pending.mul(2).div(100);
        uint256 token0Before = token0.balanceOf(address(this));
        uint256 token1Before = token1.balanceOf(address(this));

        libreRouter.removeLiquidity(address(token0), address(token1), _amount, 0 , 0, address(this), block.timestamp);
        uint256 token0Amount = token0.balanceOf(address(this)).sub(token0Before);
        uint256 token1Amount = token1.balanceOf(address(this)).sub(token1Before);
        user.amount = user.amount.sub(_amount);
        safeLibreTransfer(msg.sender, pending.sub(fee));
        safeLibreTransfer(devaddr, fee);
        user.rewardDebt = user.amount.mul(pool.accLibPerShare).div(1e12);
        if(pool.isETHPair){
            WETH.withdraw(uint(token0Amount));
            msg.sender.transfer(token0Amount);
            // token0.transfer(address(msg.sender),token0Amount);
        }
        else token0.transfer(address(msg.sender),token0Amount);
        token1.transfer(address(msg.sender),token1Amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    receive() external payable {}
    
    // Safe sushi transfer function, just in case if rounding error causes pool to not have enough Libres.
    function safeLibreTransfer(address _to, uint256 _amount) internal {
        uint256 libBal = lib.balanceOf(address(this));
        if (_amount > libBal) {
            lib.transfer(_to, libBal);
        } else {
            lib.transfer(_to, _amount);
        }
    }

   
    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) public nonReentrant{
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        if(_pid>0) pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        else{
            safeLibreTransfer(address(msg.sender),user.amount);
            totalStaked = totalStaked.sub(user.amount);
        }
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        
        user.amount = 0;
        user.rewardDebt = 0;
    }
    modifier validatePoolByPid(uint256 _pid){
        require(_pid<poolInfo.length, "Pool does not exist");
        _;
    }
    // Update dev address by the previous dev.
    function dev(address _devaddr) public {
        require(msg.sender == devaddr, "dev: wut?");
        devaddr = _devaddr;
    }
}