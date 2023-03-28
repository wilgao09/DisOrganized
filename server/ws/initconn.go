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

func Init() {
	currconnections = CreateConnectionsStruct()
}

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

func EstablishConnection(w http.ResponseWriter, r *http.Request) {

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("error upgrading")
		log.Println(err)
		return //TODO: how does this error out?
	}
	currconnections.AddConnection(conn)

	listenws(conn)
}
