import { Drizzle, generateStore } from 'drizzle'

import Recover from '../assets/contracts/recover.json'
import CentralizedArbitrator  from '../assets/contracts/arbitrator.json'

const options = {
  contracts: [
    {
      ...Recover,
      networks: {
        42: { address: process.env.REACT_APP_RECOVER_KOVAN_ADDRESS }
      }
    },
    {
      ...CentralizedArbitrator,
      networks: {
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
      url: process.env.REACT_APP_WEB3_FALLBACK_URL
    }
  }
}
export default new Drizzle(options, generateStore(options))
