import Airtable from 'airtable'
import fs from 'fs'
import dotenv from 'dotenv'
import sigUtil from 'eth-sig-util'

// Set up airtable envs in the development envirronement.
if (fs.existsSync('.airtable')) {
  const envConfig = dotenv.parse(
    fs.readFileSync('.airtable')
  )
  
  for (let k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const { AIRTABLE_API_KEY, AIRTABLE_BASE } = process.env

export function handler(event, context, callback) {
    // Only allow GET, POST or PATCH
  if (!["GET", "POST", "PATCH"].includes(event.httpMethod))
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Method Not Allowed" })
    }


  const params = JSON.parse(event.body)
  const signMsg = params.signMsg || ""
  const address = params.address || ""
  const ID = params.ID || ""
  const email = params.email || ""
  const phoneNumber = params.phoneNumber || ""

  const signer = sigUtil.recoverPersonalSignature({
    data: `Signature required to check if your are the owner of this address: ${address}`,
    sig: signMsg
  })

  if (signer !== address.toLowerCase())
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Address Not Allowed" })
    }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE)

  try {
    if (event.httpMethod === "GET") // GET
      base('Owners').select({
        view: 'Grid view',
        filterByFormula: `{Address} = '${address}'`
      }).firstPage((err, records) => {
        if (err) { console.error(err); return; }
        records.forEach(record => {
          return callback(null, {
            statusCode: 200,
            body: JSON.stringify({ ID: record.get('ID') })
          })
        })
      })
    else if (event.httpMethod === "PATCH") { // PATCH
      base('Owners').update(ID, {
        "Address": address,
        "Email": email,
        "Phone Number": phoneNumber
      }, (err, record) => {
        if (err) { console.error(err); return; }
        console.log(record.get('Address'));
      })
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({ result: "Settings recorded" })
      })
    } else { // POST
      base('Owners').create({
        "Address": address,
        "Email": email,
        "Phone Number": phoneNumber
      }, err => {
        if (err) { console.error(err); return }
      })

      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({ result: "Settings added" })
      })
    }
  } catch (err) { 
    console.log(err)
    return callback(null, {
      statusCode: err.response.status,
      body: JSON.stringify({ ...err.response.data })
    })
  }
}
