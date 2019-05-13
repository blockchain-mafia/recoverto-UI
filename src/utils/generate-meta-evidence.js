export default ({
  arbitrableAddress,
  owner,
  dataEncrypted,
  timeout,
  arbitrator
}) => ({
  category: 'Escrow',
  subCategory: 'Lost & Found Service',
  arbitrableAddress,
  dataEncrypted,
  question: 'Which party abided by terms of the contract?',
  rulingOptions: {
    titles: ['Refund Owner', 'Pay Finder'],
    descriptions: [
      'Select to return funds to the Owner',
      'Select to release funds to the Finder'
    ]
  },
  aliases: {
    [owner]: 'owner'
  },
  evidenceDisplayInterfaceURI: '',
  owner,
  timeout,
  arbitrator
})