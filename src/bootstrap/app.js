import React from 'react'
import { Helmet } from 'react-helmet'
import loadable from '@loadable/component'
import { Router, navigate } from '@reach/router'
import styled from 'styled-components/macro'
import { BeatLoader } from 'react-spinners'
import { slide as Menu } from 'react-burger-menu'

import drizzle from './drizzle'
import { register } from './service-worker'
import { ArchonInitializer } from './archon'
import { DrizzleProvider, Initializer } from '../temp/drizzle-react-hooks'
import Identicon from '../components/identicon'
import { ReactComponent as Logo } from '../assets/images/logo.svg'

const Nav = () => (
  <nav>
    <div className="App-header-menu-logo">RECOVER</div>
    <Menu right>
      <a onClick={() => navigate('/')} className="menu-item">
        HOME
      </a>
      <a onClick={() => navigate('/')} className="menu-item">
        ADD ITEM
      </a>
      <a
        className="menu-item"
        href="https://t.me/joinchat/FHLxh03ifcIUaiFAu8DE0g"
        target="_blank"
      >
        TELEGRAM
      </a>
    </Menu>
  </nav>
)

const Main = ({ className, children }) => (
  <>
    <Nav />
    <main className={className}>{children}</main>
  </>
)

const StyledMain = styled(Main)`
  padding-top: 120px;
`

const C404 = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/404'),
  {
    fallback: <BeatLoader />
  }
)
const Home = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/home'),
  {
    fallback: <BeatLoader />
  }
)
const Item = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/item'),
  {
    // TODO: load the good
    fallback: <BeatLoader />
  }
)

export default () => (
  <>
    <Helmet>
      <title>Recover.to · Lost and Found service</title>
      <link
        href="https://fonts.googleapis.com/css?family=Roboto:400,400i,500,500i,700,700i"
        rel="stylesheet"
      />
    </Helmet>
    <DrizzleProvider drizzle={drizzle}>
      <Initializer
        error={<C404 Web3 />}
        loadingContractsAndAccounts={<C404 Web3 />}
        loadingWeb3={<BeatLoader />}
      >
        <ArchonInitializer>
          <Router>
            <StyledMain path="/">
              <Home path="/" />
              <Item path="contract/:contract/items/:itemID_Pk" />
              <C404 default />
            </StyledMain>
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
