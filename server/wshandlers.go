package main

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"williamgao09/disorganized/db"
	"williamgao09/disorganized/ws"

	wsutil "williamgao09/disorganized/ws"

	"github.com/gorilla/websocket"
)

// TODO: everything below here needs to be organized
// CHECK WSUTIL.TS

const ( // TODO: dont make these globals like this
	MESSAGE = iota
	FETCH
	CREATE
	DELTA
	DELETE
	ADD_USER
	DELETE_USER
	DELTA_USER
	GET_USERS
	GET_USER_COLORS
	POINTER_MOVED
	GET_MY_DATA
	SET_BRUSH
	GET_BRUSH
	BRUSH_DOWN
	BRUSH_UP

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

	//TODO: DELTA

	connstruct.AddHandler(DELETE, func(c *websocket.Conn, i int, s string) {
		id, err := strconv.Atoi(s)
		if err != nil {
			log.Printf("Failed to idenitfy an id based on %s\n", s)
			wsutil.WriteMessageToUserConn(c, 127, "Failed to delete")
			return
		}
		if err = db.GetCurrentOpenBoard().ApplyDiff((db.DbDiff{
			Dtype:   db.DT_REMOVE,
			Id:      id,
			Content: "",
		})); err == nil {
			userdata, _ := connstruct.GetUserData()
			for _, udata := range userdata {
				wsutil.WriteMessageToUserDataStruct(udata, DELETE, s)
			}
		} else {
			wsutil.WriteMessageToUserConn(c, 127, "Failed to delete")
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

	// NOTE: since this is a function that is user specific
	// we will prepend the outgoing messages with the sender
	// id
	connstruct.AddHandler(POINTER_MOVED, func(c *websocket.Conn, uid int, s string) {
		userdata, userids := connstruct.GetUserData()
		s = fmt.Sprintf("%d\v%s", uid, s)
		// send to everyone but this one
		for i, someid := range userids {
			if someid != uid {
				wsutil.WriteMessageToUserDataStruct(userdata[i], POINTER_MOVED, s)
			}
		}

	})

	connstruct.AddHandler((GET_MY_DATA), func(c *websocket.Conn, i int, s string) {
		data := connstruct.Get(i)
		wsutil.WriteMessageToUserDataStruct(data,
			GET_MY_DATA, data.String())
	})

	connstruct.AddHandler(SET_BRUSH, func(c *websocket.Conn, i int, s string) {
		ud := connstruct.Get(i)
		ud.SetBrush(s)
		userdata, _ := connstruct.GetUserData()
		for _, otherdata := range userdata {
			wsutil.WriteMessageToUserDataStruct((otherdata), SET_BRUSH,
				fmt.Sprintf("%d\v%s", i, s))
		}
	})

	connstruct.AddHandler(GET_BRUSH, func(c *websocket.Conn, i int, s string) {
		uid, err := strconv.Atoi(s)
		if err != nil {
			// send default brush
			wsutil.WriteMessageToUserConn(c, GET_BRUSH, ws.DefaultBrush)
			return
		}
		wsutil.WriteMessageToUserConn(c, GET_BRUSH, connstruct.Get(uid).GetBrush())

	})

	connstruct.AddHandler(BRUSH_DOWN, func(c *websocket.Conn, i int, s string) {
		connstruct.SendToAll(BRUSH_DOWN, fmt.Sprintf("%d", i), []int{i})
	})

	connstruct.AddHandler(BRUSH_UP, func(c *websocket.Conn, i int, s string) {
		connstruct.SendToAll(BRUSH_UP, fmt.Sprintf("%d", i), []int{i})
	})

}
