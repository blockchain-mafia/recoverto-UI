import React, { useState, useEffect, useCallback } from 'react'
import EthCrypto from 'eth-crypto'
import styled from 'styled-components/macro'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import CardItem from '../components/card-item'

function validatingJSON (json, item) {
  var checkedjson
  try {
    checkedjson = JSON.parse(json)
  } catch (e) {
    return {item: ""}
  }
  return checkedjson 
}

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
  const [urlDescriptionsByItem, setUrlDescriptionsByItem] = useState([])
  const { drizzle } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0],	
  }))

// FIXME
  // const descriptionLinkContentFn = useCallback((itemID, descriptionEncryptedLink) =>
  //   fetch(`https://ipfs.kleros.io/${descriptionEncryptedLink}`)
  //     .then(async res => EthCrypto.cipher.parse(await res.text()))
  //     .then(
  //       async msgEncrypted =>
  //         await EthCrypto.decryptWithPrivateKey(recover[itemID].privateKey, msgEncrypted)
  //     )
  //     .then(dataDecrypt => setUrlDescriptionsByItem(
  //       []
  //     ))
  // )

  const items = useCacheCall(['Recover'], call => {
    const itemIDs = call('Recover', 'getItemIDsByOwner', drizzleState.account)
    let arr = []
    if (itemIDs)
      itemIDs.map(itemID => {
        const item = call('Recover', 'items', itemID)
        itemID = itemID.replace(/0x0/gi, '0x')
        itemID = itemID.substring(0, 65)

        arr.push({...item, itemID})
      })

    return arr
  })

  return (
    <Grid>
      <CardItem newItem={true} />
      {items && items.map((item, index) => (
        <CardItem 
          key={index}
          encrypted={false}
        >
          <p>{item !== undefined && item.itemID }</p>
        </CardItem>
      ))}
    </Grid>
  )
}
