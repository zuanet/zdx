# ZDX

ZDX is a dedicated desktop process manager for [Zua node](https://github.com/zuanet/zuad).


ZDX offers a miniature console using which user can re-build the Zua stack, upgrading Zua to the latest version directly from GitHub. The build process is automated via a series of scripts that, if
needed, fetch required tools (git, go, gcc) and build Zua on the host computer (the build includes various Zua utilities including `txgen`, `wallet`, `zuactl` and others and can be executed against any specific Git branch).  
ZDX process configuration (available via a simple JSON editor) allows user to specify command-line arguments for executables, as such it is possible to configure ZDX to run multiple instances of Zua or potentially run multiple networks simultaneously (provided Zua nodes do not pro-actively auto-discover each-other)

Like many desktop applications, ZDX can run in the tray bar, out of the way.

ZDX is built using [NWJS](https://nwjs.io) and is compatible Windows, Linux and Mac OS X.


## Building ZDX

### Pre-requisites

- [Node.js 14.0.0+](https://nodejs.org/)
- Emanator - `npm install emanator@latest`

**NOTE:** ZDX build process builds and includes latest Zua binaries from Git master branches. 
To build from specific branches, you can use `--branch...` flags (see below).

#### Generating ZDX installers
```
npm install emanator@latest
git clone git@github.com:zuanet/zdx
cd zdx
# run emanate with one or multiple flags below
#  --portable   create a portable zipped application
#  --innosetup  generate Windows setup executable
#  --dmg        generate a DMG image for Mac OS X
#  --all        generate all OS compatible packages
# following flags can be used to reset the environment
#  --clean		clean build folders: purges cloned `GOPATH` folder
#  --reset		`--clean` + deletes downloaded/cached NWJS and NODE binaries
emanate [--portable | --innosetup | --dmg | --all]
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

#### Running ZDX from development environment


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
The above method allows you to deploy latest binaries and manage versions by re-targeting symlinks pointing to target folders.

Once you have node and nwjs working, you can continue with ZDX.

ZDX installation:
```
npm install emanator@latest
git clone git@github.com:zuanet/zdx
cd zdx
npm install
emanate --local-binaries
nw .
```

#### Building installers from specific Zua Git branches

`--branch` argument specifies common branch name for zua, for example:
```
emanate --branch=v0.4.0-dev 
```
The branch for each repository can be overriden using `--branch-<repo-name>=<branch-name>` arguments as follows:
```
emanate --branch=v0.4.0-dev --branch-zuad=v0.3.0-dev
emanate --branch-miningsimulator=v0.1.2-dev
```

**NOTE:** ZDX `build` command in ZDX console operates in the same manner and accepts `--branch...` arguments.


## ZDX Process Manager

### Configuration

ZDX runtime configuration is declared using a JSON object.  

Each instance of the process is declared using it's **type** (for example: `zuad`) and a unique **identifier** (`zd0`).  Most process configuration objects support `args` property that allows
passing arguments or configuration options directly to the process executable.  Depending on the process type, the configuration is passed via command line arguments (zua*) or configuration file (zuad).

Supported process types:
- `zuad` - Zua full node
- `zuaminer` - Zua sha256 miner

**NOTE:** For Zua, to specify multiple connection endpoints, you must use an array of addresses as follows: ` "args" : { "connect" : [ "peer-addr-port-a", "peer-addr-port-b", ...] }`

#### Default Configuration File
```js
{
	"zuad:zd0": {
		"args": {
			"rpclisten": "0.0.0.0:46205",
			"listen": "0.0.0.0:46209",
			"profile": 7000,
			"rpcuser": "user",
			"rpcpass": "pass"
		}
	},
	"zuad:zd1": {
		"args": {
			"rpclisten": "0.0.0.0:46305",
			"listen": "0.0.0.0:46309",
			"profile": 7001,
			"connect": "0.0.0.0:46209",
			"rpcuser": "user",
			"rpcpass": "pass"
		}
	
	
```

### Data Storage

ZDX stores it's configuration file as `~/.zdx/config.json`.  Each configured process data is stored in `<datadir>/<process-type>-<process-identifier>` where `datadir` is a user-configurable location.  The default `datadir` location is `~/.zdx/data/`.  For example, `zuad` process with identifier `zd0` will be stored in `~/.zdx/data/zuad-zd0/` and it's logs in `~/.zdx/data/zuad-zd0/logs/zuad.log`

### Zua Binaries

ZDX can run Zua from 2 locations - an integrated `bin` folder that is included with ZDX redistributables and `~/.zdx/bin` folder that is created during the Zua build process. 

## ZDX Console

ZDX Console provides following functionality:

- `start` and `stop` controls stack runtime
- Zuad RPC command execution

### Using Zuad RPC

Zuad RPC can be accessed via ZDX Console using the process identifier. For example:
```
$ zd0 help
$ zd0 getinfo
```
Note that RPC methods are case insensitive.

To supply RPC call arguments, you must supply and array of JSON-compliant values (numbers, double-quote-enclosed strings and 'true'/'false').  For example:
```
$ zd0 getblock "000000b22ce2fcea335cbaf5bc5e4911b0d4d43c1421415846509fc77ec643a7"
{
  "hash": "000000b22ce2fcea335cbaf5bc5e4911b0d4d43c1421415846509fc77ec643a7",
  "confirmations": 83,
  "size": 673,
  "blueScore": 46241,
  ...
}
```

