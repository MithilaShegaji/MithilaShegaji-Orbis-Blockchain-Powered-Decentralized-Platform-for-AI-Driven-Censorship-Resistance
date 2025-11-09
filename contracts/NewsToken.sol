//NewsToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title NewsToken (ERC20) with MINTER_ROLE
/// @notice Simple ERC20 token for governance / staking. Controlled minter role so only backend/oracle/controller can mint initial onboarding tokens.
contract NewsToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /// @notice Mint tokens to an address. Restricted to MINTER_ROLE.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Helper: burn tokens (optional) — restricted to caller itself (user can burn their tokens)
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
