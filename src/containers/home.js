import React, { useCallback } from 'react'
import ETHAmount from '../components/eth-amount'
import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import styled from 'styled-components/macro'
import { version } from '../../package.json'

const StyledDiv = styled.div`
  max-width: 90%;
`
export default () => {
  const { drizzle, useCacheCall, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({
    account: drizzleState.accounts[0],
    balance: drizzle.web3.utils.toBN(
      drizzleState.accountBalances[drizzleState.accounts[0]]
    )
  }))

  console.log({drizzleState})

  return (
  <>
    <p>Hello you have <ETHAmount amount={drizzleState.balance} decimals={4} /> ETH</p>
    <p>{version}</p>
  </>
  )
}
