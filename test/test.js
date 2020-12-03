const ManagedWallet = artifacts.require('ManagedWallet');
const BN = web3.utils.BN;
let instance;

contract("ManagedWallet Tests", async ([owner, admin, acc1]) => {
  before(async () => {
    instance = await ManagedWallet.deployed();
  });

  it("Admin should be the owner", async () => {
    const _admin = await instance.admin();
    assert(_admin === owner);
  });
  
  it("Owner should be able to deposit 1 RBTC", async () => {
    const amount = web3.utils.toWei("1", "ether");
    await instance.send(amount, {from: owner});
    const bal = await web3.eth.getBalance(instance.address);
    assert(bal === amount);
  });

  it("Owner should be able to withdraw 0.1 RBTC", async () => {
    const bal0 = await web3.eth.getBalance(owner);
    const amount = web3.utils.toWei('0.1', 'ether');
    const gasPrice = new BN(await web3.eth.getGasPrice());

    const res = await instance.withdraw(amount, {from: owner, gasPrice: gasPrice});
    const bal1 = await web3.eth.getBalance(owner);
    const expected = new BN(bal0).add(new BN(amount)).sub(gasPrice.mul(new BN(res.receipt.gasUsed)));

    assert(expected.eq(new BN(bal1)));
  });
  
  it("Non-owner should fail to withdraw", async() => {
    const amount = web3.utils.toWei('0.1', 'ether');
    let failed = false;
    try{
      await instance.withdraw(amount, {from: acc1});
    }
    catch(e){
      failed = true;
    }
    assert(failed);
  });

  it("Owner should be able to change the admin", async () => {
    await instance.changeAdmin(admin, {from: owner});
    const newAdmin = await instance.admin();
    assert(newAdmin === admin);
  });
  
  it("non-owner should fail to change the admin", async () => {
    let failed = false;
    try {
      await instance.changeAdmin(admin, {from: acc1});
    } catch (e) {
      failed = true;
    }
    assert(failed);
  });

  it("Admin should withdraw 0.1 RBTC for acc1", async () => {
    const bal0 = await web3.eth.getBalance(acc1);
    const amount = web3.utils.toWei('0.1', 'ether');
    await instance.withdrawAdmin(acc1, amount, {from: admin});
    const bal1 = await web3.eth.getBalance(acc1);
    assert(new BN(bal0).add(new BN(amount)).eq(new BN(bal1)));
  });
  
  it("Non-admin should fail to withdraw", async() => {
    const amount = web3.utils.toWei('0.1', 'ether');
    let failed = false;
    try{
      await instance.withdrawAdmin(acc1, amount, {from: acc1});
    }
    catch(e){
      failed = true;
    }
    assert(failed);
  });

  it("Ownership should change to acc1", async () => {
    await instance.transferOwnership(acc1);
    const newOwner = await instance.owner();
    assert(newOwner === acc1);
  });

  it("New owner acc1 should withdraw 0.1 RBTC", async () => {
    const bal0 = await web3.eth.getBalance(acc1);
    const amount = web3.utils.toWei('0.1', 'ether');
    const gasPrice = new BN(await web3.eth.getGasPrice());

    const res = await instance.withdraw(amount, {from: acc1, gasPrice: gasPrice});
    const bal1 = await web3.eth.getBalance(acc1);
    const expected = new BN(bal0).add(new BN(amount)).sub(gasPrice.mul(new BN(res.receipt.gasUsed)));

    assert(expected.eq(new BN(bal1)));
  })
});
