package main

import (
	"fmt"
	"strings"
	"williamgao09/disorganized/db"

	wsutil "williamgao09/disorganized/ws"

	"github.com/gorilla/websocket"
)

// TODO: everything below here needs to be organized
// CHECK WSUTIL.TS

const ( // TODO: dont make these globals like this
	MESSAGE = iota
	FETCH
	CREATE
	// MOVE
	DELTA
	ADD_USER
	DELETE_USER
	DELTA_USER
	GET_USERS
	GET_USER_COLORS
	POINTER_MOVED

	ERR = 127
)

func setUpWSHandlers() {
	connstruct := wsutil.GetConnectionsStruct()
	connstruct.AddHandler(MESSAGE, func(c *websocket.Conn, uid int, s string) {
		userdata, _ := connstruct.GetUserData()
		for _, udata := range userdata {
			wsutil.WriteMessageToUserDataStruct(udata, 0, s)
		}
	})

	connstruct.AddHandler(FETCH, func(c *websocket.Conn, uid int, s string) {
		currobjs, err := db.GetCurrentOpenBoard().GetObjects()
		if err != nil {
			wsutil.WriteMessageToUserConn(c, 127, "Failed to fetch")
			return
		}
		wsutil.WriteMessageToUserConn(c, 1, fmt.Sprintf(
			"[%s]", strings.Join(currobjs, ",")))
	})

	connstruct.AddHandler(CREATE, func(c *websocket.Conn, uid int, s string) {
		if s, status := db.GetCurrentOpenBoard().AddObject(s); status {
			userdata, _ := connstruct.GetUserData()
			for _, udata := range userdata {
				wsutil.WriteMessageToUserDataStruct(udata, 2, s)
			}
		} else {
			wsutil.WriteMessageToUserConn(c, 127, "Failed to add")
		}

	})

	connstruct.AddHandler(GET_USERS, func(c *websocket.Conn, uid int, s string) {
		response := ""
		userdata, userids := connstruct.GetUserData()
		for i, v := range userids {
			response =
				fmt.Sprintf("%s%d\v%s\v", response, v, userdata[i].GetName())
		}
		// TODO: verify safety
		wsutil.WriteMessageToUserConn(c, GET_USERS, response[:len(response)-1])
	})

	connstruct.AddHandler((GET_USER_COLORS), func(c *websocket.Conn, uid int, s string) {
		// stringify the colors
		response := make([]string, len(wsutil.UserColorPalette))
		for i, c := range wsutil.UserColorPalette {
			response[i] = string(c)
		}
		wsutil.WriteMessageToUserConn(c, GET_USER_COLORS,
			strings.Join(response, "\v"))
	})

	connstruct.AddHandler(POINTER_MOVED, func(c *websocket.Conn, uid int, s string) {
		userdata, userids := connstruct.GetUserData()
		// send to everyone but this one
		for i, someid := range userids {
			if someid != uid {
				wsutil.WriteMessageToUserDataStruct(userdata[i], POINTER_MOVED, s)
			}
		}

	})
}