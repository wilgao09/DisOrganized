package boards

import (
	dbutil "williamgao09/disorganized/db"
	wsutil "williamgao09/disorganized/ws"
)

type Board struct {
	conns wsutil.Connections
	db    dbutil.DoDb
}

// import ("github.com/gorilla/websocket"
// )

// const (
// 	c_newdiff int = 0
// )

// func newdiff(c *websocket.Conn, v string) {
// 	var cs = GetConnectionsStruct()
// 	dbutil.
// }

// func InstallHandlers() {

// }
