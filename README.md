# Share By ChatGPT

A browser extension summarize web pages with ChatGPT for easy sharing on social media.

## Installation

* [Chrome](https://chrome.google.com/webstore/detail/chatgpt-share-by-chatgpt/ndjgjgjgjgjgjgjgjgjgjgjgjgjgjgjg)
* [Firefox](https://addons.mozilla.org/en-US/firefox/addon/share-by-chatgpt/)
* [Edge](https://microsoftedge.microsoft.com/addons/detail/chatgpt-share-by-chatgpt/ndjgjgjgjgjgjgjgjgjgjgjgjgjgjgj)

## Screenshots

![screenshot](screenshots.gif)

## Features

* Summarize web pages with ChatGPT
* Share on social media
* Support multiple languages

## Build from source

This extension is built with [Plasmo](https://www.plasmo.com/), a browser extension framework. You can build it from source by running the following commands:

```bash
pnpm build
```

The built extension will be in the `build` folder. The default build target is `chrome-mv3`. If you want to build for other targets, you can run the following command:

```bash
pnpm build-chrome
# OR
pnpm build-firefox
```

If you want to package the extension, you can run the following command:

```bash
pnpm package-chrome
# OR
pnpm package-firefox
```
