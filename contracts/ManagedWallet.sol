/**
 * A wallet contract which not only allows the owner, but also an admin to withdraw funds.
 * */
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ManagedWallet is Ownable {

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
}
