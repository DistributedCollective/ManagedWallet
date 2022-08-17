const SmartWallet = artifacts.require('ManagedWallet');

module.exports = async function (deployer, network, [admin]) {
  await deployer.deploy(SmartWallet, admin);
}
