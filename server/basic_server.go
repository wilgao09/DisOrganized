package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"williamgao09/disorganized/db"
	ipcutil "williamgao09/disorganized/ipc"
	wsutil "williamgao09/disorganized/ws"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

const portno = 11326

// "github.com/gin-gonic/gin"

// func checkError(err error, phase string) {
// 	if err != nil {
// 		fmt.Println("failed at ", phase, " for the following reason")
// 		fmt.Println(err)
// 		return
// 	}
// 	fmt.Println("passed phase ", phase)

// }

func main() {
	// log file location
	f, err := os.OpenFile("server_log.txt", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}
	defer f.Close()

	log.SetOutput(f)

	home, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("cannot read user home")
	}
	ipcutil.SetCurrentWorkingDirectory(home + "/DisOrganized/boards")
	ipcutil.SetCurrentPluginDirectory(home + "/DisOrganized/plugins")

	log.Printf("Plugins directory is set to %s\n", ipcutil.GetPluginsDirectory())

	// fmt.Printf("hello world\n")

	// err := dbutil.Init("../../..")
	// if err != nil {
	// 	log.Fatal("Failed to initialize the boards directory")
	// }

	// err := dbutil.Create_db_file("kiki")
	// if !err {
	// 	log.Fatal(err)
	// } else {
	// 	fmt.Println("found")
	// }
	// db, e := dbutil.Init_struct("kiki")
	// if e != nil {
	// 	log.Fatal(e)
	// } else {
	// 	fmt.Println("db struct initted")
	// }
	// b := db.AddObject("{\"x\": 100, \"y\":100, \"w\":100, \"h\": 100}")
	// if !b {
	// 	fmt.Println("failed to add object")
	// }

	// db.ApplyDiff(dbutil.DbDiff{
	// 	Dtype:   dbutil.DT_UPDATE,
	// 	Id:      2,
	// 	Content: "{\"x\": 5000, \"y\": 6000}",
	// })

	// fmt.Println(db.GetObjects())

	// initialize ws stuff
	wsutil.Init()
	setUpWSHandlers()
	os.MkdirAll(ipcutil.GetPluginsDirectory(), os.ModePerm)

	log.Println("starting server")
	gin.SetMode(gin.ReleaseMode)
	gin.DefaultWriter = ioutil.Discard

	server := gin.Default()

	server.Use(cors.New(cors.Config{
		AllowOrigins:  []string{"*"}, // TODO: can we do better?
		AllowMethods:  []string{"GET"},
		AllowHeaders:  []string{"Origin"},
		ExposeHeaders: []string{"Content-Length"},
		// AllowCredentials: true,
		// AllowOriginFunc: func(origin string) bool {
		// 	return origin == "https://github.com"
		// },
		MaxAge: 12 * time.Hour,
	}))

	server.GET("/helloworld", func(ctx *gin.Context) {
		ctx.JSON(200, gin.H{
			"msg": "HELLO WORLD",
		})
	})

	// server.GET("/api/retrieveFile")
	// server.GET("/api/retrieveConfig")

	// server.POST("/api/addDep")
	// server.POST("/api/createFile")
	// server.POST("/api/openFile")
	// server.POST("/api/closeFile")
	// server.POST("/api/diff/:name")

	server.GET("/connectws/:name", func(ctx *gin.Context) {

		log.Println("Requesting permission from admin . . .")
		if db.HasOpenBoard() && ipcutil.NewConnectionRequest(ctx.Param("name"), getRequestIP(ctx.Request)) {
			wsutil.EstablishConnection(ctx.Writer, ctx.Request, ctx.Param("name"))
		} else {
			// TODO: this doesnt tell the client anything because websocket connection fails
			// were designed to fail silently for security reasons
			// FIX THIS by connecting and sending the failure reason and closing up
			ctx.JSON(403, gin.H{
				"msg": "Admin refused",
			})
		}
	})

	// TODO: add security
	server.StaticFS("/plugins", http.Dir(ipcutil.GetPluginsDirectory()))
	server.GET("/config", func(ctx *gin.Context) {
		returnData := *(db.GetCurrentOpenBoard().GetConfig())
		ctx.JSON(200, returnData)
	})

	log.Printf("Spawning stdio listeners\n")
	go ipcutil.IpcListen()

	log.Printf("server running on %d\n", portno)
	server.Run(fmt.Sprintf(":%d", portno))
	log.Println("server died!")
}

func getRequestIP(req *http.Request) string {
	clientIp := req.Header.Get("X-FORWARDED-FOR")
	if clientIp != "" {
		return clientIp
	}
	return req.RemoteAddr
}

// TODO: everything below here needs to be organized

const ( // TODO: dont make these globals like this
	MESSAGE = iota
	FETCH
	CREATE

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
