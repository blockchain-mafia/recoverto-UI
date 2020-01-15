import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import loadable from '@loadable/component'
import { Router, navigate, Link } from '@reach/router'
import styled from 'styled-components/macro'
import { BeatLoader } from 'react-spinners'
import { slide as Menu } from 'react-burger-menu'

import drizzle from './drizzle'
import { register } from './service-worker'
import { ArchonInitializer } from './archon'
import { DrizzleProvider, Initializer } from '../temp/drizzle-react-hooks'

const Nav = () => {
  const [isTop, setTop] = useState(true)
  const [network, setNetwork] = useState('mainnet')
  // TODO: add logic to set up the contract
  const [contract, setContract] = useState(process.env.REACT_APP_RECOVER_MAINNET_ADDRESS)

  useEffect(() => {
    const urlSplitArray = window.location.href.split('/')
    if (urlSplitArray.indexOf('network') !== -1)
      setNetwork(urlSplitArray[urlSplitArray.indexOf('network') + 1])
  }, [window.location.href])

  useEffect(() => {
    document.addEventListener('scroll', () => {
      if (window.scrollY >= 1 && true === isTop) {
        setTop(false)
      } else {
        setTop(true)
      }
    })
  }, [])

  return (
    <div className={`App-header-menu ${isTop ? 'App-header-menu__isTop' : ''}`}>
      <div
        onClick={() => navigate(`/`)}
        style={{ cursor: 'pointer' }}
        className="App-header-menu-logo"
      >
        RECOVER
      </div>
      <Menu right>
        <Link to={`/network/${network}/contract/${contract}`} className="menu-item">
          HOME
        </Link>
        <Link to={`/network/${network}/contract/${contract}/new/items/undefined/pk/undefined`} className="menu-item">
          ADD ITEM
        </Link>
        <Link to={`/network/${network}/contract/${contract}/settings`} className="menu-item">
          SETTINGS
        </Link>
      </Menu>
    </div>
  )
}

const Main = ({ children }) => (
  <>
    <Nav test={children}/>
    <main>{children}</main>
  </>
)

const ContainerLoader = styled.div`
  position: absolute;
  top: 50%;
  left: calc(50% - 28px);
`

const Home = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/home'),
  {
    fallback: (
      <ContainerLoader>
        <BeatLoader color={'#fff'} />
      </ContainerLoader>
    )
  }
)
const New = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/new'),
  {
    fallback: (
      <ContainerLoader>
        <BeatLoader color={'#fff'} />
      </ContainerLoader>
    )
  }
)
const Owner = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/owner'),
  {
    fallback: (
      <ContainerLoader>
        <BeatLoader color={'#fff'} />
      </ContainerLoader>
    )
  }
)
const Claim = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/claim'),
  {
    fallback: (
      <ContainerLoader>
        <BeatLoader color={'#fff'} />
      </ContainerLoader>
    )
  }
)
const ClaimSuccess = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/claim-success'),
  {
    fallback: (
      <ContainerLoader>
        <BeatLoader color={'#fff'} />
      </ContainerLoader>
    )
  }
)
const Finder = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/finder'),
  {
    fallback: (
      <ContainerLoader>
        <BeatLoader color={'#fff'} />
      </ContainerLoader>
    )
  }
)
const Settings = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/settings'),
  {
    fallback: (
      <ContainerLoader>
        <BeatLoader color={'#fff'} />
      </ContainerLoader>
    )
  }
)
const C404 = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/404'),
  {
    fallback: (
      <ContainerLoader>
        <BeatLoader color={'#fff'} />
      </ContainerLoader>
    )
  }
)

export default () => (
  <>
    <Helmet>
      <title>RECOVER · Lost and Found service</title>
      <link
        href="https://fonts.googleapis.com/css?family=Roboto:400,400i,500,500i,700,700i"
        rel="stylesheet"
      />
    </Helmet>
    <DrizzleProvider drizzle={drizzle}>
      <Initializer
        error={<C404 Web3 />}
        loadingContractsAndAccounts={<C404 Web3 />}
        loadingWeb3={
          <ContainerLoader>
            <BeatLoader color={'#fff'} />
          </ContainerLoader>
        }
      >
        <ArchonInitializer>
          <Router>
            <Main path="/">
              <Home path="network/:network/contract/:contract" />
              <New path="network/:network/contract/:contract/new/items/:itemID/pk/:pk" />
              <Settings path="network/:network/contract/:contract/settings" />
              <Owner path="network/:network/contract/:contract/items/:itemID/owner" />
              {/* NOTE: for one item, several claims are possible */}
              <Finder path="network/:network/contract/:contract/claims/:claimID" />
              <ClaimSuccess path="network/:network/contract/:contract/items/:itemID/pk/:pk/claim-success" />
              <Claim path="network/:network/contract/:contract/items/:itemID_Pk" />
              <C404 default />
            </Main>
          </Router>
        </ArchonInitializer>
      </Initializer>
    </DrizzleProvider>
  </>
)

register({
  onUpdate: () => (
    <p>An update is ready to be installed. Please restart the application.</p>
  )
})
