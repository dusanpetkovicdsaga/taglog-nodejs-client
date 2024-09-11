# taglog-nodejs-client

> Made with create-react-library

[![NPM](https://img.shields.io/npm/v/taglog-nodejs-client.svg)](https://www.npmjs.com/package/taglog-nodejs-client) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save taglog-nodejs-client
```

## Usage

```tsx
import { useTaglogInit } from 'taglog-nodejs-client'

function TestComponent() {
  const { captureInfo } = useTaglogInit({
    accessKey: '{accessKeyHere}',
    defaultChannel: '{testChannelKey}'
  })

  return (
    <div>
      <Button
        onClick={(e) => {
          captureInfo('Button Event Triggered', e)
        }}
      >
        Test Action
      </Button>
    </div>
  )
}
```

## License

MIT © [dusanpetkovicdsaga](https://github.com/dusanpetkovicdsaga)
