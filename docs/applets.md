# Zua-Desktop Applets

Zua-Desktop provides a miniature framework that enables you to easily create an NWJS window within Zua-Desktop that has access to Zua-Desktop configuration.

This is an equivalent to a NodeJs application with a web interface that receives Zua-Desktop + Zua Application Stack configuration on startup.

Applets can be located within the Zua-Desktop application folder inside `apps` subfolder or symlinked to this location.
Alternatively applets can be configured to run from a custom location via configuration settings.


## Configuration Settings

The following applet configuration settings can should be created inside of Zua-Desktop module
configuration settings (located in the *Settings tab*) or can be placed inside the `"zua-desktop"`
property of `packaje.json` manifest file if located within the apps folder:

```json
{
    "name": "DAGViz",
    "location": "http://localhost:8689",
    "stop": "http://localhost:8689/stop",
    "width": 1600,
    "height": 680,
    "args": [
      "node",
      "dagviz",
      "--zua-desktop",
      "--no-auth",
      "--port=8689"
     
    ]
}
```

The following is a `package.json` sample file:

```json
{
    "name" : "my-app",
    "version" : "1.2.3",
    "zua-desktop" : { 
        "name" : "My App",
        "location" : "http://dagviz.com"
    }
}
```

Supported properties:
- `name` - name of the application
- `location` - URL Zua-Desktop should open
- `stop` *optional* - URL to signal Zua-Desktop shutdown
- `width` *optional* - Applet window width
- `height` *optional* - Applet window height
- `args` *optional* - array of command line arguments to spawn at Zua-Desktop startup
- `advanced` *optional* - this option will cause applet to show up only if *Advanced Settings* option is enabled.
