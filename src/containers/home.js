import React, { useState, useEffect, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import CardItem from '../components/card-item'

export default () => {
  let recover = localStorage.getItem(recover)
  if (recover !== null) {
    // decode
  }

  const { useCacheCall } = useDrizzle()
  const [urlDescriptionsByItem, setUrlDescriptionsByItem] = useState({})
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

  if (itemIDs && itemIDs.length > 0)
    itemIDs.map(itemID => {
      const item = useCacheCall('Recover', 'items', itemID)
      let descriptionLinkContent = false

      if (recover !== null && recover.itemID.privateKey) {
        descriptionLinkContentFn(
          item.descriptionEncryptedLink,
          recover.itemID.privateKey
        )
        items.push({
          ...item, 
          descriptionLinkContent: urlDescriptionsByItem.itemID
        })
      } else items.push(item, descriptionLinkContent)
    })

  return (
    <>
      <CardItem newItem={true} />
      {items && items.map((item, index) => (
        <CardItem 
          key={index}
          encrypted={item !== undefined && item.descriptionLinkContent}
        >
          <p>{item !== undefined && item.descriptionLinkContent}</p>
          <p>{item !== undefined && item.addressForEncryption}</p> 
        </CardItem>
      ))}
    </>
  )
}
