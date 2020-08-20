var http = require('http')
const express = require('express')
const cors = require('cors')
const db = require('./services/database')
const port = 8080
const moment = require('moment')
const fs = require('fs')
const https = require('https')

const config = require('./config')

const options = {
  key: fs.readFileSync('C:/Certbot/live/spid.viewdns.net/privkey.pem'),
  cert: fs.readFileSync('C:/Certbot/live/spid.viewdns.net/cert.pem')
}
const app = express()

if (config.mode == 'ssl') {
  const server = https.createServer(options, app).listen(port, function () {
    console.log('Express (SSL) server listening on port ' + port)
  })
} else {
  app.listen(port, () => {
    console.log('Express Listening on port: ', port)
  })
}
app.use(cors())
app.use(express.json())

app.get('/', function (req, res) {
  res.status(200).send('OK')
})

app.get('/usuarios', function (req, res) {
  db.query('SELECT * FROM usuario').then(data => {
    res.json({ data })
  })
})

/**
 * Devuelve las estaciones del catalogo
 * Tabla: estacion
 */
app.get('/estaciones', function (req, res) {
  ;(async () => {
    const data = await db.query('SELECT * FROM estacion').then(data => {
      res.json({ data })
    })
  })()
})

/**
 * Devuelve los trenes proximos
 * Tabla: horario
 */
app.get('/near-trains/:origin/:destination/:dia/:listed', function (req, res) {
  p = req.params

  if (
    undefined != p.origin &&
    undefined != p.destination &&
    undefined != p.dia
  ) {
    hora = moment(new Date()).format('HH:mm:ss')
    epoch = moment('1969-12-31 ' + hora).add(2, 'days')

    let query = `
    SELECT
      h.*
    FROM
      horario h
    WHERE
      h.dia = ${p.dia}
      AND h.origen = ${p.origin}
      AND h.direccion = ${p.destination}
      AND h.hora > ${p.listed}
    ORDER BY
    h.hora ASC 
    `
    console.log(query)
    ;(async () => {
      await db.query(query).then(data => {
        if (undefined != data.length) {
          data.forEach((el, i) => {
            date = moment(el.hora * 1000)

            data[i].orig = el.hora
            data[i].hora = date.format('HH:mm')

            //          console.log('epoch', epoch, date)

            data[i].diff = moment.duration(date.diff(epoch)).as('minutes')
            data[i].epoch = epoch
            data[i].date = date
          })

          res.json({ data })
        } else {
          res.json({ error: 'No hay trenes disponibles' })
        }
      })
    })()
  }
})

/**
 * Devuelve el tren mas proximo
 *
 */
app.get('/near-train/:origin/:destination/:dia/:tipo_usuario', function (
  req,
  res
) {
  p = req.params

  if (p.origin && p.destination && p.dia && p.tipo_usuario) {
    hora = moment(new Date()).format('HH:mm:ss')
    epoch = moment('1969-12-31 ' + hora).add(2, 'days')

    let query = `
    SELECT
      h.hora,
      t.valor,
      ( SELECT e.tramo FROM estacion e WHERE h.origen = e.codigo ) AS tramo1,
      ( SELECT e.tramo FROM estacion e WHERE h.direccion = e.codigo ) AS tramo2,
      r.codigo AS rango,
      ( SELECT tt.tiempo FROM estacion tt WHERE h.origen = tt.codigo ) AS tiempo1,
      ( SELECT tt.tiempo FROM estacion tt WHERE h.direccion = tt.codigo ) AS tiempo2,
      CASE
        
        WHEN ((
          SELECT
            tt.tiempo 
          FROM
            estacion tt 
          WHERE
            h.origen = tt.codigo 
            ) > ( SELECT tt.tiempo FROM estacion tt WHERE h.direccion = tt.codigo ) 
          ) THEN
          ( SELECT tt.tiempo FROM estacion tt WHERE h.origen = tt.codigo ) - ( SELECT tt.tiempo FROM estacion tt WHERE h.direccion = tt.codigo ) ELSE ( SELECT tt.tiempo FROM estacion tt WHERE h.direccion = tt.codigo ) - ( SELECT tt.tiempo FROM estacion tt WHERE h.origen = tt.codigo ) 
        END AS tiempo 
    FROM
      horario h
      JOIN rango r ON ( h.hora BETWEEN r.desde AND r.hasta )
      JOIN tarifa t ON (
        t.origen = ( SELECT e.tramo FROM estacion e WHERE h.origen = e.codigo AND t.rango = r.codigo ) 
      AND t.destino = ( SELECT e.tramo FROM estacion e WHERE h.direccion = e.codigo AND t.rango = r.codigo )
      AND t.usuario = ${p.tipo_usuario}
      ) 
      
    WHERE
      h.dia = ${p.dia}
      AND h.origen = ${p.origin}
      AND h.direccion = ${p.destination}
      AND h.hora >= ${epoch.format('X')}
    ORDER BY
    h.hora ASC 
    LIMIT 1
    `

    db.query(query).then(data => {
      if (data.length) {
        data[0].listed = data[0].hora
        hora = moment(data[0].hora * 1000).format('HH:mm')
        data[0].hora = hora
        res.json({ data })
      } else {
        res.json({ error: 'No hay trenes disponibles' })
      }
    })
  }
})

/**
 * Devuelve las tipos de usuario del catalogo
 * Tabla: usuario
 */
app.get('/usuarios', function (req, res) {
  p = req.params

  let query = `
    SELECT
    *
    FROM
    usuario
    `

  db.query(query).then(data => {
    if (data.length) {
      res.json({ data })
    } else {
      res.json({
        error: 'Ocurrio un problema al solicitar los tipos de usuario'
      })
    }
  })
})

/**
 * Devuelve las tipos de usuario del catalogo
 * Tabla: tarifa
 */
app.get('/precios/:origin/:destination/:except', function (req, res) {
  p = req.params
  let hora = moment(new Date()).format('HH:mm:ss')
  let epoch = moment('1969-12-31 ' + hora).add(2, 'days')

  let query = `
    SELECT
      u.tipo,
      t.valor
    FROM
    tarifa t
      JOIN usuario u ON u.codigo = t.usuario
      JOIN rango r ON ( ${epoch.format('X')} BETWEEN r.desde AND r.hasta )
    WHERE
      t.origen = ( SELECT e.tramo FROM estacion e WHERE e.codigo = ${
        p.origin
      } AND t.rango = r.codigo ) 
      AND t.destino = ( SELECT e.tramo FROM estacion e WHERE e.codigo = ${
        p.destination
      } AND t.rango = r.codigo )
      AND u.codigo <> ${p.except}
    `

  db.query(query).then(data => {
    if (data.length) {
      res.json({ data })
    } else {
      res.json({
        error: 'Ocurrio un problema al solicitar los tipos de usuario'
      })
    }
  })
})
