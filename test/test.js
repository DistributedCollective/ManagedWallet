const ManagedWallet = artifacts.require('ManagedWallet');
const TestBridge = artifacts.require('TestBridge');
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

  describe('bridge integration', () => {
    let tokenBridge;
    before(async () => {
      // The other tests depend on each other... try to remedy
      tokenBridge = await TestBridge.new();
       // since this is deployed by migrations, we might have the wrong admin here
      await instance.changeAdmin(admin, {from: await instance.owner()});

      // Transfer enough for these tests to pass
      const amount = web3.utils.toWei("0.2", "ether");
      await instance.send(amount, {from: owner});
    });

    it("Admin should transfer 0.1 RBTC to bridge for acc1", async () => {
      const bal0 = await web3.eth.getBalance(tokenBridge.address);
      const amount = web3.utils.toWei('0.1', 'ether');
      await instance.transferToBridge(tokenBridge.address, acc1, amount, '0x', {from: admin});
      const bal1 = await web3.eth.getBalance(tokenBridge.address);
      assert(new BN(bal0).add(new BN(amount)).eq(new BN(bal1)));
    });

    it("Non-admin should fail to transfer to bridge", async() => {
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
  })

  describe('transferToUser', () => {
    const fee = new BN('123');
    const btcTxHash = '0x' + 'a'.repeat(64);
    const btcTxVout = new BN('2');

    before(async () => {
      // since this is deployed by migrations, we might have the wrong admin here
      await instance.changeAdmin(admin, {from: await instance.owner()});

      // Transfer enough for these tests to pass
      const amount = web3.utils.toWei("0.2", "ether");
      await instance.send(amount, {from: owner});
    });

    it("Admin should transfer 0.1 RBTC to acc1 with the correct event", async () => {
      const bal0 = await web3.eth.getBalance(acc1);
      const amount = web3.utils.toWei('0.1', 'ether');
      const receipt = await instance.transferToUser(acc1, amount, fee, btcTxHash, btcTxVout, {from: admin});
      const bal1 = await web3.eth.getBalance(acc1);
      assert(new BN(bal0).add(new BN(amount)).eq(new BN(bal1)));

      assert(receipt.logs.length === 1);
      assert(receipt.logs[0].event === 'NewBitcoinTransferIncoming');

      const args = receipt.logs[0].args;
      assert(args.rskAddress === acc1);
      assert(args.amountWei.eq(new BN(amount)));
      assert(args.feeWei.eq(fee));
      assert(args.btcTxHash === btcTxHash);
      assert(args.btcTxVout.eq(btcTxVout));
    });

    it("Non-admin should fail to transfer", async() => {
      const amount = web3.utils.toWei('0.1', 'ether');
      let failed = false;
      try{
        await instance.transferToUser(acc1, amount, fee, btcTxHash, btcTxVout, {from: acc1});
      }
      catch(e){
        failed = true;
      }
      assert(failed);
    });
  })
});
