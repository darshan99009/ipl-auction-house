// ============================================================
// IPL AUCTION HOUSE — CUSTOM SERVER
// Runs Next.js + Socket.IO on the same process
// Deploy this to Railway (not Vercel)
// ============================================================
const { createServer } = require('http')
const { parse }        = require('url')
const next             = require('next')
const { Server }       = require('socket.io')

const dev  = process.env.NODE_ENV !== 'production'
const app  = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  // ---- Socket.IO ----
  const io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'https://ipl-auction-house.vercel.app',
      ],
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    transports:      ['websocket', 'polling'],
    pingTimeout:     60000,
    pingInterval:    25000,
    upgradeTimeout:  30000,
    maxHttpBufferSize: 1e6,
  })

  // Attach auction handler
  const { registerAuctionHandlers } = require('./backend/socket/auctionHandlers')
  const { registerRoomHandlers }    = require('./backend/socket/roomHandlers')
  const { registerSocialHandlers }  = require('./backend/socket/socialHandlers')
  const { RoomStateManager }        = require('./backend/engine/RoomStateManager')

  // Global room state manager
  const roomManager = new RoomStateManager()

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`)

    registerRoomHandlers(io, socket, roomManager)
    registerAuctionHandlers(io, socket, roomManager)
    registerSocialHandlers(io, socket, roomManager)

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} — ${reason}`)
      roomManager.handleDisconnect(socket.id)
    })
  })

  // Make io available to API routes
  global.__io = io

  const PORT = parseInt(process.env.PORT ?? '3000', 10)
  httpServer.listen(PORT, () => {
    console.log(`> IPL Auction House ready on http://localhost:${PORT}`)
    console.log(`> Environment: ${dev ? 'development' : 'production'}`)
  })
})
