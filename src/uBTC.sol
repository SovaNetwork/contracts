// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "@solady/auth/Ownable.sol";
import "@solady/tokens/WETH.sol";
import "@solady/utils/ReentrancyGuard.sol";

import "./lib/SovaBitcoin.sol";

/**
 * @title Universal Bitcoin Token (uBTC)
 * @author Sova Labs
 *
 * Bitcoin meets ERC20. Bitcoin meets composability.
 *
 * @custom:predeploy 0x2100000000000000000000000000000000000020
 */
contract uBTC is WETH, Ownable, ReentrancyGuard {
    
    /// @notice Withdrawal request structure
    struct WithdrawalRequest {
        address user;
        uint64 amount;
        uint64 btcGasLimit;
        string destination;
        uint256 timestamp;
        uint256 btcBlockHeight;
        bool processed;
    }

    /// @notice Array to maintain withdrawal queue order
    WithdrawalRequest[] public withdrawalQueue;
    
    /// @notice Track user's position in queue (0 means no pending withdrawal)
    mapping(address => uint256) public userQueuePosition;
    
    /// @notice Index of next withdrawal to be processed
    uint256 public queueHead;
    
    /// @notice Maximum number of pending withdrawals allowed
    uint256 public constant MAX_QUEUE_SIZE = 10000;
    
    /// @notice Maximum amount that can be withdrawn in a single transaction
    uint256 public constant MAX_WITHDRAWAL_AMOUNT = 100000000000; // 1000 BTC in satoshis
    
    /// @notice Minimum withdrawal amount
    uint256 public constant MIN_WITHDRAWAL_AMOUNT = 1; // 0.00000001 BTC in satoshis
    
    /// @notice Contract paused state
    bool public paused;

    error InsufficientDeposit();
    error InsufficientInput();
    error InsufficientAmount();
    error UnsignedInput();
    error InvalidLocktime();
    error BroadcastFailure();
    error AmountTooBig();
    error AmountTooSmall();
    error AlreadyQueued();
    error QueueFull();
    error InvalidDestination();
    error ContractPaused();
    error InvalidQueuePosition();
    error WithdrawalAlreadyProcessed();
    error NoWithdrawalFound();

    event Deposit(bytes32 indexed txid, address indexed user, uint256 amount);
    event WithdrawalQueued(address indexed user, uint256 indexed queuePosition, uint64 amount, string destination);
    event WithdrawalProcessed(address indexed user, bytes32 indexed btcTxid, uint64 amount);
    event WithdrawalCancelled(address indexed user, uint256 indexed queuePosition, uint64 amount);
    event ContractPaused(bool paused);

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlySystemAccount() {
        require(msg.sender == SYSTEM_ACCOUNT(), "Unauthorized: Caller is not SYSTEM_ACCOUNT");
        _;
    }

    constructor() WETH() Ownable() ReentrancyGuard() {
        _initializeOwner(msg.sender);
        // Initialize queue with dummy entry at index 0 to avoid confusion with default mapping values
        withdrawalQueue.push();
    }

    /// @notice Address of the special system account of which there is no known pk.
    function SYSTEM_ACCOUNT() public pure returns (address addr_) {
        addr_ = 0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001;
    }

    function name() public view virtual override returns (string memory) {
        return "Universal Bitcoin";
    }

    function symbol() public view virtual override returns (string memory) {
        return "uBTC";
    }

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    /**
     * @notice Overrides the standard WETH deposit method. Always reverts.
     */
    function deposit() public payable override {
        revert("uBTC: must deposit with native BTC");
    }

    /**
     * @notice Overrides the WETH withdraw method. Always reverts.
     */
    function withdraw(uint256) public pure override {
        revert("uBTC: must use withdrawBTC with destination");
    }

    /**
     * @notice Deposits Bitcoin to mint uBTC tokens
     *
     * @param amount            The amount of satoshis to deposit
     * @param signedTx          Signed Bitcoin transaction
     */
    function depositBTC(uint256 amount, bytes calldata signedTx) 
        public 
        nonReentrant 
        whenNotPaused 
    {
        // Input validations
        if (amount >= type(uint64).max) {
            revert AmountTooBig();
        }
        if (amount == 0) {
            revert InsufficientDeposit();
        }

        // Validate if the transaction is a network deposit and get the decoded tx
        SovaBitcoin.BitcoinTx memory btcTx = SovaBitcoin.isValidDeposit(signedTx, amount);

        // Check if signature is valid and the inputs are unspent
        if (!SovaBitcoin.checkSignature(signedTx)) {
            revert UnsignedInput();
        }

        _mint(msg.sender, amount);

        // Broadcast signed btc tx
        SovaBitcoin.broadcastBitcoinTx(signedTx);

        emit Deposit(btcTx.txid, msg.sender, amount);
    }

    /**
     * @notice Withdraws Bitcoin by burning uBTC tokens and adding to withdrawal queue
     *
     * @param amount            The amount of satoshis to withdraw
     * @param btcGasLimit       Specified gas limit for the Bitcoin transaction (in satoshis)
     * @param btcBlockHeight    The current Bitcoin block height for indexing purposes
     * @param dest              The destination Bitcoin address (bech32)
     */
    function withdrawBTC(
        uint64 amount, 
        uint64 btcGasLimit, 
        uint256 btcBlockHeight,
        string calldata dest
    ) 
        public 
        nonReentrant 
        whenNotPaused 
    {
        // Input validations
        if (amount < MIN_WITHDRAWAL_AMOUNT) {
            revert AmountTooSmall();
        }
        if (amount > MAX_WITHDRAWAL_AMOUNT) {
            revert AmountTooBig();
        }
        if (bytes(dest).length == 0) {
            revert InvalidDestination();
        }
        if (withdrawalQueue.length >= MAX_QUEUE_SIZE) {
            revert QueueFull();
        }

        // Check if user already has pending withdrawal
        if (userQueuePosition[msg.sender] != 0) {
            revert AlreadyQueued();
        }

        // Validate user's balance is high enough to cover the amount and max possible gas
        uint256 totalRequired = uint256(amount) + btcGasLimit;
        if (balanceOf(msg.sender) < totalRequired) {
            revert InsufficientAmount();
        }

        // Add to withdrawal queue
        withdrawalQueue.push(WithdrawalRequest({
            user: msg.sender,
            amount: amount,
            btcGasLimit: btcGasLimit,
            destination: dest,
            timestamp: block.timestamp,
            btcBlockHeight: btcBlockHeight,
            processed: false
        }));

        uint256 queuePosition = withdrawalQueue.length - 1;
        userQueuePosition[msg.sender] = queuePosition;

        _burn(msg.sender, totalRequired);

        emit WithdrawalQueued(msg.sender, queuePosition, amount, dest);
    }

    /**
     * @notice Returns the next 50 pending withdrawals starting from the head of the queue
     * @return requests Array of withdrawal requests (max 50)
     */
    function getPendingWithdrawals() 
        public 
        view 
        returns (WithdrawalRequest[] memory requests) 
    {
        uint256 count = 0;
        uint256 totalPending = 0;
        
        // Count unprocessed withdrawals from queue head (max 50)
        for (uint256 i = queueHead; i < withdrawalQueue.length && count < 50; i++) {
            if (!withdrawalQueue[i].processed) {
                totalPending++;
                count++;
            }
        }

        requests = new WithdrawalRequest[](totalPending);
        count = 0;

        // Fill the array with unprocessed withdrawals
        for (uint256 i = queueHead; i < withdrawalQueue.length && count < totalPending; i++) {
            if (!withdrawalQueue[i].processed) {
                requests[count] = withdrawalQueue[i];
                count++;
            }
        }

        return requests;
    }

    /**
     * @notice Get total number of pending withdrawals
     */
    function getPendingWithdrawalCount() public view returns (uint256 count) {
        for (uint256 i = queueHead; i < withdrawalQueue.length; i++) {
            if (!withdrawalQueue[i].processed) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Get user's current withdrawal request
     */
    function getUserWithdrawal(address user) 
        public 
        view 
        returns (WithdrawalRequest memory request, bool hasRequest) 
    {
        uint256 position = userQueuePosition[user];
        if (position == 0) {
            return (request, false);
        }
        
        return (withdrawalQueue[position], true);
    }

    /**
     * @notice Process multiple withdrawals from the queue
     * @param btcTxids Array of Bitcoin transaction IDs for processed withdrawals
     * @param count Number of withdrawals to process from the head
     */
    function adminProcessWithdrawals(bytes32[] calldata btcTxids, uint256 count) 
        public 
        onlySystemAccount 
    {
        require(btcTxids.length == count, "Array length mismatch");
        
        uint256 processed = 0;
        uint256 startHead = queueHead;
        
        for (uint256 i = startHead; i < withdrawalQueue.length && processed < count; i++) {
            if (!withdrawalQueue[i].processed) {
                withdrawalQueue[i].processed = true;
                userQueuePosition[withdrawalQueue[i].user] = 0; // Reset user position
                
                emit WithdrawalProcessed(
                    withdrawalQueue[i].user, 
                    btcTxids[processed], 
                    withdrawalQueue[i].amount
                );
                
                processed++;
                
                // Update queue head to skip processed items
                if (i == queueHead) {
                    queueHead++;
                }
            }
        }
        
        require(processed == count, "Could not process requested number of withdrawals");
    }

    /**
     * @notice Cancel a user's withdrawal and refund tokens (emergency function)
     * @param user Address of the user whose withdrawal to cancel
     */
    function adminCancelWithdrawal(address user) 
        public 
        onlyOwner 
    {
        uint256 position = userQueuePosition[user];
        if (position == 0) {
            revert NoWithdrawalFound();
        }
        
        WithdrawalRequest storage request = withdrawalQueue[position];
        if (request.processed) {
            revert WithdrawalAlreadyProcessed();
        }
        
        // Mark as processed and refund
        request.processed = true;
        userQueuePosition[user] = 0;
        
        uint256 refundAmount = uint256(request.amount) + request.btcGasLimit;
        _mint(user, refundAmount);
        
        emit WithdrawalCancelled(user, position, request.amount);
    }

    /**
     * @notice Clean up processed withdrawals to save gas (owner function)
     * @param batchSize Number of processed withdrawals to remove from the front
     */
    function adminCleanupQueue(uint256 batchSize) 
        public 
        onlyOwner 
    {
        require(batchSize <= 100, "Batch size too large");
        
        uint256 cleaned = 0;
        while (queueHead < withdrawalQueue.length && cleaned < batchSize) {
            if (withdrawalQueue[queueHead].processed) {
                // Move the last element to current position and pop
                if (queueHead < withdrawalQueue.length - 1) {
                    withdrawalQueue[queueHead] = withdrawalQueue[withdrawalQueue.length - 1];
                    // Update position mapping if moving an unprocessed item
                    if (!withdrawalQueue[queueHead].processed) {
                        userQueuePosition[withdrawalQueue[queueHead].user] = queueHead;
                    }
                }
                withdrawalQueue.pop();
                cleaned++;
            } else {
                break; // Stop when we hit unprocessed items
            }
        }
    }

    /**
     * @notice Emergency pause/unpause function
     */
    function setPaused(bool _paused) public onlyOwner {
        paused = _paused;
        emit ContractPaused(_paused);
    }

    /**
     * @notice Admin function for burning tokens (emergency use)
     */
    function adminBurn(address wallet, uint256 amount) 
        public 
        onlyOwner 
    {
        _burn(wallet, amount);
    }

    /**
     * @notice Admin function for minting tokens (emergency use)
     */
    function adminMint(address wallet, uint256 amount) 
        public 
        onlyOwner 
    {
        _mint(wallet, amount);
    }

    /**
     * @notice Get queue statistics
     */
    function getQueueStats() 
        public 
        view 
        returns (
            uint256 totalInQueue,
            uint256 pendingCount,
            uint256 headPosition,
            uint256 nextAvailablePosition
        ) 
    {
        return (
            withdrawalQueue.length,
            getPendingWithdrawalCount(),
            queueHead,
            withdrawalQueue.length
        );
    }
}