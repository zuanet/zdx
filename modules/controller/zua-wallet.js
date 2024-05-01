import {ZuaWallet as BaseZuaWallet} from '/node_modules/@zua/ux/zua-ux.js';

class ZuaWallet extends BaseZuaWallet{
	makeFaucetRequest(subject, args){
		let origin = 'https://faucet.zuanet.io';
		//origin = 'http://localhost:3000';
		const {address, amount} = args;
		let path = {
			'faucet-available': `available/${address}`,
			'faucet-request': `get/${address}/${amount}`
		}[subject];

		if(!path)
			return Promise.reject("Invalid request subject:"+subject)

		return fetch(`${origin}/api/${path}`, {
			method: 'GET'
		}).then(res => res.json())
	}
}

ZuaWallet.define("zua-wallet")
