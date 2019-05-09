import React, { useState, useEffect, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import CardItem from '../components/card-item'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 70px;
  grid-auto-rows: 290px;
`

export default () => {
  let recover = JSON.parse(localStorage.getItem('recover') || '{}')
  if (recover === {}) {
    // decode
  }

  const { useCacheCall } = useDrizzle()
  const [urlDescriptionsByItem, setUrlDescriptionsByItem] = useState({})
  const { drizzle } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0],	
  }))

  const itemIDs = useCacheCall('Recover', 'getItemIDsByOwner', drizzleState.account)

  let items = []

  const descriptionLinkContentFn = useCallback((itemID, descriptionEncryptedLink, privateKey) =>
    fetch(`https://ipfs.kleros.io/${descriptionEncryptedLink}`)
      .then(async res => EthCrypto.cipher.parse(await res.text()))
      .then(
        async msgEncrypted =>
          await EthCrypto.decryptWithPrivateKey(privateKey, msgEncrypted)
      )
      .then(dataDecrypt => setUrlDescriptionsByItem(
        {
          ...urlDescriptionsByItem, 
          itemID: dataDecrypt
        }
      ))
  )

  let item = null
  let descriptionLinkContent = false

  if (itemIDs && itemIDs.length > 0)
    itemIDs.map(itemID => {
        item = useCacheCall('Recover', 'items', itemID)
        itemID = itemID.slice(0, -2)

        descriptionLinkContent = false

        if (item != undefined && item.descriptionEncryptedLink && recover !== null && recover[itemID] && recover[itemID].privateKey) {
          descriptionLinkContentFn(
            itemID,
            item.descriptionEncryptedLink,
            recover[itemID].privateKey
          )
          items.push({
            ...item, 
            descriptionLinkContent: urlDescriptionsByItem.itemID
          })
        } else items.push(item, descriptionLinkContent)
    })

  return (
    <Grid>
      <CardItem newItem={true} />
      {items && items.map((item, index) => (
        <CardItem 
          key={index}
          encrypted={item !== undefined && item.descriptionLinkContent}
        >
          <p>decrypt:{item !== undefined && item.descriptionLinkContent}</p>
          <p>{item !== undefined && item.addressForEncryption}</p> 
        </CardItem>
      ))}
    </Grid>
  )
}
