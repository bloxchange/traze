# User Manual

## Introduction
Welcome to Traze - your comprehensive trading platform. This manual will guide you through the platform's features and functionalities.

Traze is free to use, only run on your browser environment and doesn't require any server-side setup (except Solan RPC endpoints to send transactions). It will not connect to any external services, even Google Analytics.

Traze cannot replace exchanges. It helps you reducing transaction fees. But limitations of the browser base and personal RPC endpoints make it not a full-featured exchange. You should use both Traze and exchanges to maximize value.

## Getting Started
1. **Dashboard Overview**
   - Two areas: Header and Workspace.
   - Header contains component list and navigation items.
   - You can drag a component from component list to the workspace.
   - You can resize and sort components.
   - You can add multiple instances of a component.

2. **Header**
   - The component list is center of the header, includes: wallet swarm, Token information, Liquidity Pools, Transactions. The component list will be updated regarding to the development roadmap.
   - The navigation items are on the right edges, includes: manual, development roadmap, FAQs, search token, configuration, theme switch, and language switch.

3. **Configuration**
   - You can access configuration settings from the header.
   - ***You have to configure the RPC endpoints to use the platform.***
   - There are 2 ways of update wallet balances: Buy calling RPC or Traze calculate it self. Because of limitations of RPC, using Traze calculate it self saves your RPC resources. You can use Refresh function to update the latest balances.

## Key Features

### Swarm
- This is a group of wallet.
- You can give it a name.
- You can set up a specific buy/sell profile for it.
- There are a list of commands in its header: Edit name, Feed, Withdraw, Add/Clear wallets, Refresh, Trade settings.

1. Add/Clear wallets
   - Click the plus icon in the swarm's header.
   - You can choose to enter a list of existing private keys, separating by comma, or enter the number of new wallets to generate, or both.
   - After adding, it allows you to download the list of generated wallets as a text file.

2. Feed
   - Feed command allows you to send SOL to the Swarm.
   - You can choose to feed swarm from your Phantom wallet or an existing wallet in the list.
   - Enter the total amount of SOL to feed. It will divide the amount evenly among all wallets in the swarm.

3. Withdraw
   - Withdraw command allows you to withdraw SOL from the Swarm.
   - You can choose to withdraw to your Phantom wallet or an existing wallet in the list.
   - All SOL in the Swarm will be withdrawed.

4. Refresh
   - By default, Traze calculate balances after each transactions. The number may be incorrect.
   - Refresh function will load the latest balances from the chain.

### Transactions
- Shows all sent transactions from swamrs.

### Liquidity Pools
- Under construction.
