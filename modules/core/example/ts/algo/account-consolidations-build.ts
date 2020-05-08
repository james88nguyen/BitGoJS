/**
 * Account consolidations are run for Algorand currently, where you need to sweep money
 * off receive addresses into the main wallet. This is the only way to get money off
 * receive addresses.
 *
 * USAGE: This is used for where some intermediate verification/validation of the
 * consolidation tx needs to occur.
 */
import { BitGo, Wallet } from 'bitgo';
const bitgo = new BitGo({ env: 'test' });

const accessToken = ''; // TODO: you'll have to set this here

const coin = 'talgo';

// this can be found on test.bitgo.com in the URL after clicking on a wallet
// https://test.bitgo.com/enterprise/XXXXXXXXX/coin/talgo/YYYYY/transactions
// YYYYY would be your wallet id in this case minus the last 8 characters
const walletId = 'your wallet id';

// this is your wallet passphrase, which could be different than your login credentials
const walletPassphrase = 'set your wallet passphrase here';
const otp = '000000';

async function main() {
  bitgo.authenticateWithAccessToken({ accessToken });

  const wallet: Wallet = await bitgo.coin(coin).wallets().get({ id: walletId });

  console.log('Wallet ID:', wallet.id());

  if (!wallet || !wallet.coinSpecific()) {
    throw new Error('Failed to retrieve wallet');
  }

  // this is your wallet's address - this is where consolidated funds will go
  console.log('Root Address:', wallet.coinSpecific().rootAddress);

  // your balance or confirmed balance will be the amount across all addresses and your wallet
  console.log('Balance:', wallet.balanceString());
  console.log('Confirmed Balance:', wallet.confirmedBalanceString());

  // your spendable balance will be the balance on the wallet address and should differ from your confirmed balance
  console.log('Spendable Balance:', wallet.spendableBalanceString());

  // we have to unlock this session since we're sending funds
  const unlock = await bitgo.unlock({ otp, duration: 3600 });
  if (!unlock) {
    throw new Error('We did not unlock.');
  }

  // these are the transactions that will get built and signed locally
  // - there is an optional fromAddresses parameter here - you would pass the receive addresses you want to consolidate from
  const consolidationTxes = await wallet.buildAccountConsolidations();

  // this step might be used for some intermediate verification of the consolidation tx
  console.dir(consolidationTxes, { depth: 4 });

  // this is one example of how you might send only the first consolidation from this group
  const unsignedConsolidation = consolidationTxes[0];
  const sendConsolidations = await wallet.sendAccountConsolidation({ walletPassphrase, prebuildTx: unsignedConsolidation });
  console.log(sendConsolidations);
}

main().catch((e) => console.error(e));
