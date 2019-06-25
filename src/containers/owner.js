import React, { Component, useCallback, useRef, useState, useMemo } from 'react'
import styled from 'styled-components/macro'
import { Formik, Field, ErrorMessage } from 'formik'
import QRCode from 'qrcode.react'
import Textarea from 'react-textarea-autosize'
import ReactToPrint from 'react-to-print'
import {
  Dropdown,
  DropdownItem,
  DropdownMenu
} from 'styled-dropdown-component'
import Modal from 'react-responsive-modal'

import { useDrizzle, useDrizzleState } from '../temp/drizzle-react-hooks'
import Button from '../components/button'
import ETHAmount from '../components/eth-amount'
import { useDataloader } from '../bootstrap/dataloader'
import ipfsPublish from './api/ipfs-publish'
import MessageBoxTx from '../components/message-box-tx'
import ReadFile from '../utils/read-file'
import Attachment from '../components/attachment'

import { ReactComponent as Settings } from '../assets/images/settings-orange.svg'

const Container = styled.div`
  font-family: Nunito;
  color: #444;
  margin: 0 126px;
  padding: 77px 104px;
  background: #fff;
  border-radius: 20px; 
  box-shadow: 0px 4px 50px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  @media (max-width: 768px) {
    padding: 2em 3em;
    margin: 0;
  }
`

const Title = styled.h2`
  font-family: Nunito;
  font-size: 40px;
  color: #14213d;
  padding-bottom: 20px;
`

const SubTitle = styled.h3`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  margin: 30px 0;
`

const Label = styled.div`
  margin-top: 24px;
  font-family: Roboto;
  font-style: normal;
  font-weight: 200;
  font-size: 16px;
  line-height: 19px;
  color: #5C5C5C;
`

const StyledPrint = styled.div`
  display: none;
  @media print {
    display: block;
    margin: 40px;
  }
`

const StyledNoClaim = styled.div`
  background: #efefef;
  border-radius: 10px;
  text-align: center;
  font-family: Nunito;
  font-style: normal;
  font-weight: 300;
  font-size: 20px;
  line-height: 70px;
  color: #777777;
  cursor: not-allowed;
`

const StyledClaimBoxContainer = styled.div`
  margin-bottom: 30px;
  padding-top: 4vw;
  background: #ffc282;
  border-radius: 10px;
  font-family: Roboto;
  font-style: normal;
  font-weight: 300;
  font-size: 20px;
  line-height: 20px;
  color: #777;
`

const StyledClaimAddressContainerBoxContent = styled.div`
  display: flex;
  flex-direction: column;
  padding:  0 4vw;
`

const StyledClaimDescriptionContainerBoxContent = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  padding:  0 4vw;
`

const StyledButtonClaimBox = styled.div`
  margin-top: 30px;
  width: 100%;
  color: #fff;
  background: #ff8300;
  border-radius: 0px 0px 10px 10px;
  font-family: Nunito;
  font-style: normal;
  font-weight: 600;
  font-size: 20px;
  line-height: 68px;
  text-align: center;
  cursor: pointer;
  &:hover {
    background: #a6ffcb;
    color: #444;
  }
`

const StyledClaimLabelBoxContent = styled.div`
  font-family: Roboto;
  font-weight: 300;
  font-size: 18px;
  line-height: 30px;
  color: #444;
`

const StyledClaimAddressBoxContent = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-family: Nunito;
  font-weight: 600;
  font-size: 20px;
  color: #191847;
  line-height: 30px;
`

const StyledClaimEmailBoxContent = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  margin-top: 10px;
  font-family: Nunito;
  font-weight: 600;
  font-size: 20px;
  color: #191847;
`

const StyledClaimDescriptionBoxContent = styled.div`
  white-space: pre-line;
  margin-top: 10px;
  font-family: Nunito;
  font-weight: 600;
  font-size: 20px;
  color: #191847;
