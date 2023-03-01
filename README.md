# Octoprint

![Project Maintenance][maintenance-shield]

[OctoPrint](https://octoprint.org) is a web interface for your 3D printer. This is the app integration for Homey.

## Instructions
[Download](https://github.com/jonkristian/no.jonkristian.octoprint/archive/master.zip) and extract the latest code and type ``npm install`` from inside the folder, it will install app dependencies, then you can type ``homey app install`` or ```homey app run``` if you want to run it from the terminal. Once it's running you can add your octoprint server as a device. If you have any issues or feature suggestions please report them [here](https://github.com/jonkristian/no.jonkristian.octoprint/issues).

## Features
* Printer connect/disconnect
* Printer states
* Printing sensors

## Flows & Tags
* Start/Finish
* Duration, Print time and Snapshot

## Feedback
Please report issues or ideas at the [issues section on Github](https://github.com/jonkristian/no.jonkristian.octoprint/issues).

⭐️ this repository if you found it useful ❤️

<a href="https://www.buymeacoffee.com/jonkristian" target="_blank"><img src="https://bmc-cdn.nyc3.digitaloceanspaces.com/BMC-button-images/custom_images/white_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

## Icon attribution
* The App icon "Tentacle" belongs to [OctoPrint](https://octoprint.org).
* The Device icon "3D Printer" is made by [Freepik](https://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com).
* The Store icon "3D Printer" is made by [Ahkâm](https://www.freeiconspng.com/img/13046)

## Release Notes
#### 1.0.9
- Fixed run listener init
- Adds camera in-app

#### 1.0.8
- Fixed 'flow_token_already_exists' error
- Minor translation fixes

#### 1.0.7
- Homey SDK v3
- Adds missing printer state translations
- Easier/Quicker setup
- Snapshot config moved to advanced settings
- Snapshot is now a global token (tag)
- Buttons are now functional
- Adds trigger card for print paused
- Fixed off trigger when it shouldn't
- Adds homey community topic id
- Adds loading overlay in setup

#### 1.0.6
- Changed sensor state value to '-' when undefined
- Translation fix for printer state
- Better handling of undefined checks on nested properties
- Added option to specify webcam/snapshot url when adding device

#### 1.0.5
- Fixed wrong nozzle temperature readings

#### 1.0.4
- Athom Homey app review issues

#### 1.0.3
- Athom Homey app review issues

#### 1.0.2
- Wrong json entry in app.json

#### 1.0.1
- Modified descriptions & added source and bugs url.

#### 1.0.0
- Stable for app store.

[maintenance-shield]: https://img.shields.io/maintenance/yes/2021.svg?style=for-the-badge
