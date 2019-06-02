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

console.log(AIRTABLE_API_KEY)

// TODO: use a bot instead of a netlify function to avoid a DDOS attack
export function handler(event, context, callback) {
  // Only allow POST
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
    .base(AIRTABLE_BASE)

  const params = JSON.parse(event.body)
  const addressOwner = params.addressOwner || "0x00"
  const addressFinder = params.addressFinder || "0x00"
  const itemID = params.itemID || ""
  const emailOwner = params.emailOwner || ""
  const phoneNumberOwner = params.phoneNumberOwner || ""

  try {
    base('Claims').create({
      "Address Finder": addressFinder,
      "Owner": addressOwner,
      "Item ID": itemID,
      "Phone Number Owner": phoneNumberOwner,
      "Email Owner": emailOwner
    })
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({ result: "Data recorded" })
    })
  } catch (err) { 
    console.log(err)
    callback(null, {
      statusCode: err.response.status,
      body: JSON.stringify({ ...err.response.data })
    })
  }
}
