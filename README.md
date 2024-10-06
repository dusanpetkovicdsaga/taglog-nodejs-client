# taglog-nodejs-client

[![NPM](https://img.shields.io/npm/v/taglog-nodejs-client.svg)](https://www.npmjs.com/package/taglog-nodejs-client) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save taglog-nodejs-client
```

## Usage

```ts
import { taglogInit } from 'taglog-nodejs-client'

function TestComponent() {
  const { captureInfo } = taglogInit({
    accessKey: '{accessKeyHere}',
    defaultChannel: '{testChannelKey}'
    options: {
      captureConsole: false,
    }
  })

}
```

## License

MIT © [dusanpetkovicdsaga](https://github.com/dusanpetkovicdsaga)
