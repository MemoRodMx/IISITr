import React, { Component } from 'react'
import M from 'materialize-css'
import { config } from '../config'

class Home extends Component {
  constructor (props) {
    super(props)
    this.state = {
      stations: [],
      destinations: [],
      selectedOrigin: '',
      selectedDestination: '',
      sidenav: null,
      sidenavInstance: null,
      originInstance: null,
      destinationInstance: null,
      timeInstance: null,
      proximoInstance: null,
      userModal: {},
      costo: '0.00',
      proximo: '',
      nearModal: {},
      nearTrains: [
        { hora: 'Elija un origen y destino para ver si hay trenes proximos' }
      ],
      userTypes: [],
      userType: 0,
      userTypeInstance: {},
      pricesModal: {},
      prices: []
    }

    this.handleLoad = this.handleLoad.bind(this)
  }

  /**
   * Handler para la onLoad
   */
  handleLoad () {
    setTimeout(() => {
      this.setState({ sidenav: document.querySelectorAll('.sidenav') })
      this.setState({ sidenavInstance: M.Sidenav.init(this.state.sidenav, {}) })

      this.setState({
        originInstance: M.FormSelect.init(
          document.querySelectorAll('#origin'),
          {}
        ),
        destinationInstance: M.FormSelect.init(
          document.querySelectorAll('#destination'),
          {}
        ),
        userTypeInstance: M.FormSelect.init(
          document.querySelectorAll('#usersTypeList'),
          {}
        ),
        nearModal: M.Modal.init(document.querySelectorAll('#userModal'), {}),
        userModal: M.Modal.init(document.querySelectorAll('#nearModal'), {}),
        pricesModal: M.Modal.init(document.querySelectorAll('#pricesModal'), {})
      })
    }, 500)
  }

