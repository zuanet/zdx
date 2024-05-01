const fs = require('fs');
const os = require('os');
const path = require('path');
const utils = require("@aspectron/flow-utils");
const util = require("../utils.js");
const { dpc } = require('@aspectron/flow-async');
const Daemon = require('../daemon');

module.exports = class Simulator extends Daemon {
	constructor(manager, task) {
		super(manager, task);
		console.log(`Creating ${task.type}`.green.bold);
		// this.verbose = true;
		this.blockrate = 0;
		this.blockrate1m = 0;
		this.hashrate = { rate : 0, units : '' };

	}

	getPeers(){
		return this.task.conf.peers;
	}

	async start() {
		this._stopped = false;
		const {manager} = this;
		

		let defaults = {
			// logdir:     logsFolder, // Directory to log output. (default:
							// C:\Users\aspect\AppData\Local\Apiserver)
			// rpcuser: 	'user', // RPC username
			// rpcpass: 	'pass', // RPC password
			//-rpcserver: 	'', // RPC server to connect to
			//-rpccert: 	'', // RPC server certificate chain for validation

			//-notls: 		'', // Disable TLS
			//-dbaddress: 	'', // Database address (default: localhost:3306)
			// dbuser: 	'zua', // Database user
			// dbpass: 	'zua', // Database password
			// dbname: 	'ZUA', // Database name
			//listen: 	'', // HTTP address to listen on (default: 0.0.0.0:8080)
							// (default: 0.0.0.0:8080)
			//migrate: 	'', // Migrate the database to the latest version. The server
							// will not start when using this flag.
			//mqttaddress:'', // MQTT broker address
			//mqttuser: 	'', // MQTT server user
			//mqttpass: 	'', // MQTT server password
			//testnet: 	undefined, // Use the test network
			//regtest: 	'', // Use the regression test network
			//simnet: 	'', // Use the simulation test network
			//devnet: 	'', // Use the development test network
		}


		let args = Object.assign(defaults, this.task.args || {});

		//const { config }  = await manager.controller.get('get-modules-config');
		//const { useWalletForMining } = config;
		//if(useWalletForMining){
			//await this.wallet.getMiningAddress();
		//}else{
			let address = await manager.controller.getMiningAddress()
			console.log("addressaddressaddressaddress", address)
			if(address)
				args.miningaddr = address;
		//}
		// TODO get receive address from wallet
		// TODO get receive address from wallet
		// TODO get receive address from wallet
		// @surinder-get-wallet-address-here
//		let {config:daemons} = await this.get("get-modules-config");



		if(!args.miningaddr) {
			args.miningaddr = 'zuatest:qpjmmd8fc20c6mf5zxr6qax0369g0aufyg6aqcel9u';
			//args.miningaddr = 'zua:qqg767gkznmsuah5xeer9f72lwqu642nqvlmujtpmk';
			//args.miningaddr = 'zua:qr35ennsep3hxfe7lnz5ee7j5jgmkjswsslwxj42ta';
		}		

		//if(process.env['ZUA_JSON_RPC'])
		//	args['rpccert'] = path.join(manager.dataFolder, 'rpc.cert');	

		let blocks = 0;
		// const rpcCertFile = path.join(manager.dataFolder, 'rpc.cert');

		// const blockDelay = this.task.blockdelay || 2000;
		//console.log("++++++++++++++++ ZUAMINER VSARGS")

		await this.VSARGS([this.getDeployableBinary('zuaminer'), '--version']);

		args = Object.entries(args);

		const flags = utils.args();
		//console.log("++++++++++++++++ ZUAMINER FLAGS",flags)

		this.options = {
			args : () => {
				// this.log(`--addresslist=${configFile}`,`--cert=${rpcCertFile}`);
				let _args_ = [
					this.getBinary('zuaminer'),
					// `--block-delay=${blockDelay}`,
					// `--addresslist=${configFile}`,
					// `--cert=${rpcCertFile}`
				];

				if(/linux/.test(util.platform) && flags.nice) {
					_args_ = ['/bin/nice','-10',..._args_];
				}
				let a = _args_.concat(args.map(([k, v]) => {
					return ((v === undefined || v === null || v === true || v === '') ? `--${k}` : `--${k}=${v}`);
				}));

				console.log("---ZUAMINER ARGS",a);
				// this.log("simulator args".red.bold, a.join(" "))
				return a;
			},
			stdout : (data) => { 
				// if(!this._stopped && data.toString().match(/panic\.go/)) {

				// 	this.log("+------------------------------------------------------".magenta.bold);
				// 	this.log("| SIMULATOR is being reset using stdio monitoring hack.".magenta.bold);
				// 	this.log("| ...restarting in 3000 msec".magenta.bold);
				// 	this.restartTimeoutId = setTimeout(() => {
				// 		this.restart();
				// 	}, 3000);
				// }
				//console.log("SIMULATOR data:", data.toString());

				let text = data.toString();

				let lines = text.split('\n');
				lines.forEach((l) => {

					if(/Found block/g.test(l))
						blocks++;

					let hr = l.match(/hash rate is (?<rate>\d+\.?\d*)\s+(?<units>[^\s]+)/)?.groups;
					if(hr && hr.rate && hr.units) {
						this.hashrate.rate = parseFloat(hr.rate) || 0.0;
						this.hashrate.units = hr.units;
					}

				});

				// let match = data.toString().match(/Found block/g);
				// // console.log("zuaminer match:", match);
				// blocks += (match && match.length) || 0;


				return this.digestStdout(data);
			}
		};
		//console.log("ZUAMINER STATUS:",this.manager.enableMining,flags.mine);
		if(this.manager.enableMining || flags.mine) {
			dpc(0, () => {
				//console.log("----------------- ZUAMINER STARTING")
				this.run()
			})
		} else {
			//console.log("----------------- ZUAMINER NOT RUNNING")
			this.state = 'disabled';
			dpc(0, () => {
				this.writeToSink('\r\n\r\nZuaminer is disabled. Please use Enable Mining option to start it.\r\n\r\n');
			})
		}

		let tsΩ = Date.now();
		let blockΩ = 0;
		let seq = 0;
		let rateΣ = [];
		this.statusTimer = setInterval(()=>{
			let ts = Date.now();
			let tsΔ = ts-tsΩ;
			let blockΔ = blocks-blockΩ;
			let rate = blockΔ / tsΔ * 1e3;
			tsΩ = ts;
			blockΩ = blocks;
			rateΣ.push(rate);
			while(rateΣ.length > 6)
				rateΣ.shift();
			let Σ = rateΣ.reduce((a,b) => a+b, 0) / rateΣ.length;
			// if(seq % 5 == 0)
			// 	this.log(`mined`.yellow.bold,(blocks+'').bold,'blocks at'.yellow.bold,rate.toFixed(2).bold,'blocks/sec'.yellow.bold,`(avg `.yellow.bold,`${Σ.toFixed(2)}`.bold,`)`.yellow.bold);
			//this.gauge('blocks_per_sec', rate);
			this.blockrate = rate;
			//this.gauge('blocks_per_sec-avg-1m', Σ);
			this.blockrate1m = Σ;
			seq++;

			if(typeof flow != 'undefined' && flow.samplers) {
				flow.samplers.get(`${this.task.key}-block-rate`).put(this.blockrate);
				flow.samplers.get(`${this.task.key}-block-rate-avg`).put(this.blockrate1m);
				flow.samplers.get(`${this.task.key}-hash-rate`).put(this.hashrate.rate);
			}
			this.renderTaskInfo();
		}, 10 * 1000);
		
	}

	digestStdout(){

	}

	gauge(title, value){
		this.log(title, value)
	}

	async stop() {
		this._stopped = true;

		try {
			flow.samplers.get(`${this.task.key}-block-rate`).put(0);
			flow.samplers.get(`${this.task.key}-block-rate-avg`).put(0);
			flow.samplers.get(`${this.task.key}-hash-rate`).put(0);
			this.renderTaskInfo();
		} catch(ex) { console.error(ex); }

		clearInterval(this.statusTimer);
		if(this.restartTimeoutId)
			clearTimeout(this.restartTimeoutId)

		return super.stop();
	}

	async renderModuleInfo({ html, i18n }) {
		let els = await super.renderModuleInfo({ html, i18n });



		let rate = html`
			<flow-data-badge-graph style="min-width:128px;" sampler="${this.task.key}-block-rate" suffix="${i18n.t(" / SEC")}" title="${i18n.t("BLOCK RATE")}" align="right">${this.blockrate.toFixed(2)}</flow-data-badge-graph>
			<flow-data-badge-graph style="min-width:128px;" sampler="${this.task.key}-block-rate-avg" suffix="${i18n.t(" / MIN")}" title="${i18n.t("BLOCKS RATE (AVG)")}" align="right">${this.blockrate1m.toFixed(2)}</flow-data-badge-graph>
			<flow-data-badge-graph style="min-width:160px;" sampler="${this.task.key}-hash-rate" suffix="${this.hashrate.units}" title="${i18n.t("HASH RATE")}" align="right">${this.hashrate.rate.toFixed(2)}</flow-data-badge-graph>
		`;

		return html`${els}${rate}`;
	}
}
