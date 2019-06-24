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

const { 
  AIRTABLE_API_KEY,
  AIRTABLE_MAINNET_BASE,
  AIRTABLE_KOVAN_BASE,
} = process.env

// TODO: move to the utils folder
const getIDByAddress = (base, address) => {
  return new Promise((resolve, reject) => {
    base('Owners').select({
      view: 'Grid view',
      filterByFormula: `{Address} = '${address}'`
    }).firstPage((err, records) => {
      if (records.length === 0) resolve(false)
      else records.forEach(record => resolve(record['id']))
    })
  })
}

exports.handler = async function(event, context, callback) {
    // Only allow GET or POST
  if (!["GET", "POST"].includes(event.httpMethod))
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Method Not Allowed" })
    }

  const params = JSON.parse(event.body)
  const network = params.network || "MAINNET"
  const signMsg = params.signMsg || ""
  const address = params.address || ""
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

  const baseNetwork = `AIRTABLE_${network}_BASE`

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
    .base(eval(baseNetwork))

  try {
    if (event.httpMethod === "GET") // GET
      base('Owners').select({
        view: 'Grid view',
        filterByFormula: `{Address} = '${address.toLowerCase()}'`
      }).firstPage((err, records) => {
        records.forEach(record => {
          return callback(null, {
            statusCode: 200,
            body: JSON.stringify({ ID: record.get('ID') })
          })
        })
      })
    else {
      const ID = await getIDByAddress(base, address.toLowerCase())
      if (ID) {
        base('Owners').update(ID, {
          "Address": address.toLowerCase(),
          "Email": email,
          "Phone Number": phoneNumber
        })
        callback(null, {
          statusCode: 200,
          body: JSON.stringify({ result: "Settings updated" })
        })
      } else { // New Entry
        base('Owners').create({
          "Address": address.toLowerCase(),
          "Email": email,
          "Phone Number": phoneNumber
        })

        callback(null, {
          statusCode: 200,
          body: JSON.stringify({ result: "Settings added" })
        })
      }
    }
  } catch (err) { 
    console.error(err)
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({ err })
    })
  }
}