`

const StyledClaimStatusBoxContent = styled.div`
  white-space: pre-line;
  margin: 10px 0 40px 0;
  font-family: Nunito;
  font-weight: 600;
  font-size: 20px;
  color: #191847;
`

const DropdownStyled = styled(Dropdown)`
  float: right;
  right: 20px;
  top: 10px;
`

const StyledSettings = styled(Settings)`
  padding: 10px;
  border-radius: 50%;
  &:hover {
    cursor: pointer;
    background: #fff;
  }
`
const DropdownMenuStyled = styled(DropdownMenu)`
  float: right;
  left: auto;
  right: 0;
`

const DropdownItemStyled = styled(DropdownItem)`
  line-height: 24px;
  &:hover {
    cursor: pointer;
  }
`

const ModalTitle = styled.h3`
  font-family: Nunito;
  font-size: 30px;
  color: #14213d;
  padding-bottom: 14px;
`

const StyledLabel  = styled.label`
  font-family: Roboto;
  color: #5c5c5c;
  font-size: 16px;
  line-height: 19px;
`

const StyledField = styled(Field)`
  line-height: 50px;
  padding-left: 20px;
  margin: 10px 0;
  width: 100%;
  display: block;
  background: #fff;
  border: 1px solid #ccc;
  box-sizing: border-box;
  border-radius: 5px;
`

const FieldContainer = styled.div`
  margin: 20px 0;
`

const StyledTextarea = styled(Textarea)`
  padding: 20px 0 0 20px;
  margin: 20px 0 40px 0;
  width: 100%;
  display: block;
  background: #FFFFFF;
  border: 1px solid #CCCCCC;
  box-sizing: border-box;
  border-radius: 5px;
  min-height: 11em;
  font-family: Nunito;
`

const Error  = styled.div`
  color: red;
  font-family: Roboto;
  font-size: 14px;
`

const Box = styled.div`
  display: flex;
  align-items: center;
  margin-top: 50px;
  color: #444;
  background-color: #a6ffcb;
  background-repeat: no-repeat;
  background-position: center;
  overflow: hidden;
  font-family: Roboto;
  padding: 0 40px;
  border-radius: 10px;
  font-size: 24px;
  height: 100px;
  overflow: hidden;
`

const StyledClaimEvidenceContainerBoxContent = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  padding:  0 4vw;
`

