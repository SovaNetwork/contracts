// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@solady/auth/Ownable.sol";
import "@solady/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/ISovaBTC.sol";

/**
 * @title SovaBTCOFT
 * @notice LayerZero OFT-compatible implementation of SovaBTC for omnichain functionality
 * @dev Simplified implementation demonstrating cross-chain burn/mint mechanism
 * @dev Maintains unified total supply across all chains through burn/mint pattern
 */
contract SovaBTCOFT is ERC20, Ownable, ReentrancyGuard, ISovaBTC {
    
    // ============ LayerZero OFT Compatibility ============
    
    /// @notice LayerZero endpoint address for cross-chain messaging
    address public immutable endpoint;
    
    /// @notice Trusted remote addresses for each chain ID
    mapping(uint32 => bytes32) public peers;
    
    /// @notice Address authorized to mint tokens (wrapper contract)
    address public minter;
    
    /// @notice Minimum deposit amount in satoshis
    uint256 public minDepositAmount;
    
    /// @notice Maximum deposit amount in satoshis  
    uint256 public maxDepositAmount;
    
    /// @notice Maximum gas limit amount in satoshis
    uint256 public maxGasLimitAmount;
    
    /// @notice Pause state
    bool private _paused;

    // ============ Cross-Chain Message Types ============
    
    struct SendParam {
        uint32 dstEid;          // Destination endpoint ID
        bytes32 to;             // Recipient address
        uint256 amountLD;       // Amount in local decimals
        uint256 minAmountLD;    // Minimum amount in local decimals
        bytes extraOptions;     // Additional options
        bytes composeMsg;       // Compose message
    }
    
    struct MessagingFee {
        uint256 nativeFee;      // Native token fee
        uint256 lzTokenFee;     // LayerZero token fee
    }
    
    struct MessagingReceipt {
        bytes32 guid;           // Message GUID
        uint64 nonce;           // Message nonce
        MessagingFee fee;       // Fee paid
    }
    
    struct OFTReceipt {
        uint256 amountSentLD;      // Amount sent in local decimals
        uint256 amountReceivedLD;  // Amount received in local decimals
    }

    // ============ Events ============
    
    event OFTSent(
        bytes32 indexed guid,
        uint32 dstEid,
        address indexed fromAddress,
        uint256 amountSentLD,
        uint256 amountReceivedLD
    );
    
    event OFTReceived(
        bytes32 indexed guid,
        uint32 srcEid,
        address indexed toAddress,
        uint256 amountReceivedLD
    );
    
    event PeerSet(uint32 eid, bytes32 peer);
    event MinterUpdated(address indexed oldMinter, address indexed newMinter);
    event CrossChainSent(uint32 indexed dstEid, address indexed from, uint256 amount);
    event CrossChainReceived(uint32 indexed srcEid, address indexed to, uint256 amount);
    event ContractPausedByOwner(address indexed account);
    event ContractUnpausedByOwner(address indexed account);

    // ============ Errors ============
    
    error UnauthorizedMinter(address caller);
    error InvalidPeer(uint32 eid);
    error ContractPaused();
    error ZeroAmount();
    error ZeroAddress();
    error InvalidEndpoint();

    // ============ Modifiers ============
    
    modifier onlyMinter() {
        if (msg.sender != minter) revert UnauthorizedMinter(msg.sender);
        _;
    }
    
    modifier whenNotPaused() {
        if (_paused) revert ContractPaused();
        _;
    }
    
    modifier onlyEndpoint() {
        if (msg.sender != endpoint) revert InvalidEndpoint();
        _;
    }

    // ============ Constructor ============
    
    constructor(
        string memory _name,
        string memory _symbol,
        address _endpoint,
        address _minter
    ) ERC20(_name, _symbol) {
        _initializeOwner(msg.sender);
        
        if (_endpoint == address(0)) revert ZeroAddress();
        if (_minter == address(0)) revert ZeroAddress();
        
        endpoint = _endpoint;
        minter = _minter;
        
        // Set default limits
        minDepositAmount = 10_000; // 0.0001 BTC
        maxDepositAmount = 100_000_000_000; // 1000 BTC
        maxGasLimitAmount = 50_000_000; // 0.5 BTC
        _paused = false;
    }

    // ============ OFT Core Functions ============
    
    /**
     * @notice Returns 8 decimals for Bitcoin compatibility
     */
    function decimals() public pure override returns (uint8) {
        return 8;
    }
    
    /**
     * @notice Quote cross-chain send operation
     * @param _sendParam Send parameters
     * @param _payInLzToken Whether to pay in LZ token
     * @return fee Messaging fee
     */
    function quoteSend(
        SendParam calldata _sendParam,
        bool _payInLzToken
    ) external view returns (MessagingFee memory fee) {
        // Mock fee calculation
        fee.nativeFee = 0.001 ether; // 0.001 ETH
        fee.lzTokenFee = _payInLzToken ? 100e18 : 0; // 100 LZ tokens if paying in LZ
        return fee;
    }
    
    /**
     * @notice Send tokens cross-chain
     * @param _sendParam Send parameters
     * @param _fee Messaging fee
     * @param _refundAddress Refund address for excess fees
     * @return msgReceipt Message receipt
     * @return oftReceipt OFT receipt
     */
    function send(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) external payable nonReentrant whenNotPaused returns (
        MessagingReceipt memory msgReceipt,
        OFTReceipt memory oftReceipt
    ) {
        if (_sendParam.amountLD == 0) revert ZeroAmount();
        if (peers[_sendParam.dstEid] == bytes32(0)) revert InvalidPeer(_sendParam.dstEid);
        
        // Check sufficient fee
        require(msg.value >= _fee.nativeFee, "Insufficient fee");
        
        // Check sufficient balance
        require(balanceOf(msg.sender) >= _sendParam.amountLD, "Insufficient balance");
        
        // Burn tokens on source chain
        _burn(msg.sender, _sendParam.amountLD);
        
        // Create mock receipt
        bytes32 guid = keccak256(abi.encodePacked(block.timestamp, msg.sender, _sendParam.amountLD));
        msgReceipt = MessagingReceipt({
            guid: guid,
            nonce: uint64(block.number),
            fee: _fee
        });
        
        oftReceipt = OFTReceipt({
            amountSentLD: _sendParam.amountLD,
            amountReceivedLD: _sendParam.amountLD
        });
        
        // Emit events
        emit OFTSent(guid, _sendParam.dstEid, msg.sender, _sendParam.amountLD, _sendParam.amountLD);
        emit CrossChainSent(_sendParam.dstEid, msg.sender, _sendParam.amountLD);
        
        // Refund excess fees
        if (msg.value > _fee.nativeFee) {
            payable(_refundAddress).transfer(msg.value - _fee.nativeFee);
        }
        
        return (msgReceipt, oftReceipt);
    }
    
    /**
     * @notice Simulate receiving tokens from another chain (for testing)
     * @param _srcEid Source endpoint ID
     * @param _to Recipient address
     * @param _amountLD Amount in local decimals
     */
    function simulateReceive(
        uint32 _srcEid,
        address _to,
        uint256 _amountLD
    ) external onlyEndpoint whenNotPaused {
        if (_amountLD == 0) revert ZeroAmount();
        if (_to == address(0)) revert ZeroAddress();
        
        // Mint tokens on destination chain
        _mint(_to, _amountLD);
        
        bytes32 guid = keccak256(abi.encodePacked(block.timestamp, _to, _amountLD));
        
        emit OFTReceived(guid, _srcEid, _to, _amountLD);
        emit CrossChainReceived(_srcEid, _to, _amountLD);
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Set trusted peer for a chain
     * @param _eid Endpoint ID
     * @param _peer Peer address (bytes32)
     */
    function setPeer(uint32 _eid, bytes32 _peer) external onlyOwner {
        peers[_eid] = _peer;
        emit PeerSet(_eid, _peer);
    }
    
    /**
     * @notice Update minter address
     * @param _newMinter New minter address
     */
    function setMinter(address _newMinter) external onlyOwner {
        if (_newMinter == address(0)) revert ZeroAddress();
        address oldMinter = minter;
        minter = _newMinter;
        emit MinterUpdated(oldMinter, _newMinter);
    }
    
    /**
     * @notice Admin mint function (only minter)
     * @param _to Recipient address
     * @param _amount Amount to mint
     */
    function adminMint(address _to, uint256 _amount) external onlyMinter {
        if (_amount == 0) revert ZeroAmount();
        _mint(_to, _amount);
    }
    
    /**
     * @notice Admin burn function (only minter)
     * @param _from Address to burn from
     * @param _amount Amount to burn
     */
    function adminBurn(address _from, uint256 _amount) external onlyMinter {
        if (_amount == 0) revert ZeroAmount();
        _burn(_from, _amount);
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        if (_paused) revert ContractPaused();
        _paused = true;
        emit ContractPausedByOwner(msg.sender);
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        if (!_paused) revert("Contract not paused");
        _paused = false;
        emit ContractUnpausedByOwner(msg.sender);
    }

    // ============ ISovaBTC Compatibility ============
    
    function isPaused() external view returns (bool) {
        return _paused;
    }
    
    function setMinDepositAmount(uint64 _minAmount) external onlyOwner {
        minDepositAmount = _minAmount;
    }
    
    function setMaxDepositAmount(uint64 _maxAmount) external onlyOwner {
        maxDepositAmount = _maxAmount;
    }
    
    function setMaxGasLimitAmount(uint64 _maxGasLimitAmount) external virtual onlyOwner {
        maxGasLimitAmount = _maxGasLimitAmount;
    }
    
    // Not implemented for OFT - Bitcoin-specific functions only on Sova chain
    function depositBTC(uint64, bytes calldata) external pure {
        revert("Not implemented for OFT");
    }
    
    function withdraw(uint64, uint64, uint64, string calldata) external virtual {
        revert("Not implemented for OFT");
    }
    
    function isTransactionUsed(bytes32) external pure returns (bool) {
        return false;
    }
} 