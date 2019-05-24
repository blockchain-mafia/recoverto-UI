import React, { useState, useEffect } from 'react'
import Airtable from 'airtable'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'

export default () => {
  const [emailOwner, setEmailOwner] = useState('')

  const [data, setData] = useState('')

  useEffect(() => {
    if(!data)
      fetch('/.netlify/functions/claims', {
          method: 'post',
          body: JSON.stringify({
            address: '0x580B9ca15035B8C99bda7B959EAB185b40b19704',
            itemID: 'the item',
            emailOwner: 'wagner.nicolas1@gmail.com',
            phoneNumber: '+33650334223'
          })
        })
        .then(res => res.json())
        .then(data => {setData('sent'); console.log(data);})
        .catch(err => console.error(err))
  })

  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const { drizzle, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0] || '0x00'
  }))

  return (
    <>
      <h1>Airtable</h1>
      <h2>Email: {data}</h2>
    </>
  )
}
