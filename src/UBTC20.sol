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

    uint256 internal constant DEPOSIT_CONFIRM_TIMEOUT = 60 minutes;
    uint256 internal constant WITHDRAW_CONFIRM_TIMEOUT = 60 minutes;

    /* --------------------------- GETTERS ---------------------------- */

    function pendingDepositOf(address user) public view returns (uint256) {
        return _pendingDeposits[user].amount;
    }

    function pendingWithdrawalOf(address user) public view returns (uint256) {
        return _pendingWithdrawals[user].amount;
    }

    function unlockedBalanceOf(address user) public view returns (uint256) {
        return balanceOf(user) - _pendingDeposits[user].amount;
    }

    /* ------------------------- TRANSFER OVERRIDES ------------------------- */

    function transfer(address to, uint256 amount) public override returns (bool) {
        _maybeClearPending(msg.sender);
        require(amount <= unlockedBalanceOf(msg.sender), "UBTC: transfer > unlocked");
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _maybeClearPending(from);
        require(amount <= unlockedBalanceOf(from), "UBTC: transferFrom > unlocked");
        return super.transferFrom(from, to, amount);
    }

    /* ------------------------- INTERNAL HOUSEKEEPING ------------------------- */

    /// Try to clear expired pending balances
    function _maybeClearPending(address user) internal {
        // Clear failed deposit
        if (
            _pendingDeposits[user].amount > 0
                && block.timestamp > _pendingDeposits[user].timestamp + DEPOSIT_CONFIRM_TIMEOUT
        ) {
            _burn(user, _pendingDeposits[user].amount);
            delete _pendingDeposits[user];
        }

        // Refund failed withdrawal
        if (
            _pendingWithdrawals[user].amount > 0
                && block.timestamp > _pendingWithdrawals[user].timestamp + WITHDRAW_CONFIRM_TIMEOUT
        ) {
            _mint(user, _pendingWithdrawals[user].amount);
            delete _pendingWithdrawals[user];
        }
    }

    /// @notice use this in your deposit logic
    function _setPendingDeposit(address user, uint256 amount) internal {
        _pendingDeposits[user] = Pending({amount: amount, timestamp: block.timestamp});
    }

    function _clearPendingDeposit(address user) internal {
        delete _pendingDeposits[user];
    }

    function _setPendingWithdrawal(address user, uint256 amount) internal {
        _pendingWithdrawals[user] = Pending({amount: amount, timestamp: block.timestamp});
    }

    function _clearPendingWithdrawal(address user) internal {
        delete _pendingWithdrawals[user];
    }
}
