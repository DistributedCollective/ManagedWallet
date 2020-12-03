const SmartWallet = artifacts.require('SmartWallet');

module.exports = async function (deployer, network, [admin]) {
  await deployer.deploy(SmartWallet, admin);
}
