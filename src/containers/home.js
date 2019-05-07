import React, { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components/macro'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import CardItem from '../components/card-item'

export default () => {
  const { useCacheCall } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0],	
  }))

  const itemIDs = useCacheCall('Recover', 'getItemIDsByOwner', drizzleState.account)

  let items = []

  if (itemIDs && itemIDs.length > 0)
    itemIDs.map(itemID => {
      const item = useCacheCall('Recover', 'items', itemID)
      items.push(item)
    })

  return (
    <>
      <CardItem newItem={true} />
      {items && items.map((item, index) => <CardItem key={index}>{item !== undefined && item.addressForEncryption}</CardItem>)}
    </>
  )
}
