// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AccessManager
 * @dev Centralized RBAC for MorphYield protocol.
 */
contract AccessManager is AccessControl {
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");
    bytes32 public constant ENGINE_ROLE = keccak256("ENGINE_ROLE");
    bytes32 public constant RELAY_ROLE = keccak256("RELAY_ROLE");

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function isVault(address account) external view returns (bool) {
        return hasRole(VAULT_ROLE, account);
    }

    function isEngine(address account) external view returns (bool) {
        return hasRole(ENGINE_ROLE, account);
    }

    function isRelay(address account) external view returns (bool) {
        return hasRole(RELAY_ROLE, account);
    }
}