  /**
   * Obtiene el listado de estaciones disponibles
   */
  async loadStations () {
    document.querySelector('#loader').setAttribute('class', '')
    await fetch(config.api + '/estaciones', {
      headers: {
        'Content-type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(res => {
        this.setState({ stations: res.data, destinations: res.data })
        document.querySelector('#loader').setAttribute('class', 'loaded')
      })
      .catch(err => {
        console.log(err)
      })
  }

  /**
   * Obtiene el listado de tipos de usuario
   */
  loadUserTypes () {
    fetch(config.api + '/usuarios', {
      headers: {
        'Content-type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(res => {
        this.setState({ userTypes: res.data })
      })
      .catch(err => {
        console.log(err)
      })
  }

  /*
    Obtiene el listado de precios por categoria 
    omitiendo el perfil de usuario que este seleccionado
   */
  loadPricesByCategory () {
    console.log('getting prices')
    let url = new URL(
      config.api +
        '/precios/' +
        this.state.selectedOrigin +
        '/' +
        this.state.selectedDestination +
        '/' +
        this.state.userType
    )

    fetch(url, {
      headers: {
        'Content-type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(res => {
        this.setState({ prices: res.data })
      })
      .catch(err => {
        console.log(err)
      })
  }

  /**
   * Obtiene el tren mas cercano y ejecuta los fetch necesario
   * @param {*} destination
   */
  nearTrain (destination) {
    let url = new URL(
      config.api +
        '/near-train' +
        '/' +
        this.state.selectedOrigin +
        '/' +
        destination +
        '/0/' +
        this.state.userType
    )

    fetch(url, {
      headers: {
        'Content-type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(res => {
        if (undefined === res.error) {
          let d = res.data[0]
          this.setState({
            proximo: d.hora,
            costo: d.valor,
            tiempo: d.tiempo
          })

          url = new URL(
            config.api +
              '/near-trains' +
              '/' +
              this.state.selectedOrigin +
              '/' +
              destination +
              '/' +
              '0' +
              '/' +
              d.listed
          )

          this.getNearList(url)
          this.loadPricesByCategory()
        } else {
          this.setState({
            proximo: 'N/D',
            costo: 'N/D',
            tiempo: 'N/D',
            nearTrains: [{ hora: 'No hay trenes proximos' }]
          })

          M.toast({ html: res.error })
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  /**
   * Obtiene el listado de trenes próximos
   *
   * @param {*} event
   */
  getNearList (url) {
    fetch(url, {
      headers: {
        'Content-type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(res => {
        if (undefined === res.error) {
          if (res.data.length) {
            this.setState({
              nearTrains: res.data
            })
          } else {
            this.setState({
              nearTrains: [{ hora: 'No hay trenes proximos' }]
            })
          }
        } else {
          this.setState({
            nearTrains: [{ hora: 'No hay trenes proximos' }]
          })
          M.toast({ html: res.error })
        }
      })
      .catch(err => {
        console.log(err)
      })
  }

  /**
   * Handler para el cambio de origen
   * @param {*} event
   */
  changeOriginHandler = event => {
    this.setState({ selectedOrigin: event.target.value })

    if (undefined !== this.state.destinationInstance.destroy) {
      this.state.destinationInstance.destroy()
    }

    if (event.target.value) {
      this.setState({
        destinations: this.state.stations.filter(
          station => parseInt(station.codigo) !== parseInt(event.target.value)
        )
      })
    } else {
      this.setState({
        destinations: this.state.stations
      })
    }

    setTimeout(() => {
      this.setState({
        destinationInstance: M.FormSelect.init(
          document.querySelectorAll('#destination'),
          {}
        )
      })
    }, 500)
  }

  /**
   * Handler para el cambio de destino
   * @param {*} event
   */
  changeDestinationHandler = event => {
    this.setState({ selectedDestination: event.target.value })
    this.nearTrain(event.target.value)
  }

  /**
   * Handler para el cambio de tipo de usuario
   * @param {*} event
   */
  changeUserTypeHandler = event => {
    this.setState({ userType: event.target.value })
    this.reload()
  }

  /* Ejecuta las funciones necesarias para actualizar la informacion */
  reload () {
    this.nearTrain(this.state.selectedDestination)
  }

  /**
   * React componentDidMount
   */
  componentDidMount () {
    this.loadStations(this)
    this.loadUserTypes(this)
    window.addEventListener('load', this.handleLoad)
  }

  /**
   * React componentWillUnmount
   */
  componentWillUnmount () {
    window.removeEventListener('load', this.handleLoad)
  }

  /**
   * React getDerivedStateFromProps
   * Requerido para que respete el estado
   */
  static getDerivedStateFromProps (props, state) {
    return state
  }

  render () {
    return (
      <>
        <div className='p3'>
          <div className='row'>
            <h5 className='mb-2 col push-m4'>Viaje</h5>
          </div>

          <div className='row'>
            <div className='input-field col s12 l4 push-l4'>
              <select
                id='origin'
                defaultValue=''
                onChange={this.changeOriginHandler}
              >
                <option value='' disabled></option>
                {this.state.stations.map(station => {
                  return (
                    <option key={station.codigo} value={station.codigo}>
                      {station.nombre}
                    </option>
                  )
                })}
              </select>
              <label>Origen</label>
            </div>
          </div>

          <div className='row'>
            <div className='input-field col s12 l4 push-l4'>
              <select
                id='destination'
                defaultValue=''
                onChange={this.changeDestinationHandler}
              >
                <option value='' disabled></option>
                {this.state.destinations.map(station => {
                  return (
                    <option key={station.codigo} value={station.codigo}>
                      {station.nombre}
                    </option>
                  )
                })}
              </select>
              <label>Destino</label>
            </div>
          </div>

          <div className='row'>
            <h5 className='mb-2 col push-m4'>Estimaci&oacute;n</h5>
          </div>

          <div className='row'>
            <div className='input-field col s12 l4 push-l4'>
              <p className='text-right'>{this.state.proximo}</p>
              <label className='active' htmlFor='proximo'>
                Próximo
              </label>
            </div>
          </div>
          <div className='row'>
            <div className='input-field col s12 l4 push-l4'>
              <p className='text-right'>{this.state.costo}</p>
              <label className='active' htmlFor='costo'>
                Costo
              </label>
            </div>
          </div>
          <div className='row'>
            <div className='input-field col s12 l4 push-l4'>
              <p className='name text-right'>{this.state.tiempo}</p>
              <label className='active' htmlFor='tiempo'>
                Tiempo
              </label>
            </div>
          </div>

          <div id='nearModal' className='modal bottom-sheet'>
            <div className='modal-content'>
              <h5>Proximos Trenes</h5>
              <div className='row'>
                <div className='col s12 m6'>
                  <table id='#nearList'>
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Tiempo de espera</th>
                      </tr>
                    </thead>

                    <tbody>
                      {this.state.nearTrains.map(train => {
                        return (
                          <tr key={'near' + train.orig}>
                            <td>
                              <strong>{train.hora}</strong>
                            </td>
                            <td>
                              {train.hora.lastIndexOf('hay') !== -1
                                ? ' '
                                : parseInt(train.diff) + ' minuto(s)'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className='modal-footer'>
              <a
                href='/#'
                className='modal-close waves-effect waves-green btn-flat'
              >
                Aceptar
              </a>
            </div>
          </div>

          <div id='userModal' className='modal bottom-sheet'>
            <div className='modal-content'>
              <h5>Usuario</h5>

              <div className='row'>
                <div className='input-field col s12 l4 push-l4'>
                  <select
                    value={this.state.userType}
                    onChange={this.changeUserTypeHandler}
                    id='usersTypeList'
                  >
                    {this.state.userTypes.map(type => {
                      return (
                        <option key={'ut' + type.codigo} value={type.codigo}>
                          {type.tipo}
                        </option>
                      )
                    })}
                  </select>
                  <label>Tipo de Usuario</label>
                  <p className='spacer'></p>
                </div>
              </div>
            </div>
            <div className='modal-footer'>
              <a
                href='/#'
                className='modal-close waves-effect waves-green btn-flat'
              >
                Aceptar
              </a>
            </div>
          </div>

          <div id='pricesModal' className='modal bottom-sheet'>
            <div className='modal-content'>
              <h5>Precios por categoria</h5>
              <div className='row'>
                <div className='col s12 m6'>
                  <table id='#pricesList'>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Precio</th>
                      </tr>
                    </thead>

                    <tbody>
                      {this.state.prices.map(price => {
                        return (
                          <tr key={'price' + price.tipo}>
                            <td>{price.tipo}</td>
                            <td>{price.valor}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className='modal-footer'>
              <a
                href='/#'
                className='modal-close waves-effect waves-green btn-flat'
              >
                Aceptar
              </a>
            </div>
          </div>
        </div>
      </>
    )
  }
}

export default Home
