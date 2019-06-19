import Airtable from 'airtable'
import fs from 'fs'
import dotenv from 'dotenv'

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

// TODO: move to the utils folder
const getIDByAddress = (base, address) => {
  return new Promise((resolve, reject) => {
    base('Owners').select({
      view: 'Grid view',
      filterByFormula: `{Address} = '${address}'`
    }).firstPage((err, records) => {
      if (records.length === 0) resolve(false)
      else records.forEach(record => resolve({
        ID: record['id'],
        email: record.get('Email'),
        phoneNumber: record.get('Phone Number')
      }))
    })
  })
}

// TODO: use a bot instead of a netlify function to avoid a DDOS attack
exports.handler = async function(event, context, callback) {
  // Only allow POST
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
    .base(AIRTABLE_BASE)

  const params = JSON.parse(event.body)
  const addressOwner = params.addressOwner || "0x00"
  const addressFinder = params.addressFinder || "0x00"
  const itemID = params.itemID || ""

  try {
    const dataOwner = await getIDByAddress(base, addressOwner.toLowerCase())

    base('Claims').create({
      "Address Finder": addressFinder,
      "Owner": addressOwner,
      "Item ID": itemID,
      "Phone Number Owner": dataOwner.phoneNumber,
      "Email Owner": dataOwner.email
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ result: `Data recorded.` })
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ err })
    }
  }
}
