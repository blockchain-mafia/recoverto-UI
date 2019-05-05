export default ({
  arbitrableAddress,
  owner,
  finder,
  title,
  nameDescription,
  emailDescription,
  telegramDescription,
  twitterDescription,
  facebookDescription,
  telephoneDescription,
  homeLocationDescription,
  noteDescription,
  typeItemDescription,
  descriptionItemDescription,
  fileURI,
  fileHash,
  amount,
  timeout,
  arbitrator
}) => ({
  category: 'Escrow',
  subCategory: 'Lost & Found Service',
  arbitrableAddress,
  title,
  description: {
    nameDescription,
    emailDescription,
    telegramDescription,
    twitterDescription,
    facebookDescription,
    telephoneDescription,
    homeLocationDescription,
    noteDescription,
    item: {
      type: typeItemDescription,
      description: descriptionItemDescription
    }
  },
  fileURI,
  fileHash,
  question: 'Which party abided by terms of the contract?',
  rulingOptions: {
    titles: ['Refund Owner', 'Pay Finder'],
    descriptions: [
      'Select to return funds to the Owner',
      'Select to release funds to the Finder'
    ]
  },
  aliases: {
    [owner]: 'owner',
    [finder]: 'finder'
  },
  evidenceDisplayInterfaceURI: '',
  owner,
  finder,
  amount,
  timeout,
  arbitrator
})