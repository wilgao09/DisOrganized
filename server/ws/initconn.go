package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var currconnections Connections

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(_ *http.Request) bool { return true }, //TODO: SEVERE remove this
}

func GetConnectionsStruct() Connections {
	return currconnections
}

func Init() {
	currconnections = CreateConnectionsStruct()
	// handelrs here
}

// listenws continually listens to a websocket. This function does not return.
// When a message arrives through this websocket, it is expected that the message follow
// the form [byte][msg] where byte is 8 bits denoting what type of message it is, and msg
// is the message in JSON.
func listenws(c *websocket.Conn) {
	for {
		msgtype, p, err := c.ReadMessage()
		if err != nil || msgtype != websocket.TextMessage {
			log.Printf("Errored trying to read from ws\n")
			continue
		}

		msg := string(p)

		if len(p) == 0 {
			log.Println("Got 0 length msg")
			continue
		}

		//TODO: modularize and pray that the compiler optimizes this
		handlerno := int([]rune(msg)[0]) - 32 //32 is ws

		if currconnections.handlers[handlerno] == nil {
			currconnections.defaulthandler(c, handlerno, msg[1:])
		} else {
			currconnections.handlers[handlerno](c, msg[1:])
		}

	}
}

// EstablishConnection takes a request and upgrades the connection to a websocket.
// This function does not return.
func EstablishConnection(w http.ResponseWriter, r *http.Request, name string) {

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("error upgrading")
		log.Println(err)
		return //TODO: how does this error out?
	}
	currconnections.AddConnection(conn, name)

	listenws(conn)
}
