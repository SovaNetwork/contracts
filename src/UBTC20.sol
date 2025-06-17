// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@solady/tokens/ERC20.sol";

abstract contract UBTC20 is ERC20 {
    struct Pending {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => Pending) internal _pendingDeposits;
    mapping(address => Pending) internal _pendingWithdrawals;

    /* --------------------------- GETTERS ---------------------------- */

    function pendingDepositOf(address user) public view returns (uint256) {
        return _pendingDeposits[user].amount;
    }

    function pendingWithdrawalOf(address user) public view returns (uint256) {
        return _pendingWithdrawals[user].amount;
    }

    /// @notice Returns the number of tokens the user can actually transfer.
    /// @dev This subtracts any pending deposit amounts that have not yet been
    ///      finalized via `_mint`. Even though `balanceOf(user)` may reflect
    ///      zero, a future `_maybeFinalize()` could mint tokens. This function
    ///      ensures a user cannot transfer unfinalized deposit amounts in the
    ///      same transaction.
    /// @param user The address to query for unlocked (finalized) token balance.
    /// @return uint256 Transferable token balance, minus any unminted pending deposits.
    function unlockedBalanceOf(address user) public view returns (uint256) {
        return balanceOf(user) - _pendingDeposits[user].amount;
    }

    /* ------------------------- TRANSFER OVERRIDES ------------------------- */

    function transfer(address to, uint256 amount) public override returns (bool) {
        _maybeFinalize(msg.sender);
        require(amount <= unlockedBalanceOf(msg.sender), "UBTC: transfer > unlocked");
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _maybeFinalize(from);
        require(amount <= unlockedBalanceOf(from), "UBTC: transferFrom > unlocked");
        return super.transferFrom(from, to, amount);
    }

    /* ------------------------- INTERNAL HOUSEKEEPING ------------------------- */

    /// @notice Deferred accounting mechanism. The update of _pendingDeposits
    /// state triggers slot locking checks and will be reverted if locks are active
    function _maybeFinalize(address user) internal {
        // Finalize deposit if slot is unlocked
        if (_pendingDeposits[user].amount > 0) {
            uint256 amount = _pendingDeposits[user].amount;
            delete _pendingDeposits[user];

            _mint(user, amount);
        }

        // Finalize withdrawal if slot is unlocked
        if (_pendingWithdrawals[user].amount > 0) {
            uint256 amount = _pendingWithdrawals[user].amount;
            delete _pendingWithdrawals[user];

            _burn(user, amount);
        }

    }

    /// @dev use this in deposit logic
    function _setPendingDeposit(address user, uint256 amount) internal {
        _pendingDeposits[user] = Pending({amount: amount, timestamp: block.timestamp});
    }

    function _setPendingWithdrawal(address user, uint256 amount) internal {
        _pendingWithdrawals[user] = Pending({amount: amount, timestamp: block.timestamp});
    }

    /* ---------------------------------- PUBLIC ----------------------------------- */

    function finalize(address user) external {
        _maybeFinalize(user);
    }
}
