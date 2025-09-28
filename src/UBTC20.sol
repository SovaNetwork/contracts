// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@solady/tokens/ERC20.sol";

abstract contract UBTC20 is ERC20 {
    struct Pending {
        uint256 amount;
        uint256 timestamp;
    }

    struct UserWithdrawRequest {
        uint256 amount;
        uint64 btcGasLimit;
        uint64 operatorFee;
        string destination;
    }

    mapping(address => Pending) internal _pendingDeposits;
    mapping(address => Pending) internal _pendingWithdrawals;
    mapping(address => UserWithdrawRequest) internal _pendingUserWithdrawRequests;

    error PendingTransactionExists();

    /* --------------------------- MODIFIERS ---------------------------- */

    /// @notice Modifier to prevent transfers when user has a pending deposit or withdrawal.
    modifier noPendingTransactions(address user) {
        if (
            _pendingDeposits[user].amount > 0 || _pendingWithdrawals[user].amount > 0
                || _pendingUserWithdrawRequests[user].amount > 0
        ) {
            revert PendingTransactionExists();
        }
        _;
    }

    /* ------------------------------ GETTERS ------------------------------ */

    function pendingDepositAmountOf(address user) public view returns (uint256) {
        return _pendingDeposits[user].amount;
    }

    function pendingDepositTimestampOf(address user) public view returns (uint256) {
        return _pendingDeposits[user].timestamp;
    }

    function pendingWithdrawalAmountOf(address user) public view returns (uint256) {
        return _pendingWithdrawals[user].amount;
    }

    function pendingWithdrawalTimestampOf(address user) public view returns (uint256) {
        return _pendingWithdrawals[user].timestamp;
    }

    /* ----------------------------- OVERRIDES ------------------------------ */

    /// @notice Override transfer to prevent transfers during pending states
    function transfer(address to, uint256 amount) public override noPendingTransactions(msg.sender) returns (bool) {
        return super.transfer(to, amount);
    }

    /// @notice Override transferFrom to prevent transfers during pending states
    function transferFrom(address from, address to, uint256 amount)
        public
        override
        noPendingTransactions(from)
        returns (bool)
    {
        return super.transferFrom(from, to, amount);
    }

    /* ------------------------------- INTERNAL ------------------------------- */

    /**
     * @notice Deferred accounting mechanism. The 'pending' mechanics are enforced
     *         by the EVM execution engine's slot locking feature. Deposits and
     *         withdrawals are not finalized until the _pendingDeposits/_pendingWithdrawals
     *         mappings are 'unlocked'. The pending state allows for the transaction to be
     *         finalized on Bitcoin before updating any base ERC20 state like balance or
     *         total supply.
     */
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

    function _setPendingDeposit(address user, uint256 amount) internal {
        _pendingDeposits[user] = Pending({amount: amount, timestamp: block.timestamp});
    }

    function _setPendingWithdrawal(address user, uint256 amount) internal {
        _pendingWithdrawals[user] = Pending({amount: amount, timestamp: block.timestamp});
    }

    /* -------------------------------- PUBLIC --------------------------------- */

    function finalize(address user) external {
        _maybeFinalize(user);
    }
}
