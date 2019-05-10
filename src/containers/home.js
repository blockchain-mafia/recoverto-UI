import React, { useState, useEffect, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'
import { useDataloader } from '../bootstrap/dataloader'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import CardItem from '../components/card-item'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 70px;
  grid-auto-rows: 290px;
`

export default () => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const loadDescription = useDataloader.getDescription()

  const { useCacheCall } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0],	
  }))

  const itemIDs = useCacheCall('Recover', 'getItemIDsByOwner', drizzleState.account)

  const itemsFn = useCacheCall(['Recover'], call =>
    itemIDs
      ? itemIDs.reduce(
          (acc, d) => {
            const item = call('Recover', 'items', d)

            if(item) {
              const itemID = d.replace(/0x0/gi, '0x').substring(0, 65)
              if(recover[itemID] && recover[itemID].privateKey) {
                const content = loadDescription(
                  item.descriptionEncryptedLink, 
                  recover[itemID].privateKey
                )

                if (content) item.content = JSON.parse(content).type
              }

              item.itemID = itemID
                
              acc.items.push(item)
            }

            return acc
          },
          {
            items: [],
            loading: false
          }
        )
      : { loading: true }
  )

  const items = !itemsFn.loading && itemsFn


  return (
    <Grid>
      <CardItem newItem={true} />
      {items && items.items.map((item, index) => (
        <CardItem 
          key={index}
          encrypted={false}
          onClick={
            () => window.location.replace(
              `/contract/${
                process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
              }/items/${item.itemID}-privateKey=${recover[item.itemID] ? recover[item.itemID].privateKey : ''}`
            )
          }
        >

          <p>Item: {item.itemID}</p>
          <p>Item: {item.content && item.content}</p>
        </CardItem>
      ))}
    </Grid>
  )
}