const StyledClaimEvidenceBoxContent = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 10px;
`

class ComponentToPrint extends Component {
  render() {
    return (
      <StyledPrint>
        <QRCode
          value={`${process.env.REACT_APP_URL_APP}/contract/${this.props.contract}/items/${
            this.props.itemID_Pk
          }`}
        />
      </StyledPrint>
    )
  }
}

export default props => {
  const recover = JSON.parse(localStorage.getItem('recover') || '{}')

  const [claimID, setClaimID] = useState(null)
  const [isOpen, setOpen] = useState(false)
  const [dropdownHidden, setDropdownHidden] = useState(true)
  const [isEvidenceSent, setIsEvidenceSent] = useState(false)
  const drizzleState = useDrizzleState(drizzleState => ({	
    account: drizzleState.accounts[0] || '0x0000000000000000000000000000000000000000',
    networkID: drizzleState.web3.networkId || 1,
    transactions: drizzleState.transactions
  }))
  const resetEvidenceReset = useCallback(resetForm => {
    if (!isEvidenceSent) {
      resetForm()
      setIsEvidenceSent(true)
    }
  })

  const componentRef = useRef()
  const { useCacheCall, useCacheSend, useCacheEvents, drizzle } = useDrizzle()

  const { send: sendAcceptClaim, status: statusAcceptClaim } = useCacheSend(
    'Recover',
    'acceptClaim'
  )
  const { send: sendPay, status: statusPay } = useCacheSend('Recover', 'pay')
  const { send: sendPayArbitrationFeeByOwner, status: statusPayArbitrationFeeByOwner } = useCacheSend(
    'Recover',
    'payArbitrationFeeByOwner'
  )
  const { send: sendAppeal, status: statusAppeal } = useCacheSend(
    'Recover',
    'appeal'
  )
  const { send: sendSubmitEvidence, status: statusSubmitEvidence } = useCacheSend(
    'Recover',
    'submitEvidence'
  )

  const itemID = props.itemID
  const privateKey = recover[itemID] ? recover[itemID].privateKey : null

  const item = useCacheCall('Recover', 'items', itemID.padEnd(66, '0'))

  const arbitratorExtraData = useCacheCall('Recover', 'arbitratorExtraData')

  const arbitrationCost = useCacheCall(
    'KlerosLiquid', 
    'arbitrationCost',
    (arbitratorExtraData || '0x00')
  )

  const claimIDs = useCacheCall('Recover', 'getClaimsByItemID', itemID.padEnd(66, '0'))

  const loadDescription = useDataloader.getDescription()

  if (
    item !== undefined 
    && item.descriptionEncryptedLink !== undefined
    && privateKey
  ) {
    const metaEvidence = loadDescription(item.descriptionEncryptedLink, privateKey)
    if (metaEvidence)
      item.content = metaEvidence
  }

  const getEvidence = useDataloader.getEvidence()

  const claims = useCacheCall(['Recover', 'KlerosLiquid'], call =>
    claimIDs
      ? claimIDs.reduce(
          (acc, d) => {
            const claim = call('Recover', 'claims', d)

            const funds = useCacheEvents(
              'Recover',
              'Fund',
              useMemo(
                () => ({
                  filter: { _claimID: d },
                  fromBlock: process.env.REACT_APP_DRAW_EVENT_LISTENER_BLOCK_NUMBER
                }),
                [drizzleState.account]
              )
            )

            if(claim) {
              let disputeStatus, currentRuling, appealCost, evidence, isRuled

              if (claim.disputeID != '0') {
                if (claim.status > '2') {
                  disputeStatus = call(
                    'KlerosLiquid',
                    'disputeStatus',
                    claim.disputeID
                  )
    
                  currentRuling = call(
                    'KlerosLiquid',
                    'currentRuling',
                    claim.disputeID
                  )

                  const dispute = call(
                    'KlerosLiquid',
                    'disputes',
                    claim.disputeID
                  )

                  if (dispute)
                    isRuled = dispute.ruled ? true : false
    
                  appealCost = call(
                    'KlerosLiquid',
                    'appealCost',
                    claim.disputeID,
                    (arbitratorExtraData || '0x00')
                  )

                  evidence = getEvidence(
                    drizzle.contracts.Recover.address,
                    drizzle.contracts.KlerosLiquid.address,
                    claim.disputeID
                  )
                }
              }

              const finderInformation = loadDescription(
                claim.descriptionLink,
                privateKey
              )

              if (finderInformation) {
                claim.description = finderInformation.dataDecrypted.description
                claim.finderEmail = finderInformation.dataDecrypted.email
              }

              acc.data.push({ 
                ...claim,
                isRuled,
                disputeStatus,
                currentRuling,
                appealCost,
                funds,
                evidence,
                ID: d
              })
            }

            // TODO: decrypt details information
            return acc
          },
          {
            data: [],
            loading: false
          }
        )
      : { loading: true }
  )

  return (
    <Container>
      <Formik
        initialValues={{
          name: '',
          description: '',
          evidenceFile: ''
        }}
        validate={values => {
          let errors = {}
          if (values.name  === '')
            errors.name = 'Name Required'
          if (values.description.length > 100000)
            errors.description =
              'The maximum numbers of the characters for the description is 100,000 characters.'
          if (values.evidenceFile.size > 5000000)
            errors.evidenceFile = 'The file is too big. The maximum size is 5MB.'
          return errors
        }}
        onSubmit={async ({ name, description, evidenceFile }) => {
          setIsEvidenceSent(false)

          let evidenceFileURI = ''

          if (evidenceFile) {
            const evidenceArrayBuffer = await ReadFile(evidenceFile.dataURL)

            const ipfsHashEvidenceObj = await ipfsPublish(
              evidenceFile.name,
              new Buffer(evidenceArrayBuffer)
            )

            evidenceFileURI = await `ipfs/${
              ipfsHashEvidenceObj[1].hash
            }${ipfsHashEvidenceObj[0].path}`
          }
          
          const evidence = await {
            evidenceFileURI,
            name,
            description
          }

          const enc = new TextEncoder()

          // Upload the evidence to IPFS
          const ipfsHashEvidenceObj = await ipfsPublish(
            'evidence.json',
            enc.encode(JSON.stringify(evidence)) // encode to bytes
          )

          const ipfsHashEvidence =
            `${ipfsHashEvidenceObj[1].hash}${ipfsHashEvidenceObj[0].path}`

          await sendSubmitEvidence(
            claimID,
            `/ipfs/${ipfsHashEvidence}`
          )
        }}
      >
        {({
          submitForm,
          errors,
          setFieldValue,
          values,
          handleChange,
          resetForm
        }) => (
          <Modal 
            open={isOpen} 
            onClose={() => setOpen(false)} 
            center
            styles={{
              closeButton: {background: 'transparent'},
              modal: {width: '80vw', maxWidth: '300px', padding: '6vh 8vw'}
            }}
          >
            <ModalTitle>Evidence</ModalTitle>
            <FieldContainer>
              <StyledLabel htmlFor="name">
                <span 
                  className="info"
                  aria-label="The name of the evidence"
                >
                  Name
                </span>
              </StyledLabel>
              <StyledField
                name="name"
                placeholder="Name"
              />
              <ErrorMessage
                name="name"
                component={Error}
              />
            </FieldContainer>
            <FieldContainer>
              <StyledLabel htmlFor="description">
                <span 
                  className="info"
                  aria-label="
                    Description of the evidence.
                  "
                >
                  Description
                </span>
              </StyledLabel>
              <StyledField
                name="description"
                value={values.description}
                render={({ field, form }) => (
                  <StyledTextarea
                    {...field}
                    placeholder="Description of the evidence"
                    onChange={e => {
                      handleChange(e)
                      form.setFieldValue('description', e.target.value)
                    }}
                  />
                )}
              />
              <ErrorMessage
                name="description"
                component={Error}
              />
            </FieldContainer>
            {/* hack Formik for file type */}
            {/* and store only the path on the file in the redux state */}
            <FieldContainer>
              <StyledLabel htmlFor="evidenceFile">
                <span 
                    className="info"
                    aria-label="A file to prove your statement."
                  >
                    File (optional)
                  </span> 
              </StyledLabel>
              <div className="NewEvidenceArbitrableTx-form-file FileInput">
                <input
                  className="FileInput-input--noBorder"
                  id="evidenceFile"
                  name="evidenceFile"
                  type="file"
                  // eslint-disable-next-line react/jsx-no-bind
                  onChange={e => {
                    const file = e.currentTarget.files[0]
                    if (file)
                      return setFieldValue('evidenceFile', {
                        dataURL: e.currentTarget.files[0],
                        name: file.name
                      })
                  }}
                />
                <div className="FileInput-filename">
                  {values.evidenceFile ? values.evidenceFile.name : null}
                </div>
              </div>
              {errors.evidenceFile && <div className="error">{errors.evidenceFile}</div>}
            </FieldContainer>
            <Button
              onClick={submitForm}
              style={{width: '100%'}}
              type="submit"
              disabled={Object.entries(errors).length > 0 || (statusSubmitEvidence && statusSubmitEvidence === 'pending')}
            >
              Submit Evidence
            </Button>
            {statusSubmitEvidence && statusSubmitEvidence === 'pending' && (
              <MessageBoxTx
                pending={true}
                onClick={() => {
                  window.open(
                    `https://${drizzleState.networkID === 42 ? 'kovan.' : ''}etherscan.io/tx/${Object.keys(drizzleState.transactions)[0]}`,
                    '_blank'
                  )
                  resetForm()
                }}
              />
            )}
            {
              statusSubmitEvidence && statusSubmitEvidence === 'success' && (
                <Box>
                  Evidence sent
                  { !isEvidenceSent && resetEvidenceReset(resetForm) }
                </Box>
              )
            }
          </Modal>
        )}
      </Formik>
      {item ? (
        <>
          <Title>{item.content ? item.content.dataDecrypted.type : 'Item'}</Title>
          <Label>Description</Label>
          <div style={{padding: '10px 0', whiteSpace: 'pre-line', lineHeight: '24px'}}>
            {item.content ? item.content.dataDecrypted.description : '...'}
          </div>
          <Label>Contact Information</Label>
          <div style={{padding: '10px 0', whiteSpace: 'pre-line', lineHeight: '24px'}}>
            {item.content ? item.content.dataDecrypted.contactInformation : '...'}
          </div>
          <Label>Reward</Label>
          <div style={{padding: '10px 0'}}>{
              ETHAmount({amount: item.rewardAmount, decimals: 2})
            } ETH
          </div>
          <SubTitle>Qr code</SubTitle>
          <div style={{textAlign: 'center'}}>
            <QRCode
              value={
                `${process.env.REACT_APP_URL_APP}/contract/${props.contract}/items/
                ${itemID}-privateKey=${privateKey}`}
            />
            <ReactToPrint
              trigger={() => <div style={{paddingTop: '20px'}}><button>Print Qr Code</button></div>}
              content={() => componentRef.current}
            />
            <ComponentToPrint contract={props.contract} itemID_Pk={props.itemID_Pk} ref={componentRef} />
          </div>
        </>
      ) : (
        <Title>Loading Item...</Title>
      )}
      {
        item && item.owner === drizzleState.account && (
          <>
            <SubTitle>List Claims</SubTitle>
            {
              !claims.loading && claims.data && claims.data.length === 0 && (
                <StyledNoClaim>There is no claim.</StyledNoClaim>
              )
            }
            {
              !claims.loading && claims.data && claims.data.map(claim => (
                <div key={claim.ID}>
                  {claim.amountLocked > 0 && (
                    <DropdownStyled>
                      <StyledSettings
                        style={!dropdownHidden ? {background: '#fff'} : {}}
                        onClick={() => setDropdownHidden(!dropdownHidden)}
                      />
                      <DropdownMenuStyled hidden={dropdownHidden}>
                      {/* TODO: add loader transaction */}
                      { claim.status === '0' && (
                        <DropdownItemStyled
                          onClick={() => {
                            sendPayArbitrationFeeByOwner(
                              claim.ID,
                              { value: arbitrationCost }
                            )
                            setDropdownHidden(!dropdownHidden)
                          }}
                        >
                          Raise a Dispute
                        </DropdownItemStyled>
                      )}
                      {
                        claim.status > '0' && claim.status < '4' && (
                          <DropdownItemStyled
                            onClick={() => {
                              // TODO: open a box to submit an evidence
                              setClaimID(claim.ID)
                              setOpen(true)
                              setDropdownHidden(!dropdownHidden)
                            }}
                          >
                            Submit an Evidence
                          </DropdownItemStyled>
                        )
                      }
                      {
                        claim.status === '3' 
                        && claim.currentRuling === '2' 
                        && claim.disputeStatus === '1' 
                        && claim.isRuled 
                        && (
                          <DropdownItemStyled
                            onClick={() => {
                              sendAppeal(
                                claim.ID,
                                { value: claim.appealCost }
                              )
                              setDropdownHidden(!dropdownHidden)
                            }}
                          >
                            Appeal to the Ruling
                          </DropdownItemStyled>
                        )
                      }
                      </DropdownMenuStyled>
                    </DropdownStyled>
                  )}
                  <StyledClaimBoxContainer>
                    <StyledClaimAddressContainerBoxContent>
                      <StyledClaimLabelBoxContent>Finder</StyledClaimLabelBoxContent>
                        <StyledClaimAddressBoxContent>
                          {claim.finder}
                        </StyledClaimAddressBoxContent>
                    </StyledClaimAddressContainerBoxContent>
                    {claim.finderEmail && (
                      <StyledClaimDescriptionContainerBoxContent>
                        <StyledClaimLabelBoxContent>
                          Email
                        </StyledClaimLabelBoxContent> 
                        <StyledClaimEmailBoxContent>
                          {claim.finderEmail}
                        </StyledClaimEmailBoxContent> 
                      </StyledClaimDescriptionContainerBoxContent>
                    )}
                    {claim.description && (
                      <StyledClaimDescriptionContainerBoxContent>
                        <StyledClaimLabelBoxContent>
                          Description
                        </StyledClaimLabelBoxContent> 
                        <StyledClaimDescriptionBoxContent>
                          {claim.description}
                        </StyledClaimDescriptionBoxContent>
                      </StyledClaimDescriptionContainerBoxContent>
                    )}
                    {claim.evidence && claim.evidence.length && (
                      <StyledClaimEvidenceContainerBoxContent>
                        <StyledClaimLabelBoxContent>
                          Evidence{claim.evidence.length > 0 && 's'}
                        </StyledClaimLabelBoxContent> 
                        <StyledClaimEvidenceBoxContent>
                          { claim.evidence.map(e => (
                            <Attachment
                              key={e.transactionHash}
                              URI={e.evidenceJSON.evidenceFileURI}
                              description={e.evidenceJSON.description}
                              title={e.evidenceJSON.name}
                            />
                          ))}
                        </StyledClaimEvidenceBoxContent>
                      </StyledClaimEvidenceContainerBoxContent>
                    )}
                    {
                      claim.status > 0 && (
                        <StyledClaimDescriptionContainerBoxContent>
                          <StyledClaimLabelBoxContent>Status Dispute:</StyledClaimLabelBoxContent>
                          <StyledClaimStatusBoxContent>
                            {
                              claim.status === '1'
                                ? 'Awaiting the fee from the finder.'
                                : claim.status === '2'
                                  ? 'Awaiting the fee from you.'
                                  : claim.status === '3'
                                    ? !claim.isRuled
                                      ? 'Dispute Ongoing'
                                      : claim.currentRuling === '1'
                                        ? 'You win the dispute. The dispute can be appealable.'
                                        : 'You lose the dispute. The dispute can be appealable.'
                                    : claim.status === '4' && claim.currentRuling === '1'
                                      ? 'You win the dispute.'
                                      : 'You lose the dispute.'
                            }
                          </StyledClaimStatusBoxContent>
                        </StyledClaimDescriptionContainerBoxContent>
                      )
                    }

                    {claim.amountLocked === '0' && claim.funds && claim.funds.length === 0 && (
                      <StyledButtonClaimBox
                        onClick={() =>
                          sendAcceptClaim(
                            claim.ID, 
                            { value: item.rewardAmount}
                          )
                        }
                      >
                        ACCEPT CLAIM
                      </StyledButtonClaimBox>
                    )}

                    {claim.status === '0' && claim.amountLocked > 0 && claim.funds && claim.funds.length === 0 && (
                      <StyledButtonClaimBox
                        onClick={() =>
                          sendPay(
                            claim.ID,
                            claim.amountLocked
                          )
                        }
                      >
                        REWARD THE FINDER
                      </StyledButtonClaimBox>
                    )}
                    {claim.funds && claim.funds.length > 0 && (
                      <StyledButtonClaimBox
                        style={{cursor: 'not-allowed'}}
                      >
                        TRANSACTION FINISHED
                      </StyledButtonClaimBox>
                    )}
                  </StyledClaimBoxContainer>
                </div>
              ))
            }
          </>
        )
      }
    </Container>
  )
}
