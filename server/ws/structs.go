package ws

import (
	"fmt"
	"log"
	"math/rand"

	"github.com/gorilla/websocket"
)

type UserColor string

var userColorPalette []UserColor = []UserColor{
	"#336699", "#008318", "#B49A67", "#CEB3AB", "#C4C6E7", "#A0C1B9",
	"#FF37A6", "#FFCAE9", "#5CF64A", "#B56576", "#E56B6F", "#EAAC8B",
}

type UserData struct {
	conn   *websocket.Conn
	cookie uint64
	name   string
	color  UserColor
}

// TODO: i feel like i might open a security hole here
// there is the indexing number and then theres a cookie
type Connections struct {
	conn_dict      map[int]*UserData
	next_id        int
	handlers       map[int]func(*websocket.Conn, string)
	defaulthandler func(*websocket.Conn, int, string)
}

func CreateConnectionsStruct() *Connections {
	var c Connections
	c.conn_dict = make(map[int]*UserData, 0)
	c.handlers = make(map[int]func(*websocket.Conn, string))

	c.next_id = 0

	c.defaulthandler = func(ws *websocket.Conn, id int, s string) {
		log.Printf("Uncaught message of number %d: %s\n", id, s)
		// TODO: this is here for testing only
		for _, udata := range c.conn_dict {
			log.Printf("Writing msg <%s> to %s\n", fmt.Sprintf("%c%s", id+32, s), udata.name)
			udata.conn.WriteMessage(websocket.TextMessage,
				[]byte(fmt.Sprintf("%c%s", id+32, s)))
		}
		log.Printf("Done handling msg\n")
	}

	return &c
}

func (cs *Connections) AddConnection(c *websocket.Conn, name string) (int, uint64) {
	// TODO: more secure cookies
	uid, cookie := cs.next_id, rand.Uint64()
	udt := UserData{
		conn:   c,
		cookie: cookie,
		name:   name,
		color:  userColorPalette[uid%len(userColorPalette)],
	}
	cs.conn_dict[uid] = &udt
	cs.next_id++
	return uid, cookie
}

func (cs *Connections) AddHandler(id int, handler func(*websocket.Conn, string)) {
	cs.handlers[id] = handler
}

func (cs *Connections) GetUserData() []*UserData {
	tor := []*UserData{}
	for _, v := range cs.conn_dict {
		tor = append(tor, v)
	}
	return tor
}

func WriteMessageToUserDataStruct(ud *UserData, id int, s string) {
	ud.conn.WriteMessage(websocket.TextMessage,
		[]byte(fmt.Sprintf("%c%s", id+32, s)))
}

func WriteMessageToUserConn(ws *websocket.Conn, id int, s string) {
	ws.WriteMessage(websocket.TextMessage,
		[]byte(fmt.Sprintf("%c%s", id+32, s)))
}
