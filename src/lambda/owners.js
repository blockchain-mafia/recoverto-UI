import Airtable from 'airtable'

// TODO: check the signature
export function handler(event, context, callback) {
  base('Owners').select({
    view: 'Grid view',
    filterByFormula: `{Address} = 'account'` // FIXME: ${drizzleState.account}
  }).firstPage((err, records) => {
    if (err) { console.error(err); return; }
    records.forEach(record => {
      base('Claims').create({
          "Address": "send by prod SMS", // FIXME: finder address
          "Item": "test Prod SMS", // FIXME: item ID
          "Email Owner": "wagner.nicolas1@gmail.com", // idem
          "Owner Phone Number": "+33650334223" // idem
        }, 
        err => { if (err) { console.error(err); return }
      })
    })
  })

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ 
      itemID: "Hello, World!",
      addressFinder: "",
      addressOwner: "",
      mailOwner: "",
      phoneNumberOwner: ""
    })
  })
}
