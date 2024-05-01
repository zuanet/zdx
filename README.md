# Zua-Desktop

Zua-Desktop is a dedicated desktop process manager for [Zua node](https://github.com/zuanet/zuad).


Zua-Desktop offers a miniature console using which user can re-build the Zua stack, upgrading Zua to the latest version directly from GitHub. The build process is automated via a series of scripts that, if
needed, fetch required tools (git, go, gcc) and build Zua on the host computer (the build includes various Zua utilities including `txgen`, `wallet`, `zuactl` and others and can be executed against any specific Git branch).  

Zua-Desktop process configuration (available via a simple JSON editor) allows user to specify command-line arguments for executables, as such it is possible to configure Zua-Desktop to run multiple instances of Zua or potentially run multiple networks simultaneously (provided Zua nodes do not pro-actively auto-discover each-other)

Like many desktop applications, Zua-Desktop can run in the tray bar, out of the way.

Zua-Desktop is built using [NWJS](https://nwjs.io) and is compatible Windows, Linux and Mac OS X.


## Building Zua-Desktop

### Pre-requisites

- [Node.js 14.0.0+](https://nodejs.org/)
- Emanator - `npm install emanator@latest`


**NOTE:** Zua-Desktop build process builds and includes latest Zua binaries from Git master branches. 
To build from specific branches, you can use `--branch...` flags (see below).

#### Generating Zua-Desktop installers
```
mkdir zua-build
cd zua-build
npm install emanator@latest
git clone https://github.com/zuanet/zua-desktop
cd zua-desktop
```


DMG - Building DMG images on Mac OS requires `sudo` access in order to use system tools such as `diskutil` to generate images: 
```
sudo emanate --dmg
```

To build the windows portable deployment, run the following command:
```
emanate --portable
```

To build the Windows installer, you need to install [Innosetup](https://jrsoftware.org/isdl.php) and run:
```
emanate --innosetup
```


Emanator stores build files in the `~/emanator` folder

#### Running Zua-Desktop from development environment


In addition to Node.js, please download and install [Latest NWJS SDK https://nwjs.io](https://nwjs.io/) - make sure that `nw` executable is available in the system PATH and that you can run `nw` from command line.

On Linux / Darwin, as good way to install node and nwjs is as follows:

```
cd ~
mkdir bin
cd bin

#node - (must be 14.0+)
wget https://nodejs.org/dist/v14.4.0/node-v14.4.0-linux-x64.tar.xz
tar xvf node-v14.4.0-linux-x64.tar.xz
ln -s node-v14.4.0-linux-x64 node

#nwjs
wget https://dl.nwjs.io/v0.46.2/nwjs-sdk-v0.46.2-linux-x64.tar.gz
tar xvf nwjs-sdk-v0.46.2-linux-x64.tar.gz
ln -s nwjs-sdk-v0.46.2-linux-x64 nwjs

```
Once done add the following to `~/.bashrc`
```
export PATH = /home/<user>/bin/node/bin:/home/<user>/bin/nwjs:$PATH
```

The above method allows you to deploy latest binaries and manage
versions by re-targeting symlinks pointing to target folders.
Once you have `node` and `nwjs` working, you can continue with
Zua Desktop.

Zua Desktop installation:

```
git clone https://github.com/zuanet/zua-desktop
cd zua-desktop
npm install
npm install emanator@latest
node_modules/.bin/emanate --local-binaries
nw .
```



## Zua-Desktop Process Manager

### Configuration

Zua-Desktop runtime configuration is declared using a JSON object.  

Each instance of the process is declared using it's **type** (for example: `zuad`) and a unique **identifier** (`kd0`).  Most process configuration objects support `args` property that allows
passing arguments or configuration options directly to the process executable.  Depending on the process type, the configuration is passed via command line arguments configuration file (zuad).

Supported process types:
- `zuad` - Zua full node
- `zuaminer` - Zua sha256 miner

**NOTE:** For Zua, to specify multiple connection endpoints, you must use an array of addresses as follows: ` "args" : { "connect" : [ "peer-addr-port-a", "peer-addr-port-b", ...] }`

#### Default Configuration File
```js
{
	"zuad:kd0": {
		"args": {
			"rpclisten": "0.0.0.0:46210",
			"listen": "0.0.0.0:46211",
			"profile": 7000,
			"rpcuser": "user",
			"rpcpass": "pass"
		}
	},
	"zuad:kd1": {
		"args": {
			"rpclisten": "0.0.0.0:46310",
			"listen": "0.0.0.0:46311",
			"profile": 7001,
			"connect": "0.0.0.0:46211",
			"rpcuser": "user",
			"rpcpass": "pass"
		}
	},
	"simulator:sim0": {
        "blockdelay" : 2000,
		"peers": [ "127.0.0.1:16310" ]
	},
	"pgsql:db0": {
		"port": 18787
	},
	"mqtt:mq0": {
		"port": 18792
	},
	"zuasyncd:kvsd0": {
		"args": {
			"rpcserver": "localhost:46310",
			"dbaddress": "localhost:18787"
			"mqttaddress": "localhost:18792",
			"mqttuser" : "user",
			"mqttpass" : "pass"
		}
	},
	"zuad:kvd0": {
		"args": {
			"listen": "localhost:11224",
			"rpcserver": "localhost:46310",
			"dbaddress": "localhost:18787"
		}
	}
}
```

### Data Storage

Zua-Desktop stores it's configuration file as `~/.zua-desktop/config.json`.  Each configured process data is stored in `<datadir>/<process-type>-<process-identifier>` where `datadir` is a user-configurable location.  The default `datadir` location is `~/.zua-desktop/data/`.  For example, `zuad` process with identifier `kd0` will be stored in `~/.zua-desktop/data/zuad-kd0/` and it's logs in `~/.zua-desktop/data/zuad-kd0/logs/zuad.log`

### Zua Binaries

Zua-Desktop can run Zua from 2 locations - an integrated `bin` folder that is included with Zua-Desktop redistributables and `~/.zua-desktop/bin` folder that is created during the Zua build process. 

## Zua-Desktop Console

Zua-Desktop Console provides following functionality:
- Upgrading zuarov using `migrate` command
- `start` and `stop` controls stack runtime
- Zuad RPC command execution
- Use of test wallet app (Zua-Desktop auto-configures zua address)
- Rebuilding Zua software stack from within the console

### Using Zuad RPC

Zuad RPC can be accessed via Zua-Desktop Console using the process identifier. For example:
```
$ kd0 help
$ kd0 getinfo
```
Note that RPC methods are case insensitive.

To supply RPC call arguments, you must supply and array of JSON-compliant values (numbers, double-quote-enclosed strings and 'true'/'false').  For example:
```
$ kd0 getblock "000000b22ce2fcea335cbaf5bc5e4911b0d4d43c1421415846509fc77ec643a7"
{
  "hash": "000000b22ce2fcea335cbaf5bc5e4911b0d4d43c1421415846509fc77ec643a7",
  "confirmations": 83,
  "size": 673,
  "blueScore": 46241,
  ...
}
```

"# zua-zua-desktop" 
