package ws

import (
	"log"
	"math/rand"

	"github.com/gorilla/websocket"
)

type UserData struct {
	conn   *websocket.Conn
	cookie uint64
	name   string
}

// TODO: i feel like i might open a security hole here
// there is the indexing number and then theres a cookie
type Connections struct {
	conn_dict      map[int]UserData
	next_id        int
	handlers       map[int]func(*websocket.Conn, string)
	defaulthandler func(*websocket.Conn, int, string)
}

func CreateConnectionsStruct() Connections {
	var c Connections
	c.conn_dict = make(map[int]UserData, 0)

	c.next_id = 0

	c.defaulthandler = func(ws *websocket.Conn, id int, s string) {
		log.Printf("Uncaught message of number %d: %s\n", id, s)
	}

	return c
}

func (cs *Connections) AddConnection(c *websocket.Conn, name string) (int, uint64) {
	uid, cookie := cs.next_id, rand.Uint64()
	cs.conn_dict[uid] = UserData{
		conn:   c,
		cookie: cookie,
		name:   name,
	}
	cs.next_id++
	return uid, cookie
}

func (cs *Connections) AddHandler(id int, handler func(*websocket.Conn, string)) {
	cs.handlers[id] = handler
}
