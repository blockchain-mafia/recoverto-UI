import Airtable from 'airtable'
import fs from 'fs'
import dotenv from 'dotenv'
import EthCrypto from 'eth-crypto'
import { ethers } from 'ethers'

// Set up airtable envs in the development envirronement.
const envConfig = dotenv.parse(
  fs.readFileSync('.airtable')
)

for (let k in envConfig) {
  process.env[k] = envConfig[k]
}

const { AIRTABLE_API_KEY, AIRTABLE_BASE } = process.env

// TODO: check the signature
export function handler(event, context, callback) {
    // Only allow GET, POST or PATCH
  if (!["GET", "POST", "PATCH"].includes(event.httpMethod))
    return { statusCode: 405, body: "Method Not Allowed" }

  // TODO: check if the signMsg match with the address
  // if (signingAddress !== address)
  //   return { statusCode: 405, body: "Address Not Allowed" }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE)

  const ID = params.ID || ""
  const email = params.email || ""
  const phoneNumber = params.phoneNumber || ""

  try {
    if (event.httpMethod === "GET") // GET
      base('Owners').select({
        view: 'Grid view',
        filterByFormula: `{Address} = '${address}'`
      }).firstPage((err, records) => {
        if (err) { console.error(err); return; }
        records.forEach(record => {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify({ ID: record.get('ID') })
          })
        })
      })
    else if (event.httpMethod === "PATCH") { // PATCH
      base('Owners').update("recOivqvhvejwRH2c", {
        "Address": "0x580B9ca15035B8C99bda7B959EAB185b40b19704",
        "Email": "wagner.nicolas1@gmail.com",
        "Phone Number": "+33650334223"
      }, (err, record) => {
        if (err) { console.error(err); return; }
        console.log(record.get('Address'));
      })
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({ result: "Settings recorded" })
      })
    } else { // POST
      base('Owners').create({
        "Address": address,
        "Email": "wagner.nicolassss1@gmail.com",
        "Phone Number": "+33650334223"
      }, err => {
        if (err) { console.error(err); return }
      })

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({ result: "Settings added" })
      })
    }
  } catch (err) { 
    console.log(err)
    callback(null, {
      statusCode: err.response.status,
      body: JSON.stringify({ ...err.response.data })
    })
  }
}
