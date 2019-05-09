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


  const [recover, setRecover] = useState(JSON.parse(localStorage.getItem('recover') || '{}'))

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

    return arr.reverse()
  })

  return (
    <Grid>
      <CardItem newItem={true} />
      {items && items.map((item, index) => (
        <CardItem 
          key={index}
          encrypted={false}
          onClick={
            () => window.location.replace(
              `/contract/${
                process.env.REACT_APP_RECOVER_KOVAN_ADDRESS
              }/items/${item.itemID}-privateKey=${recover[item.itemID].privateKey}`
            )
          }
        >
          <p>Item: {++index}</p>
        </CardItem>
      ))}
    </Grid>
  )
}
