// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "../interfaces/IBridge.sol";

contract TestBridge is IBridge {
    event Received(
        uint256 _amount,
        address _receiver,
        bytes _extraData
    );

    function receiveEthAt(address _receiver, bytes calldata _extraData) override external payable {
        emit Received(msg.value, _receiver, _extraData);
    }
}
