export const REDEMPTION_QUEUE_ABI = [
  {
    "type": "function",
    "name": "redeem",
    "inputs": [
      {
        "name": "token",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "fulfillRedemption",
    "inputs": [
      {
        "name": "user",
        "type": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "pendingRedemptions",
    "inputs": [
      {
        "name": "user",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "name": "token",
        "type": "address"
      },
      {
        "name": "amount",
        "type": "uint256"
      },
      {
        "name": "requestTime",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "redemptionDelay",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "canFulfillRedemption",
    "inputs": [
      {
        "name": "user",
        "type": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getQueueLength",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "RedemptionQueued",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true
      },
      {
        "name": "sovaAmount",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "requestTime",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "fulfillmentTime",
        "type": "uint256",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "RedemptionFulfilled",
    "inputs": [
      {
        "name": "user",
        "type": "address",
        "indexed": true
      },
      {
        "name": "token",
        "type": "address",
        "indexed": true
      },
      {
        "name": "sovaAmount",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "tokenAmount",
        "type": "uint256",
        "indexed": false
      }
    ]
  }
] as const;