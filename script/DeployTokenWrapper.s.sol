// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import "forge-std/Script.sol";
import {TokenWrapper} from "../src/TokenWrapper.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {SovaBTC} from "../src/SovaBTC.sol";

/// @notice Deployment script for the TokenWrapper contract using a UUPS proxy
contract DeployTokenWrapper is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        // SovaBTC is predeployed on Sova at the following address
        address sovaBTCAddress = address(0x2100000000000000000000000000000000000020);

        vm.startBroadcast(deployerKey);

        // Deploy the TokenWrapper implementation and proxy
        TokenWrapper implementation = new TokenWrapper();
        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), "");
        TokenWrapper wrapper = TokenWrapper(address(proxy));

        // Initialize the proxy instance with the SovaBTC token address
        wrapper.initialize(sovaBTCAddress);

        // Transfer ownership of SovaBTC to the wrapper so it can mint/burn
        SovaBTC(sovaBTCAddress).transferOwnership(address(wrapper));

        vm.stopBroadcast();
    }
}

