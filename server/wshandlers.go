package main

import (
	"fmt"
	"strings"
	"williamgao09/disorganized/db"

	wsutil "williamgao09/disorganized/ws"

	"github.com/gorilla/websocket"
)

// TODO: everything below here needs to be organized

const ( // TODO: dont make these globals like this
	MESSAGE = iota
	FETCH
	CREATE
	MOVE
	DELTA
	ADD_USER
	DELETE_USER
	DELTA_USER

	// ERR = 127
)

func setUpWSHandlers() {
	connstruct := wsutil.GetConnectionsStruct()
	connstruct.AddHandler(MESSAGE, func(c *websocket.Conn, s string) {
		for _, udata := range connstruct.GetUserData() {
			wsutil.WriteMessageToUserDataStruct(udata, 0, s)
		}
	})

	connstruct.AddHandler(FETCH, func(c *websocket.Conn, s string) {
		currobjs, err := db.GetCurrentOpenBoard().GetObjects()
		if err != nil {
			wsutil.WriteMessageToUserConn(c, 127, "Failed to fetch")
			return
		}
		wsutil.WriteMessageToUserConn(c, 1, fmt.Sprintf(
			"[%s]", strings.Join(currobjs, ",")))
	})

	connstruct.AddHandler(CREATE, func(c *websocket.Conn, s string) {
		if s, status := db.GetCurrentOpenBoard().AddObject(s); status {
			for _, udata := range connstruct.GetUserData() {
				wsutil.WriteMessageToUserDataStruct(udata, 2, s)
			}
		} else {
			wsutil.WriteMessageToUserConn(c, 127, "Failed to add")
		}

	})
}
