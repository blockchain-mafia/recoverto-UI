import Airtable from 'airtable'
import fs from 'fs'
import dotenv from 'dotenv'

import getIdByAddress from '../utils/getIdByAddress'

// TODO: move to utils folder
// Set up airtable envs in the development environnement.
if (fs.existsSync('.airtable')) {
  const envConfig = dotenv.parse(
    fs.readFileSync('.airtable')
  )

  for (let k in envConfig) {
    process.env[k] = envConfig[k]
  }
}

const { AIRTABLE_API_KEY } = process.env

// TODO: use a bot instead of a netlify function to avoid a DDOS attack
exports.handler = async function(event) {
  // Only allow POST
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" }

  const params = JSON.parse(event.body)
  const network = params.network || "MAINNET"
  const addressOwner = params.addressOwner || "0x00"
  const addressFinder = params.addressFinder || "0x00"
  const itemID = params.itemID || ""
  const isAdvanced = params.isAdvanced || false
  const privateKeyFinder = params.privateKeyFinder || ""
  const emailFinder = params.emailFinder || ""

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY })
    .base(process.env[`AIRTABLE_${network}_BASE`])

  try {
    const dataOwner = await getIdByAddress(base, addressOwner.toLowerCase())

    base('Claims').create({
      "Address Finder": addressFinder,
      "Owner": addressOwner,
      "Item ID": itemID,
      "Advanced Mode": isAdvanced,
      "Private Key Finder": privateKeyFinder,
      "Email Finder": emailFinder,
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
