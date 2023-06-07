package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	ipcutil "williamgao09/disorganized/ipc"
	wsutil "williamgao09/disorganized/ws"

	"github.com/gin-gonic/gin"
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
	f, err := os.OpenFile("server_log.txt", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}
	defer f.Close()

	log.SetOutput(f)
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

	log.Println("starting server")
	gin.SetMode(gin.ReleaseMode)
	gin.DefaultWriter = ioutil.Discard

	server := gin.Default()

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
		if ipcutil.NewConnectionRequest(ctx.Param("name"), getRequestIP(ctx.Request)) {
			wsutil.EstablishConnection(ctx.Writer, ctx.Request, ctx.Param("name"))
		} else {
			ctx.JSON(403, gin.H{
				"msg": "Admin refused",
			})
		}

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
