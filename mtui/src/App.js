import React from 'react'
import './App.css'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Home from './components/Home'
import logo from './logo.png'

function App () {
  return (
    <div className='App'>
      <div id='loader'>
        <div className='preloader-wrapper big active'>
          <div className='spinner-layer spinner-blue-only'>
            <div className='circle-clipper left'>
              <div className='circle'></div>
            </div>
            <div className='gap-patch'>
              <div className='circle'></div>
            </div>
            <div className='circle-clipper right'>
              <div className='circle'></div>
            </div>
          </div>
        </div>
        <p>Cargando...</p>
      </div>
      <nav className='grey darken-4'>
        <div className='nav-wrapper'>
          <a href='/' className='brand-logo'>
            <img src={logo} alt='Tr5NR' />
            Tr5NR
          </a>
          <a href='/#' data-target='mobileMenu' className='sidenav-trigger'>
            <i className='material-icons'>menu</i>
          </a>
          <ul className={'right hide-on-med-and-down'}>
            <li>
              <a href={'/#'} className='modal-trigger' data-target='nearModal'>
                Próximos Trenes
              </a>
            </li>
            <li>
              <a href={'/#'} className='modal-trigger' data-target='userModal'>
                Usuario
              </a>
            </li>
            <li>
              <a
                href={'/#'}
                className='modal-trigger'
                data-target='pricesModal'
              >
                Precios por categoria
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <ul className='sidenav' id='mobileMenu'>
        <li>
          <a href={'/#'} className='modal-trigger' data-target='nearModal'>
            Próximos Trenes
          </a>
        </li>
        <li>
          <a href={'/#'} className='modal-trigger' data-target='userModal'>
            Usuario
          </a>
        </li>
        <li>
          <a href={'/#'} className='modal-trigger' data-target='pricesModal'>
            Precios por categoria
          </a>
        </li>
      </ul>
      <Router>
        <Switch>
          <Route path='/' exact>
            <Home />
          </Route>
        </Switch>
      </Router>
    </div>
  )
}

export default App
