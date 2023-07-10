package ws

import (
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

type UserColor string

var UserColorPalette []UserColor = []UserColor{
	"#336699", "#008318", "#B49A67", "#CEB3AB", "#C4C6E7", "#A0C1B9",
	"#FF37A6", "#FFCAE9", "#5CF64A", "#B56576", "#E56B6F", "#EAAC8B",
}

var DefaultBrush = "{\"strokeStyle\":\"#000000\",\"lineWidth\":5}"

type UserData struct {
	conn   *websocket.Conn
	cookie string
	name   string
	color  UserColor
	id     int
	brush  string
}

// TODO: i feel like i might open a security hole here
// there is the indexing number and then theres a cookie
// TODO: might need a lock; double check alter
type Connections struct {
	conn_dict      map[int]*UserData
	next_id        int
	handlers       map[int]func(*websocket.Conn, int, string)
	defaulthandler func(*websocket.Conn, int, int, string)
}

func CreateConnectionsStruct() *Connections {
	var c Connections
	c.conn_dict = make(map[int]*UserData, 0)
	c.handlers = make(map[int]func(*websocket.Conn, int, string))

	c.next_id = 0

	c.defaulthandler = func(ws *websocket.Conn, id int, senderid int, s string) {
		log.Printf("Uncaught message of number %d from user %d: %s\n", id, senderid, s)
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

func (cs *Connections) AddConnection(c *websocket.Conn, name string, cookie string) int {
	uid := cs.next_id
	udt := UserData{
		conn:   c,
		cookie: cookie,
		name:   name,
		color:  UserColorPalette[uid%len(UserColorPalette)],
		id:     uid,
		brush:  DefaultBrush,
	}
	cs.conn_dict[uid] = &udt
	cs.next_id++
	return uid
}

func (cs *Connections) AddHandler(id int, handler func(*websocket.Conn, int, string)) {
	cs.handlers[id] = handler
}

func (cs *Connections) GetUserData() ([]*UserData, []int) {
	tor := []*UserData{}
	ids := []int{}
	for i, v := range cs.conn_dict {
		tor = append(tor, v)
		ids = append(ids, i)
	}
	return tor, ids
}

func (cs *Connections) Get(id int) *UserData {
	return cs.conn_dict[id]
}

func (cs *Connections) SendToAll(id int, s string, excludes []int) {
	var excludeMap = make(map[int]bool)
	for _, v := range excludes {
		excludeMap[v] = true
	}

	for k, v := range cs.conn_dict {
		if excludeMap[k] {
			continue
		}
		WriteMessageToUserDataStruct(v, id, s)
	}
}

func (cs *Connections) UserDataOfCookie(cookie string) *UserData {
	for _, v := range cs.conn_dict {
		if v.cookie == cookie {
			return v
		}
	}
	return nil
}

func WriteMessageToUserDataStruct(ud *UserData, id int, s string) {
	ud.conn.WriteMessage(websocket.TextMessage,
		[]byte(fmt.Sprintf("%c%s", id+32, s)))
}

func WriteMessageToUserConn(ws *websocket.Conn, id int, s string) {
	ws.WriteMessage(websocket.TextMessage,
		[]byte(fmt.Sprintf("%c%s", id+32, s)))
}

func (ud *UserData) GetName() string {
	return ud.name
}

func (ud *UserData) GetColor() string {
	return string(ud.color)
}

func (ud *UserData) GetBrush() string {
	return ud.brush
}

func (ud *UserData) SetBrush(nb string) {
	// TODO: validate that this is a valid brush somehow
	ud.brush = nb
}

/**
 * Return a websocket semndable string
 * Format is the fields separated by \v in the following order:
 *		cookie, id, name
 *
 */
func (ud *UserData) String() string {
	return fmt.Sprintf("%s\v%d\v%s", ud.cookie, ud.id, ud.name)
}

// func (ud *UserData) OwnsConn(c *websocket.Conn) bool {
// 	return c == ud.conn
// }
