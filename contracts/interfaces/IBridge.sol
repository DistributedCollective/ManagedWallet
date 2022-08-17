// SPDX-License-Identifier: MIT
/**
 * Simplified Token Bridge interface
 * */
pragma solidity ^0.6.6;

interface IBridge {
    function receiveEthAt(address _receiver, bytes calldata _extraData) external payable;
}
