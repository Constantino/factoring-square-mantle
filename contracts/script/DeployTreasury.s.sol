// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Treasury} from "../src/Treasury.sol";

contract DeployTreasury is Script {
    function run() external returns (Treasury) {
        // Get USDC address from environment variable
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        require(usdcAddress != address(0), "USDC_ADDRESS not set");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Treasury Deployment Starting ===");
        console.log("Deployer:", deployer);
        console.log("USDC Address:", usdcAddress);
        console.log("Treasury Owner:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Treasury
        Treasury treasury = new Treasury(usdcAddress, deployer);
        require(address(treasury) != address(0), "Treasury deployment failed");
        require(treasury.owner() == deployer, "Treasury owner mismatch");
        require(address(treasury.ASSET()) == usdcAddress, "Treasury asset mismatch");

        vm.stopBroadcast();

        console.log("\n=== Treasury Deployment Successful ===");
        console.log("Treasury Address:", address(treasury));
        console.log("Owner:", treasury.owner());
        console.log("Asset (USDC):", address(treasury.ASSET()));

        return treasury;
    }
}
