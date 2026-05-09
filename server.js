const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

let orders = [];
let counter = 1;

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} conectado — total: ${io.engine.clientsCount}`);
  socket.emit('init', orders);

  socket.on('novo_pedido', (pedido) => {
    pedido.id = Date.now();
    pedido.num = String(counter++).padStart(3, '0');
    pedido.status = 'aguardando';
    pedido.hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    orders.unshift(pedido);
    console.log(`[PEDIDO] #${pedido.num} — ${pedido.nome}`);
    io.emit('pedido_novo', pedido);
  });

  socket.on('mudar_status', ({ id, status }) => {
    const o = orders.find(x => x.id === id);
    if (o) {
      o.status = status;
      if (status === 'dispensado') {
        o.horaDispensado = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      console.log(`[STATUS] #${o.num} → ${status}`);
      io.emit('status_atualizado', { id, status, horaDispensado: o.horaDispensado });
    }
  });

  socket.on('remover_pedido', (id) => {
    orders = orders.filter(o => o.id !== id);
    io.emit('pedido_removido', id);
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} desconectado`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
