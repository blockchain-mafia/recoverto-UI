import { Drizzle, generateStore } from 'drizzle'
import Web3 from 'web3'

import Recover from '../assets/contracts/recover.json'
import KlerosLiquid  from '../assets/contracts/kleros-liquid.json'

// TODO: resolve the network with web3

const options = {
  contracts: [
    {
      ...Recover,
      networks: {
        1: { address: process.env.REACT_APP_RECOVER_MAINNET_ADDRESS },
        42: { address: process.env.REACT_APP_RECOVER_KOVAN_ADDRESS }
      }
    },
    {
      ...KlerosLiquid,
      networks: {
        1: { address: process.env.REACT_APP_ARBITRATOR_MAINNET_ADDRESS },
        42: { address: process.env.REACT_APP_ARBITRATOR_KOVAN_ADDRESS }
      }
    }
  ],
  polls: {
    accounts: 3000,
    blocks: 3000
  },
  web3: {
    fallback: {
      type: 'ws',
      url: process.env.REACT_APP_WEB3_KOVAN_FALLBACK_URL // FIXME: add mainnet network
    }
  }
}

export default new Drizzle(options, generateStore(options))
