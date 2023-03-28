package ws

import (
	"log"

	"github.com/gorilla/websocket"
)

type Connections struct {
	conn_dict      map[int]*websocket.Conn
	next_id        int
	handlers       map[int]func(*websocket.Conn, string)
	defaulthandler func(*websocket.Conn, int, string)
}

func CreateConnectionsStruct() Connections {
	var c Connections
	c.conn_dict = make(map[int]*websocket.Conn, 0)
	c.next_id = 0

	c.defaulthandler = func(ws *websocket.Conn, id int, s string) {
		log.Printf("Uncaught message of numver %d: %s\n", id, s)
	}

	return c
}

func (cs *Connections) AddConnection(c *websocket.Conn) {
	cs.conn_dict[cs.next_id] = c
	cs.next_id++
}

func (cs *Connections) AddHandler(id int, handler func(*websocket.Conn, string)) {
	cs.handlers[id] = handler
}
