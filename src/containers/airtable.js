import React, { useState, useCallback } from 'react'
import Airtable from 'airtable'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'

export default () => {
  const base = new Airtable({ apiKey: process.env.REACT_APP_API_KEY_AIRTABLE })
    .base(process.env.REACT_APP_BASE_AIRTABLE)

  const [emailOwner, setEmailOwner] = useState('')

  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const { drizzle, useCacheSend } = useDrizzle()
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0] || '0x00'
  }))

  if (!emailOwner)
    base('Owners').select({
      view: 'Grid view',
      filterByFormula: `{Address} = '${drizzleState.account}'`
    }).firstPage((err, records) => {
      if (err) { console.error(err); return; }
      records.forEach(record => {
        setEmailOwner(record.getId())
        base('Claims').create({
            "Address": "send by prod", // FIXME: finder address
            "Item": "test Prod", // FIXME: item ID
            "Email Owner": "wagner.nicolas1@gmail.com", // idem
            "Owner Phone Number": "+33650334223" // idem
          }, 
          err => { if (err) { console.error(err); return }
        })
      })
    })

  return (
    <>
      <h1>Airtable</h1>
      <h2>Email: {emailOwner}</h2>
    </>
  )
}
