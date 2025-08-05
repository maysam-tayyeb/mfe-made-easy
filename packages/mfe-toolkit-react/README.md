# @mfe-toolkit/react

React components and hooks for building microfrontends.

## Installation

```bash
npm install @mfe-toolkit/react @mfe-toolkit/core
```

## Features

- 🧩 MFE loader components with error boundaries
- 🎣 React hooks for MFE services
- 💉 Dependency injection via React Context
- 🏪 State management with Zustand
- 🔐 TypeScript support

## Usage

```tsx
import { MFELoader, MFEProvider } from '@mfe-toolkit/react';

function App() {
  return (
    <MFEProvider services={services}>
      <MFELoader
        url="http://localhost:8080/my-mfe.js"
        fallback={<div>Loading...</div>}
      />
    </MFEProvider>
  );
}
```

## License

MIT
