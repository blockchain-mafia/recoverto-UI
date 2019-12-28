export default (base, address) => {
  return new Promise((resolve, reject) => {
    base('Owners').select({
      view: 'Grid view',
      filterByFormula: `{Address} = '${address}'`
    }).firstPage((err, records) => { // TODO: display err, `reject(err)` !?
      if (records.length === 0) resolve(false)
      else records.forEach(record => resolve({
        ID: record['id'],
        email: record.get('Email'),
        phoneNumber: record.get('Phone Number')
      }))
    })
  })
}