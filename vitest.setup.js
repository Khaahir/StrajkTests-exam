// vitest.setup.js
import React from "react";
import "@testing-library/jest-dom"; // registrerar matchers som toBeInTheDocument()

// Gör React globalt tillgänglig i testmiljön (behövs om komponenterna saknar `import React`)
global.React = React;
