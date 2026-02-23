# @injpass/connector

Lightweight SDK for embedding INJ Pass wallet in your dApp via iframe.

## Features

- 🔐 **Passkey Authentication** - Secure, passwordless wallet access
- 📱 **Mobile Support** - Works on iOS/Android browsers
- 🎨 **Flexible UI** - Floating, modal, or inline modes
- 🔒 **Secure** - Private keys never leave the iframe
- ⚡ **Lightweight** - Zero dependencies, < 5KB gzipped

## Installation

```bash
npm install @injpass/connector
```

or

```bash
pnpm add @injpass/connector
```

## Quick Start

```typescript
import { InjPassConnector } from '@injpass/connector';

// Create connector instance
const connector = new InjPassConnector();

// Connect to wallet
const wallet = await connector.connect();
console.log('Connected:', wallet.address);

// Sign message
const signature = await wallet.signer.signMessage('Hello World');
console.log('Signature:', signature);

// Disconnect
connector.disconnect();
```

## Configuration Options

```typescript
const connector = new InjPassConnector({
  // Embed URL (default: 'https://injpass.xyz/embed')
  embedUrl: 'https://injpass.xyz/embed',

  // Position (for floating mode)
  position: {
    bottom: '20px',
    right: '20px'
  },

  // Size
  size: {
    width: '400px',
    height: '300px'
  },

  // Display mode: 'floating' | 'modal' | 'inline'
  mode: 'floating',

  // Container ID (for inline mode)
  containerId: 'wallet-container',

  // Auto-hide after connection
  autoHide: true
});
```

## Display Modes

### Floating Mode (Default)
Fixed position overlay that appears on top of your dApp:

```typescript
const connector = new InjPassConnector({
  mode: 'floating',
  position: { bottom: '20px', right: '20px' }
});
```

### Modal Mode
Full-screen modal with backdrop:

```typescript
const connector = new InjPassConnector({
  mode: 'modal',
  size: { width: '500px', height: '400px' }
});
```

### Inline Mode
Embedded within a container element:

```html
<div id="wallet-container" style="width: 100%; height: 500px;"></div>
```

```typescript
const connector = new InjPassConnector({
  mode: 'inline',
  containerId: 'wallet-container'
});
```

## API Reference

### InjPassConnector

#### `connect(): Promise<ConnectedWallet>`
Displays the wallet iframe and waits for user to authenticate with Passkey.

**Returns:**
```typescript
{
  address: string;           // Injective wallet address (inj1...)
  walletName?: string;       // User-defined wallet name
  signer: InjPassSigner;     // Signer instance for signing messages
}
```

**Throws:**
- `Error('Already connected')` - If already connected
- `Error('Connection timeout')` - If user doesn't authenticate within 60s
- `Error('Connection failed')` - If authentication fails

#### `disconnect(): void`
Disconnects wallet and removes iframe from DOM.

#### `show(): void`
Shows the iframe (if hidden).

#### `hide(): void`
Hides the iframe.

### InjPassSigner

#### `signMessage(message: string): Promise<Uint8Array>`
Signs a message using the wallet's private key (secp256k1).

**Parameters:**
- `message`: String message to sign

**Returns:**
- `Promise<Uint8Array>`: 64-byte signature (r + s)

**Throws:**
- `Error('Signing timeout')` - If signing takes > 30s
- `Error(...)` - If user rejects or signing fails

## Complete Example

```typescript
import { InjPassConnector } from '@injpass/connector';

const connector = new InjPassConnector({
  mode: 'floating',
  position: { bottom: '20px', right: '20px' },
  autoHide: true
});

try {
  // Connect wallet
  const wallet = await connector.connect();
  console.log('Connected to:', wallet.address);
  console.log('Wallet name:', wallet.walletName);

  // Sign transaction
  const txHash = 'transaction_hash_here';
  const signature = await wallet.signer.signMessage(txHash);
  console.log('Signature:', signature);

  // Cleanup
  connector.disconnect();
} catch (error) {
  console.error('Failed:', error);
}
```

## Security Considerations

1. **CSP Configuration**: Add `frame-src https://injpass.xyz` to your Content Security Policy
2. **Origin Validation**: The SDK validates message origins automatically
3. **Private Key Isolation**: Private keys never leave the iframe sandbox
4. **HTTPS Only**: Only works on HTTPS origins (or localhost)

## Browser Support

- ✅ Chrome/Edge 67+ (Desktop/Android)
- ✅ Safari 16+ (macOS/iOS)
- ✅ Firefox 60+
- ❌ Requires WebAuthn platform authenticator (Touch ID/Face ID/Windows Hello)

## Troubleshooting

### "Connection timeout"
- Check CSP allows `frame-src https://injpass.xyz`
- Verify user has platform authenticator (Touch ID/Face ID)
- Check browser console for iframe load errors

### Safari "Blocked third-party cookies"
Safari blocks third-party storage by default. Users need to:
1. Click "Allow" when prompted by Storage Access API
2. Or disable "Prevent cross-site tracking" in Safari settings

### "requestId not found" errors
Ensure you're not calling `disconnect()` while waiting for a signature.

## License

MIT

## Support

- Documentation: https://docs.injpass.xyz
- GitHub Issues: https://github.com/injective/inj-pass/issues
- Discord: https://discord.gg/injective
