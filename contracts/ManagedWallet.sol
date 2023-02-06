/**
 * A wallet contract which not only allows the owner, but also an admin to withdraw funds.
 * */
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IBridge.sol";

contract ManagedWallet is Ownable {
    event NewBitcoinTransferIncoming(
        address indexed rskAddress,
        uint256 amountWei,
        uint256 feeWei,
        bytes32 btcTxHash,
        uint256 btcTxVout
    );

    address public admin;

    modifier onlyAdmin() {
        require(_msgSender() == admin, "Only the admin may call this function.");
        _;
    }

    constructor(address _admin) public {
        admin = _admin;
    }
    
    /**
     * allow the contract to receive funds
     * */
    receive() external payable {
        
    }
    
    /**
     * allows the owner to change the admin
     * @param newAdmin the new admin 
     * */
    function changeAdmin(address newAdmin) public onlyOwner {
        require(newAdmin != address(0), "New admin may not be the zero address.");
        admin = newAdmin;
    }
    
    /**
     * @notice allows the owner to withdraw the funds
     * @param amount the amount to withdraw
     * */
    function withdraw(uint256 amount) external onlyOwner {
        (bool success,) = _msgSender().call{value:amount}(new bytes(0));
        require(success, "Withdraw failed");
    }
    
    /**
     * @notice allows the admin wallet to withdraw funds to an arbitrary receiver
     * @param receiver the receiver of the funds
     * @param amount the amount to send
     * */
    function withdrawAdmin(address payable receiver, uint256 amount) external onlyAdmin {
        (bool success,) = receiver.call{value:amount}(new bytes(0));
        require(success, "Withdraw failed");
    }

    /**
     * @notice allows the admin wallet to transfer funds to the token bridge
     * @param bridge bridge address
     * @param receiver the receiver of the funds
     * @param amount RBTC amount to transfer
     * @param extraData arbitrary byte data to send with the request (used f.ex. with the aggregator)
     * */
    function transferToBridge(
        address payable bridge,
        address receiver,
        uint256 amount,
        bytes calldata extraData
    ) external onlyAdmin {
        IBridge(bridge).receiveEthAt{value: amount}(receiver, extraData);
    }

    /**
     * @notice allows the admin wallet to transfer funds to a user, emitting an event with transaction data
     * @param receiver the receiver of the funds
     * @param amount RBTC amount to transfer (fees are subtracted)
     * @param fee the RBTC amount of fees paid for the transaction (only used for the event)
     * @param btcTxHash hash of the bitcoin tx corresponding to the deposit
     * @param btcTxVout vout for the bitcoin tx corresponding to the deposit
     * */
    function transferToUser(
        address payable receiver,
        uint256 amount,
        uint256 fee,
        bytes32 btcTxHash,
        uint256 btcTxVout
    ) external onlyAdmin {
        (bool success,) = receiver.call{value:amount}(new bytes(0));
        require(success, "Withdraw failed");
        emit NewBitcoinTransferIncoming(receiver, amount, fee, btcTxHash, btcTxVout);
    }
}
