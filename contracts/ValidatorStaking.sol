//ValidatorStaking.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ValidatorStaking
/// @notice Validators stake NEWS tokens to participate in article validation.
/// ArticleRegistry (or other admin) can reward or slash validators.
contract ValidatorStaking is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Minimum stake required to become a validator (100 NEWS tokens)
    uint256 public constant MIN_STAKE = 100 * 10**18;

    IERC20 public immutable newsToken;

    mapping(address => uint256) public stakedBalance;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event Rewarded(address indexed validator, uint256 amount);
    event Slashed(address indexed validator, uint256 amount);

    constructor(address tokenAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        newsToken = IERC20(tokenAddress);
    }

    /// @notice Stake NEWS tokens
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        // Ensure total stake meets minimum requirement
        uint256 newBalance = stakedBalance[msg.sender] + amount;
        require(newBalance >= MIN_STAKE, "Must stake at least 100 NEWS tokens");

        require(
            newsToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        stakedBalance[msg.sender] = newBalance;
        emit Staked(msg.sender, amount);
    }

    /// @notice Unstake tokens (without penalties for now)
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked");

        stakedBalance[msg.sender] -= amount;
        require(newsToken.transfer(msg.sender, amount), "Transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    /// @notice View total staked in the system
    function totalStaked() external view returns (uint256) {
        return newsToken.balanceOf(address(this));
    }

    /// @notice Reward validator (only callable by accounts with ADMIN_ROLE)
    /// ArticleRegistry will be given ADMIN_ROLE so it can call this.
    function rewardValidator(address validator, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(validator != address(0), "Invalid validator");
        require(amount > 0, "Invalid amount");

        // mint-like behavior: we increase staked balance (assumes tokens already in pool / rewards are internal)
        // If you want to transfer tokens from treasury, change logic accordingly.
        stakedBalance[validator] += amount;
        emit Rewarded(validator, amount);
    }

    /// @notice Slash validator stake (only callable by accounts with ADMIN_ROLE)
    function slashValidator(address validator, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(validator != address(0), "Invalid validator");
        require(amount > 0, "Invalid amount");
        require(stakedBalance[validator] >= amount, "Insufficient stake");

        stakedBalance[validator] -= amount;
        emit Slashed(validator, amount);
    }
}
