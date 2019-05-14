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
      <div onClick={() => navigate('/')} style={{cursor: 'pointer'}} className="App-header-menu-logo">RECOVER</div>
      <Menu right>
        <Link to='/' className="menu-item">
          HOME
        </Link>
        <Link to='/new' className="menu-item">
          ADD ITEM
        </Link>
        <a
          className="menu-item"
          href="https://t.me/joinchat/FHLxh03ifcIUaiFAu8DE0g"
          target="_blank"
          rel="noopener noreferrer"
        >
          TELEGRAM
        </a>
      </Menu>
    </div>
  )
}

const Main = ({ children }) => (
  <>
    <Nav />
    <main>{children}</main>
  </>
)

const ContainerLoader = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
`

const C404 = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/404'),
  {
    fallback: <ContainerLoader><BeatLoader color={'#fff'} /></ContainerLoader>
  }
)
const Home = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/home'),
  {
    fallback: <ContainerLoader><BeatLoader color={'#fff'} /></ContainerLoader>
  }
)
const New = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/new'),
  {
    fallback: <ContainerLoader><BeatLoader color={'#fff'} /></ContainerLoader>
  }
)
const Item = loadable(
  () => import(/* webpackPrefetch: true */ '../containers/item'),
  {
    // TODO: load the good
    fallback: <ContainerLoader><BeatLoader color={'#fff'} /></ContainerLoader>
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
        loadingWeb3={<ContainerLoader><BeatLoader color={'#fff'} /></ContainerLoader>}
      >
        <ArchonInitializer>
          <Router>
            <Main path="/">
              <Home path="/" />
              <New path="/new" />
              <Item path="/contract/:contract/items/:itemID_Pk" /> 
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
